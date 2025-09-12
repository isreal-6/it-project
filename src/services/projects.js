// services/projects.js
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
  orderBy,
  onSnapshot
} from 'firebase/firestore';

const projectsCol = collection(db, 'projects');

/**
 * 새 프로젝트 생성 (위치 정보 포함)
 * @param {Object} project - 프로젝트 데이터
 * @param {Object} position - 위치 정보 {x, y, radius}
 * @returns {Promise<Object>} 생성된 프로젝트 데이터
 */
export const createProject = async (project, position = null) => {
  const now = serverTimestamp();
  const data = { 
    ...project, 
    createdAt: now, 
    updatedAt: now,
    position: position || null,
    subtasks: project.subtasks || []
  };
  const ref = await addDoc(projectsCol, data);
  return { id: ref.id, ...data };
};

/**
 * 사용자의 프로젝트 목록 조회
 * @param {string} userId - 사용자 ID (ownerId로 필터링)
 * @returns {Promise<Object>} {projects: Array, positions: Object}
 */
export const listProjects = async (userId) => {
  const q = userId
    ? query(projectsCol, where('ownerId', '==', userId), orderBy('createdAt', 'desc'))
    : query(projectsCol, orderBy('createdAt', 'desc'));
  
  const snap = await getDocs(q);
  const projects = [];
  const positions = {};
  
  snap.docs.forEach(d => {
    const data = d.data();
    const project = {
      id: d.id,
      name: data.name,                    // ✅ name 필드 포함
      priority: data.priority,
      deadline: data.deadline,
      description: data.description,      // ✅ description 필드도 포함
      ownerId: data.ownerId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      subtasks: data.subtasks || []
    };
    
    projects.push(project);
    
    // 위치 정보가 있으면 positions 객체에 저장
    if (data.position) {
      positions[d.id] = data.position;
    }
  });
  
  return { projects, positions };
};

/**
 * 특정 프로젝트 조회
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<Object|null>} 프로젝트 데이터 또는 null
 */
export const getProject = async (projectId) => {
  const snap = await getDoc(doc(db, 'projects', projectId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * 프로젝트 정보 업데이트
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} updates - 업데이트할 데이터
 * @returns {Promise<void>}
 */
export const updateProject = async (projectId, updates) => {
  await updateDoc(doc(db, 'projects', projectId), { 
    ...updates, 
    updatedAt: serverTimestamp() 
  });
};

/**
 * 프로젝트 위치 정보만 업데이트
 * @param {string} projectId - 프로젝트 ID
 * @param {Object} position - 위치 정보 {x, y, radius}
 * @returns {Promise<void>}
 */
export const updateProjectPosition = async (projectId, position) => {
  await updateDoc(doc(db, 'projects', projectId), {
    position: {
      x: position.x,
      y: position.y,
      radius: position.radius
    },
    updatedAt: serverTimestamp()
  });
};

/**
 * 여러 프로젝트의 위치를 일괄 업데이트
 * @param {Object} positionsUpdate - {projectId: position} 형태의 객체
 * @returns {Promise<void>}
 */
export const updateMultipleProjectPositions = async (positionsUpdate) => {
  const updatePromises = Object.entries(positionsUpdate).map(([projectId, position]) =>
    updateProjectPosition(projectId, position)
  );
  
  await Promise.all(updatePromises);
};

/**
 * 프로젝트 삭제
 * @param {string} projectId - 프로젝트 ID
 * @returns {Promise<void>}
 */
export const deleteProject = async (projectId) => {
  await deleteDoc(doc(db, 'projects', projectId));
};

/**
 * 사용자의 프로젝트 실시간 구독
 * @param {string} userId - 사용자 ID
 * @param {Function} callback - 데이터 변경 시 호출될 콜백 함수
 * @returns {Function} 구독 해제 함수
 */
export const subscribeToUserProjects = (userId, callback) => {
  if (!userId) {
    // userId가 없으면 빈 데이터로 콜백 호출
    callback({ projects: [], positions: {} });
    return () => {}; // 빈 구독 해제 함수 반환
  }
  
  const q = query(
    projectsCol,
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const projects = [];
    const positions = {};
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // 추가 보안: 클라이언트에서도 ownerId 확인
      if (data.ownerId !== userId) {
        console.warn('권한이 없는 프로젝트 실시간 데이터:', doc.id);
        return;
      }
      
      const project = {
        id: doc.id,
        title: data.title,                  // title 필드 사용
        priority: data.priority,
        deadline: data.deadline,
        progress: data.progress || 0,       
        description: data.description,
        ownerId: data.ownerId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        subtasks: data.subtasks || []
      };
      
      projects.push(project);
      
      if (data.position) {
        positions[doc.id] = data.position;
      }
    });
    
    callback({ projects, positions });
  }, (error) => {
    console.error('프로젝트 실시간 구독 중 오류:', error);
    // 오류 발생 시 빈 데이터로 콜백 호출
    callback({ projects: [], positions: {} });
  });
};