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
let signInWithRedirect;
let signOut;

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
    case "auth/network-request-failed":
      return "Couldn't reach Google. Check your connection and try again.";
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
    const useRedirect = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 700;
    if (useRedirect) {
      await signInWithRedirect(firebaseAuth, provider);
      return;
    }
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
    signInWithRedirect = authSdk.signInWithRedirect;
    signOut = authSdk.signOut;

    authSdk.onAuthStateChanged(firebaseAuth, (user) => {
      activeUser = user;
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
