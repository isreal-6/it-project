import TodoApp from "../components/Todo";
import "./DetailTodo.css"

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getProject as getProjectFromDb } from "../services/projects";

function DetailTodo() {
  const { id: projectId, id2: nodeId } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [subtask, setSubtask] = useState(null);

  // Firebase Timestamp를 'YYYY-MM-DD' 형식의 문자열로 변환하는 헬퍼 함수
  const timestampToDateString = (timestamp) => {
    if (!timestamp) return '';
    // Timestamp 객체인지 확인
    if (timestamp && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toISOString().split('T')[0];
    }
    // 이미 문자열인 경우
    if (typeof timestamp === 'string') {
      return timestamp.split('T')[0];
    }
    return '';
  };
  useEffect(() => {
    const run = async () => {
      const foundProject = await getProjectFromDb(projectId);
      if (foundProject) {
        setProject(foundProject);
        const foundSubtask = (foundProject.subtasks || []).find(
          (sub) => String(sub.id) === String(nodeId)
        );
        setSubtask(foundSubtask || null);
      } else {
        setProject(null);
      }
    };
    run();
  }, [projectId, nodeId]);

  if (!project) return <div>Project Loading...</div>;

  return (
    <div>
      <header className="top">
        <div className="nav-buttons">
          <button className="btn btn-back" onClick={() => navigate(-1)}>
            ← 뒤로가기
          </button>
          <button className="btn btn-store" onClick={() => navigate("/store")}>
            상점
          </button>
        </div>
      </header>
      <div className="container">
          <h2>메인 프로젝트: {project.title}</h2>
        {subtask ? (
          <>
            <h3>{subtask.title}</h3>
            <p>마감일: {timestampToDateString(subtask.deadline)}</p>
            <p>진행도: {subtask.progress}%</p>
          </>
        ) : (
          <p>서브태스크를 찾을 수 없습니다.</p>
        )}
      <TodoApp/>
      </div>

    </div>
  );
}

export default DetailTodo;