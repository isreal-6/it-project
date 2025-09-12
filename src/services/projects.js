import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  where,
  orderBy
} from 'firebase/firestore';

const projectsCol = collection(db, 'projects');

export const createProject = async (project) => {
  const now = serverTimestamp();
  const data = { ...project, createdAt: now, updatedAt: now };
  const ref = await addDoc(projectsCol, data);
  return { id: ref.id, ...data };
};

export const listProjects = async (userId) => {
  const q = userId
    ? query(projectsCol, where('ownerId', '==', userId), orderBy('createdAt', 'desc'))
    : query(projectsCol, orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getProject = async (projectId) => {
  const snap = await getDoc(doc(db, 'projects', projectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateProject = async (projectId, updates) => {
  await updateDoc(doc(db, 'projects', projectId), { ...updates, updatedAt: serverTimestamp() });
};

export const deleteProject = async (projectId) => {
  await deleteDoc(doc(db, 'projects', projectId));
};



