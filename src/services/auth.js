import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const subscribeAuth = (callback) => onAuthStateChanged(auth, callback);

export const signUpWithEmail = async (email, password, displayName) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }

  // Create user profile document in Firestore (id matches auth uid)
  // Do not block signup flow on this write; run in background.
  const userRef = doc(db, 'users', cred.user.uid);
  setDoc(
    userRef,
    {
      uid: cred.user.uid,
      email: cred.user.email || email,
      displayName: displayName || cred.user.displayName || '',
      photoURL: cred.user.photoURL || '',
      providerId: cred.user.providerId || 'password',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  ).catch(() => {
    // Non-fatal: log or handle silently; don't block navigation
    // console.error('Failed to create user doc', err);
  });

  return cred.user;
};

export const signInWithEmail = async (email, password) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

export const signOutUser = async () => signOut(auth);

// 캐시를 위한 변수
let displayNameCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

// getCurrentUserDisplayName 함수 최적화
export const getCurrentUserDisplayName = async () => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) return null;

  // 캐시가 유효한지 확인
  const now = Date.now();
  if (displayNameCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return displayNameCache;
  }

  try {
    // 1. Auth 객체의 displayName을 먼저 확인 (가장 빠름)
    if (currentUser.displayName) {
      displayNameCache = currentUser.displayName;
      cacheTimestamp = now;
      
      // Firestore 업데이트는 백그라운드에서 실행
      setDoc(doc(db, 'users', currentUser.uid), {
        displayName: currentUser.displayName,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(() => {
        // 에러는 무시 (백그라운드 작업)
      });
      
      return currentUser.displayName;
    }

    // 2. 이메일에서 이름 추출 (빠름)
    if (currentUser.email) {
      const emailName = currentUser.email.split('@')[0];
      displayNameCache = emailName;
      cacheTimestamp = now;
      return emailName;
    }

    // 3. Firestore에서 확인 (느림, 최후 수단)
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists() && userDoc.data().displayName) {
      const name = userDoc.data().displayName;
      displayNameCache = name;
      cacheTimestamp = now;
      return name;
    }

    return '사용자';
  } catch (error) {
    console.error('displayName 가져오기 오류:', error);
    
    // 에러 발생 시 Auth 객체에서 직접 가져오기
    const fallbackName = currentUser.displayName || 
                        currentUser.email?.split('@')[0] || 
                        '사용자';
    displayNameCache = fallbackName;
    cacheTimestamp = now;
    return fallbackName;
  }
};

// 캐시 초기화 함수
export const clearDisplayNameCache = () => {
  displayNameCache = null;
  cacheTimestamp = 0;
};
