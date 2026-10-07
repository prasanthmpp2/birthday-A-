const PAGE_IDS = new Set([
  "opening",
  "chapter-one",
  "birthday-reveal",
  "birthday-message",
  "personal-note",
  "song-scene",
  "chapter-three-final",
]);

const SESSION_IDLE_LIMIT_MS = 30 * 60 * 1000;
const SESSION_KEY_PREFIX = "birthday-2026-session:";

function safeWarn(error) {
  // Never log account identifiers or block the experience when tracking fails.
  console.warn("[Journey tracking] A Firestore update did not complete.", error?.code ?? "unknown");
}

function makeSessionId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readStoredSession(uid) {
  try {
    const raw = sessionStorage.getItem(`${SESSION_KEY_PREFIX}${uid}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeSession(uid, session) {
  try {
    sessionStorage.setItem(`${SESSION_KEY_PREFIX}${uid}`, JSON.stringify(session));
  } catch {
    // If browser storage is unavailable, this tab keeps an in-memory session.
  }
}

export function createJourneyTracker(db, firestore) {
  const {
    Timestamp,
    doc,
    getDoc,
    increment,
    runTransaction,
    serverTimestamp,
    writeBatch,
  } = firestore;

  let context = null;
  let writeQueue = Promise.resolve();

  function enqueue(operation) {
    writeQueue = writeQueue.then(operation).catch(safeWarn);
  }

  function validPage(page) {
    return typeof page === "string" && PAGE_IDS.has(page);
  }

  function savePage(page, { chapterOneOpened = false, chapterThreeReached = false } = {}) {
    const active = context;
    if (!active || !validPage(page)) return;

    active.lastPage = page;
    active.lastActivityAtMs = Date.now();
    storeSession(active.uid, active.storageState());

    enqueue(async () => {
      const batch = writeBatch(db);
      const summaryUpdate = {
        lastPage: page,
        updatedAt: serverTimestamp(),
      };
      const sessionUpdate = {
        lastPage: page,
        endedAt: null,
        durationSeconds: active.durationSeconds(),
      };

      if (chapterOneOpened) {
        summaryUpdate.chapter1Visited = true;
        summaryUpdate.chapter1VisitCount = increment(1);
      }
      if (chapterThreeReached) summaryUpdate.chapter3Reached = true;

      batch.update(active.userRef, summaryUpdate);
      batch.update(active.sessionRef, sessionUpdate);
      await batch.commit();
    });
  }

  function handleEvent(detail) {
    if (!detail || typeof detail !== "object") return;

    if (detail.type === "page_view") {
      savePage(detail.page, {
        chapterOneOpened: detail.page === "chapter-one",
        chapterThreeReached: detail.page === "chapter-three-final",
      });
      return;
    }

    const active = context;
    if (!active) return;

    if (detail.type === "song_playthrough_started") {
      active.lastActivityAtMs = Date.now();
      storeSession(active.uid, active.storageState());
      enqueue(async () => {
        await runTransaction(db, async (transaction) => {
          const summarySnapshot = await transaction.get(active.userRef);
          if (!summarySnapshot.exists()) throw new Error("Journey summary is missing.");
          const isReplay = (summarySnapshot.data().songPlayCount ?? 0) > 0;
          transaction.update(active.userRef, {
            songStarted: true,
            songPlayCount: increment(1),
            ...(isReplay ? { songReplayCount: increment(1) } : {}),
            updatedAt: serverTimestamp(),
          });
          transaction.update(active.sessionRef, {
            lastPage: "song-scene",
            endedAt: null,
            durationSeconds: active.durationSeconds(),
          });
        });
      });
      return;
    }

    if (detail.type === "song_completed") {
      active.lastActivityAtMs = Date.now();
      storeSession(active.uid, active.storageState());
      enqueue(async () => {
        const batch = writeBatch(db);
        batch.update(active.userRef, {
          songCompleted: true,
          updatedAt: serverTimestamp(),
        });
        batch.update(active.sessionRef, {
          lastPage: "song-scene",
          endedAt: null,
          durationSeconds: active.durationSeconds(),
        });
        await batch.commit();
      });
    }
  }

  async function initializeSession(active, initialPage, authSignInTime) {
    await runTransaction(db, async (transaction) => {
      const [summarySnapshot, sessionSnapshot] = await Promise.all([
        transaction.get(active.userRef),
        transaction.get(active.sessionRef),
      ]);
      const isNewVisit = !sessionSnapshot.exists() || !summarySnapshot.exists();
      const isChapterOneEntry = isNewVisit && initialPage === "chapter-one";
      const loginTime = authSignInTime ?? Timestamp.fromDate(new Date());
      const currentSummary = summarySnapshot.exists() ? summarySnapshot.data() : null;

      let loginCount = 1;
      let firstLoginAt = serverTimestamp();
      let lastLoginAt = authSignInTime ?? serverTimestamp();
      if (currentSummary) {
        const previousLoginMillis = currentSummary.lastLoginAt?.toMillis?.() ?? 0;
        const currentLoginMillis = authSignInTime?.toMillis?.() ?? previousLoginMillis;
        const isNewGoogleLogin = currentLoginMillis > previousLoginMillis;
        loginCount = (currentSummary.loginCount ?? 0) + Number(isNewGoogleLogin);
        firstLoginAt = currentSummary.firstLoginAt ?? loginTime;
        lastLoginAt = isNewGoogleLogin ? loginTime : currentSummary.lastLoginAt;
      }

      const isFirstVisit = !currentSummary;
      const initialChapterOneCount = isChapterOneEntry ? 1 : 0;
      const summary = {
        firstLoginAt,
        lastLoginAt,
        loginCount,
        visitCount: (currentSummary?.visitCount ?? 0) + Number(isNewVisit),
        firstVisitAt: currentSummary?.firstVisitAt ?? serverTimestamp(),
        lastVisitAt: isNewVisit || isFirstVisit ? serverTimestamp() : currentSummary.lastVisitAt,
        chapter1Visited: Boolean(currentSummary?.chapter1Visited) || isChapterOneEntry,
        chapter1VisitCount: (currentSummary?.chapter1VisitCount ?? 0) + initialChapterOneCount,
        chapter2Visits: (currentSummary?.chapter2Visits ?? 0) + Number(isNewVisit),
        chapter3Reached: Boolean(currentSummary?.chapter3Reached),
        songStarted: Boolean(currentSummary?.songStarted),
        songCompleted: Boolean(currentSummary?.songCompleted),
        songPlayCount: currentSummary?.songPlayCount ?? 0,
        songReplayCount: currentSummary?.songReplayCount ?? 0,
        lastPage: initialPage,
        updatedAt: serverTimestamp(),
      };

      transaction.set(active.userRef, summary);
      const previousSession = sessionSnapshot.exists() ? sessionSnapshot.data() : null;
      transaction.set(active.sessionRef, {
        sessionId: active.sessionId,
        startedAt: previousSession?.startedAt ?? serverTimestamp(),
        endedAt: null,
        durationSeconds: active.durationSeconds(),
        lastPage: initialPage,
      });
    });
  }

  function start(user, initialPage) {
    if (!user?.uid || context?.uid === user.uid) return;
    if (context) endSession({ removeStorage: true });

    const uid = user.uid;
    const now = Date.now();
    const stored = readStoredSession(uid);
    const reusable = stored
      && typeof stored.sessionId === "string"
      && Number.isFinite(stored.startedAtMs)
      && Number.isFinite(stored.lastActivityAtMs)
      && now - stored.lastActivityAtMs < SESSION_IDLE_LIMIT_MS;
    const session = reusable
      ? { ...stored, lastActivityAtMs: now }
      : { sessionId: makeSessionId(), startedAtMs: now, lastActivityAtMs: now };

    const safeInitialPage = validPage(initialPage) ? initialPage : "opening";
    const userRef = doc(db, "users", uid);
    const sessionRef = doc(db, "users", uid, "sessions", session.sessionId);
    const authDate = user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null;
    const authSignInTime = authDate && Number.isFinite(authDate.getTime())
      ? Timestamp.fromDate(authDate)
      : null;

    const active = {
      uid,
      userRef,
      sessionRef,
      sessionId: session.sessionId,
      startedAtMs: session.startedAtMs,
      lastActivityAtMs: session.lastActivityAtMs,
      lastPage: safeInitialPage,
      storageState() {
        return {
          sessionId: this.sessionId,
          startedAtMs: this.startedAtMs,
          lastActivityAtMs: this.lastActivityAtMs,
        };
      },
      durationSeconds() {
        return Math.max(0, Math.floor((Date.now() - this.startedAtMs) / 1000));
      },
    };
    context = active;
    storeSession(uid, active.storageState());

    enqueue(() => initializeSession(active, safeInitialPage, authSignInTime));
  }

  function endSession({ removeStorage = false } = {}) {
    const active = context;
    if (!active) return;
    if (removeStorage) {
      try { sessionStorage.removeItem(`${SESSION_KEY_PREFIX}${active.uid}`); } catch { /* optional browser storage */ }
      context = null;
    }

    enqueue(async () => {
      const batch = writeBatch(db);
      batch.update(active.sessionRef, {
        endedAt: serverTimestamp(),
        durationSeconds: active.durationSeconds(),
      });
      await batch.commit();
    });
  }

  function stop() {
    endSession({ removeStorage: true });
  }

  function finishOnPageHide() {
    endSession();
  }

  function resumeSession() {
    const active = context;
    if (!active) return;
    active.lastActivityAtMs = Date.now();
    storeSession(active.uid, active.storageState());
    enqueue(async () => {
      const batch = writeBatch(db);
      batch.update(active.sessionRef, {
        endedAt: null,
        durationSeconds: active.durationSeconds(),
        lastPage: active.lastPage,
      });
      batch.update(active.userRef, {
        lastPage: active.lastPage,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    });
  }

  return { start, stop, handleEvent, finishOnPageHide, resumeSession, flush: () => writeQueue };
}
