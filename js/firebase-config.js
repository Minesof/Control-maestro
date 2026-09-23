const firebaseConfig = {
    apiKey: "AIzaSyB_HMGW846gz25BMI7OiKOYnxGUGZAJrsE",
    authDomain: "mineapp-3424e.firebaseapp.com",
    projectId: "mineapp-3424e",
    storageBucket: "mineapp-3424e.firebasestorage.app",
    messagingSenderId: "763912479718",
    appId: "1:763912479718:web:e4c341e81943afc0b9ec27"
};

let db;

try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        window.auth = firebase.auth();
    } else {
        console.warn("Firebase no est disponible. Operando en modo offline local.");
    }
} catch (e) {
    console.error("Error al inicializar Firebase:", e);
}