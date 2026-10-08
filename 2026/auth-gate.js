import { createJourneyTracker } from "./journey-tracker.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyClJpLNNLSUJDQMQTpUxSAAmIZOonply5M",
  authDomain: "ai-study-assistant-68a1b.firebaseapp.com",
  projectId: "ai-study-assistant-68a1b",
  storageBucket: "ai-study-assistant-68a1b.firebasestorage.app",
  messagingSenderId: "161466333928",
  appId: "1:161466333928:web:6494e7c3ae4a95a4d0675d",
  measurementId: "G-72CVS211D2",
};

const authGate = document.querySelector("#auth-gate");
const birthdaySite = document.querySelector("#birthday-site");
const signInButton = document.querySelector("#google-sign-in");
const signOutButton = document.querySelector("#auth-signout");
const authStatus = document.querySelector("#auth-status");

let activeUser = null;
let authResolved = false;
let appReady = document.documentElement.dataset.birthdayAppReady === "true";
let firebaseAuth;
let GoogleAuthProvider;
let signInWithPopup;
let signOut;
let journeyTracker = null;
const pendingJourneyEvents = [];

document.addEventListener("birthday-journey-event", (event) => {
  if (journeyTracker) {
    journeyTracker.handleEvent(event.detail);
  } else if (activeUser && pendingJourneyEvents.length < 64) {
    pendingJourneyEvents.push(event.detail);
  }
});

window.addEventListener("pagehide", () => journeyTracker?.finishOnPageHide());
window.addEventListener("pageshow", (event) => {
  if (event.persisted) journeyTracker?.resumeSession();
});

function startJourneyTracking(user) {
  if (!user || !journeyTracker) return;
  const currentPage = document.querySelector(".scene.is-active")?.id ?? "opening";
  journeyTracker.start(user, currentPage);
}

function loadJourneyTracking(app) {
  import("https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js")
    .then((firestoreSdk) => {
      const database = firestoreSdk.getFirestore(app);
      journeyTracker = createJourneyTracker(database, firestoreSdk);
      startJourneyTracking(activeUser);
      pendingJourneyEvents.splice(0).forEach((eventDetail) => journeyTracker.handleEvent(eventDetail));
    })
    .catch((error) => {
      // Firestore is optional to the experience. Auth, navigation, and media continue.
      console.warn("[Journey tracking] Firestore could not be initialized.", error?.code ?? "unknown");
      pendingJourneyEvents.length = 0;
    });
}

function setStatus(message, isError = false) {
  authStatus.textContent = message;
  authStatus.classList.toggle("is-error", isError);
}

function renderAccessState() {
  const canEnter = authResolved && Boolean(activeUser) && appReady;
  authGate.hidden = canEnter;
  birthdaySite.hidden = !canEnter;
  signOutButton.hidden = !canEnter;

  if (authResolved && !activeUser) setStatus("Sign in with Google to continue.");
}

document.addEventListener("birthday-app-ready", () => {
  appReady = true;
  renderAccessState();
});

function explainAuthError(error) {
  switch (error?.code) {
    case "auth/unauthorized-domain":
      return "This website address isn't authorized yet. Add its domain in Firebase Authentication settings.";
    case "auth/operation-not-allowed":
      return "Google sign-in isn't enabled for this Firebase project yet.";
    case "auth/popup-closed-by-user":
      return "The Google sign-in window was closed. You can try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
    case "auth/cancelled-popup-request":
      return "A Google sign-in window is already open. Finish it or close it, then try again.";
    case "auth/network-request-failed":
      return "Couldn't reach Google. Check your connection and try again.";
    case "auth/web-storage-unsupported":
    case "auth/operation-not-supported-in-this-environment":
      return "Google sign-in needs browser storage and pop-ups enabled for this site.";
    default:
      return "Google sign-in couldn't be completed. Please try again.";
  }
}

async function startGoogleSignIn() {
  signInButton.disabled = true;
  setStatus("Opening Google sign-in…");

  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    // GitHub Pages is outside Firebase Hosting. Redirect sign-in can fail in
    // browsers that partition third-party storage, so use Firebase's popup
    // flow consistently across desktop and mobile browsers.
    await signInWithPopup(firebaseAuth, provider);
  } catch (error) {
    setStatus(explainAuthError(error), true);
    signInButton.disabled = false;
  }
}

async function initializeFirebaseAuth() {
  try {
    const [appSdk, authSdk] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js"),
    ]);

    const app = appSdk.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = authSdk.getAuth(app);
    GoogleAuthProvider = authSdk.GoogleAuthProvider;
    signInWithPopup = authSdk.signInWithPopup;
    signOut = authSdk.signOut;

    // Load tracking independently so a Firestore outage cannot block Google sign-in.
    loadJourneyTracking(app);

    authSdk.onAuthStateChanged(firebaseAuth, (user) => {
      activeUser = user;
      if (user) startJourneyTracking(user);
      else {
        journeyTracker?.stop();
        pendingJourneyEvents.length = 0;
      }
      authResolved = true;
      renderAccessState();
    }, (error) => {
      authResolved = true;
      renderAccessState();
      setStatus(explainAuthError(error), true);
    });

    try {
      await authSdk.getRedirectResult(firebaseAuth);
    } catch (error) {
      setStatus(explainAuthError(error), true);
    }

    signInButton.disabled = false;
    signInButton.addEventListener("click", startGoogleSignIn);
    signOutButton.addEventListener("click", async () => {
      signOutButton.disabled = true;
      try {
        await signOut(firebaseAuth);
        window.dispatchEvent(new Event("birthday-session-reset"));
      } catch {
        setStatus("Couldn't sign out. Please try again.", true);
      } finally {
        signOutButton.disabled = false;
      }
    });
  } catch {
    authResolved = true;
    renderAccessState();
    signInButton.disabled = true;
    setStatus("Sign-in couldn't load. Check your connection and refresh the page.", true);
  }
}

initializeFirebaseAuth();
