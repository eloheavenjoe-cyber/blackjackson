import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyDB71ns_pEDOPI_ocJhpw9sSHOUDdqOCWU",
  authDomain: "blackjackson-48cdc.firebaseapp.com",
  projectId: "blackjackson-48cdc",
  storageBucket: "blackjackson-48cdc.firebasestorage.app",
  messagingSenderId: "390050454919",
  appId: "1:390050454919:web:6b3a2a703d1b1615860722",
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
