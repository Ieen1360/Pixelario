// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD56r1Hqn6PoN4uFJJIzICIJmWUzpimsbM",
  authDomain: "pixelario-45257.firebaseapp.com",
  projectId: "pixelario-45257",
  storageBucket: "pixelario-45257.firebasestorage.app",
  messagingSenderId: "332887964275",
  appId: "1:332887964275:web:ff4c0f8a99f4a8aea78806",
  measurementId: "G-YZF0CZM1T4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Elementos DOM
const canvas = document.getElementById("pixel-canvas");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const cooldownText = document.getElementById("cooldown");
const pixelsAvailableEl = document.getElementById("pixels-available");

const loginModal = document.getElementById("login-modal");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("login-btn");
const registerBtn = document.getElementById("register-btn");
const googleLoginBtn = document.getElementById("google-login-btn");
const loginError = document.getElementById("login-error");

const userInfo = document.getElementById("user-info");
const userEmailDisplay = document.getElementById("user-email");
const logoutBtn = document.getElementById("logout-btn");

// Estado
let canPaint = true;
const cooldownSeconds = 30;

let zoomLevel = 1;
let offsetX = 0;
let offsetY = 0;

let isPanning = false;
let startPan = { x: 0, y: 0 };

// Pixel count por usuário (salvo no localStorage para demo)
let pixelsAvailable = 30;
let cooldownTimer = null;

// Desativa menu contexto no canvas
canvas.addEventListener("contextmenu", e => e.preventDefault());

// Pan com botão direito
canvas.addEventListener("mousedown", (e) => {
  if (e.button === 2) {
    isPanning = true;
    startPan.x = e.clientX;
    startPan.y = e.clientY;
  }
});

canvas.addEventListener("mouseup", (e) => {
  if (e.button === 2) {
    isPanning = false;
  }
});

canvas.addEventListener("mouseleave", () => {
  isPanning = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (isPanning) {
    const dx = e.clientX - startPan.x;
    const dy = e.clientY - startPan.y;
    offsetX += dx;
    offsetY += dy;
    startPan.x = e.clientX;
    startPan.y = e.clientY;
    updateTransform();
  }
});

// Zoom com scroll do mouse
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const mouseX = e.clientX - canvas.getBoundingClientRect().left;
  const mouseY = e.clientY - canvas.getBoundingClientRect().top;

  const zoomAmount = e.deltaY < 0 ? 1.1 : 0.9;

  offsetX = mouseX - (mouseX - offsetX) * zoomAmount;
  offsetY = mouseY - (mouseY - offsetY) * zoomAmount;

  zoomLevel *= zoomAmount;
  zoomLevel = Math.min(Math.max(zoomLevel, 0.5), 20);

  updateTransform();
}, { passive: false });

function updateTransform() {
  canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${zoomLevel})`;
}

// Pintar pixels
canvas.addEventListener("click", (e) => {
  if (!canPaint || pixelsAvailable <= 0) return;

  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left - offsetX) / zoomLevel);
  const y = Math.floor((e.clientY - rect.top - offsetY) / zoomLevel);
  const color = colorPicker.value;

  if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return;

  ctx.fillStyle = color;
  ctx.fillRect(x, y, 1, 1);

  pixelsAvailable--;
  updatePixelsAvailable();
  startCooldown();
});

function startCooldown() {
  canPaint = false;
  let secondsLeft = cooldownSeconds;
  cooldownText.textContent = `Espere ${secondsLeft}s`;

  cooldownTimer = setInterval(() => {
    secondsLeft--;
    cooldownText.textContent = `Espere ${secondsLeft}s`;
    if (secondsLeft <= 0) {
      clearInterval(cooldownTimer);
      cooldownText.textContent = "Pronto para pintar";
      canPaint = true;
      addPixel();
    }
  }, 1000);
}

// A cada 30s ganha 1 pixel (limitado pelo tempo e máximo que quiser)
function addPixel() {
  pixelsAvailable++;
  updatePixelsAvailable();
}

// Atualiza contador visual
function updatePixelsAvailable() {
  pixelsAvailableEl.textContent = pixelsAvailable;
  // Salvar no localStorage por usuário
  if (auth.currentUser) {
    localStorage.setItem(`pixels_${auth.currentUser.uid}`, pixelsAvailable);
  }
}

// Recuperar pixels do localStorage
function loadPixels() {
  if (auth.currentUser) {
    const saved = localStorage.getItem(`pixels_${auth.currentUser.uid}`);
    if (saved !== null) pixelsAvailable = parseInt(saved);
    updatePixelsAvailable();
  }
}

// Zoom botões
function zoomIn() {
  const zoomAmount = 1.1;
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = canvasRect.width / 2;
  const mouseY = canvasRect.height / 2;

  offsetX = mouseX - (mouseX - offsetX) * zoomAmount;
  offsetY = mouseY - (mouseY - offsetY) * zoomAmount;

  zoomLevel *= zoomAmount;
  zoomLevel = Math.min(zoomLevel, 20);
  updateTransform();
}

function zoomOut() {
  const zoomAmount = 0.9;
  const canvasRect = canvas.getBoundingClientRect();
  const mouseX = canvasRect.width / 2;
  const mouseY = canvasRect.height / 2;

  offsetX = mouseX - (mouseX - offsetX) * zoomAmount;
  offsetY = mouseY - (mouseY - offsetY) * zoomAmount;

  zoomLevel *= zoomAmount;
  zoomLevel = Math.max(zoomLevel, 0.5);
  updateTransform();
}

// --- FIREBASE AUTH ---
// Mostrar/ocultar modal login
function showLoginModal() {
  loginModal.style.display = "flex";
  userInfo.style.display = "none";
}

function hideLoginModal() {
  loginModal.style.display = "none";
  userInfo.style.display = "block";
}

// Login Email/Senha
loginBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      loginError.textContent = "";
      hideLoginModal();
      loadPixels();
      userEmailDisplay.textContent = auth.currentUser.email;
    })
    .catch(e => {
      loginError.textContent = e.message;
    });
});

// Registrar Email/Senha
registerBtn.addEventListener("click", () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      loginError.textContent = "";
      hideLoginModal();
      loadPixels();
      userEmailDisplay.textContent = auth.currentUser.email;
    })
    .catch(e => {
      loginError.textContent = e.message;
    });
});

// Login com Google
googleLoginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => {
      loginError.textContent = "";
      hideLoginModal();
      loadPixels();
      userEmailDisplay.textContent = auth.currentUser.email;
    })
    .catch(e => {
      loginError.textContent = e.message;
    });
});

// Logout
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

// Estado de autenticação
auth.onAuthStateChanged(user => {
  if (user) {
    hideLoginModal();
    userEmailDisplay.textContent = user.email;
    loadPixels();
  } else {
    showLoginModal();
  }
});

// Loop para adicionar 1 pixel a cada 30 segundos (enquanto estiver logado)
setInterval(() => {
  if (auth.currentUser) {
    addPixel();
  }
}, 30000);
