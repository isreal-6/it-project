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

const todosCol = collection(db, 'todos');

export const createTodo = async (todo) => {
  const now = serverTimestamp();
  const data = { ...todo, createdAt: now, updatedAt: now };
  const ref = await addDoc(todosCol, data);
  return { id: ref.id, ...data };
};

export const listTodosByProject = async (projectId) => {
  const q = query(todosCol, where('projectId', '==', projectId), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getTodo = async (todoId) => {
  const snap = await getDoc(doc(db, 'todos', todoId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateTodo = async (todoId, updates) => {
  await updateDoc(doc(db, 'todos', todoId), { ...updates, updatedAt: serverTimestamp() });
};

export const deleteTodo = async (todoId) => {
  await deleteDoc(doc(db, 'todos', todoId));
};



