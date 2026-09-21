/** Leftover Firebase web config. Login no longer uses this project. */
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAvyX_SxNfRoS3RCgIX4oiDk5Qo3xqYwv0',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'synapse-2c608.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'synapse-2c608',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    'synapse-2c608.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '416692577147',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    '1:416692577147:web:b4e12dafb0ce8dde7053de',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-1F69CK08NP',
};
