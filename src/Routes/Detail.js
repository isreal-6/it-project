import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import SubtaskForm from "../components/SubtaskForm";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
} from "reactflow";
import "reactflow/dist/style.css";
import { getProject as getProjectFromDb, updateProject as updateProjectInDb } from "../services/projects";

function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [project, setProject] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 중심 노드 ID 상수
  const CENTER_NODE_ID = "center";

  // 프로젝트 불러오기 - 상태 전달 우선, 없으면 Firebase 조회
  useEffect(() => {
    const loadProject = async () => {
      try {
        setLoading(true);
        
        // 1. 먼저 전달받은 상태 확인
        if (location.state?.project) {
          console.log('상태로 전달받은 프로젝트 사용:', location.state.project);
          setProject(location.state.project);
          setLoading(false);
          return;
        }

        // 2. 상태가 없으면 Firebase에서 조회 (오프라인 처리 포함)
        console.log('Firebase에서 프로젝트 조회 시도:', id);
        const found = await getProjectFromDb(id);
        
        if (found) {
          setProject(found);
        } else {
          alert("프로젝트를 찾을 수 없습니다.");
          navigate("/home");
        }
      } catch (error) {
        console.error('프로젝트 로딩 오류:', error);
        
        if (error.code === 'unavailable') {
          alert("인터넷 연결을 확인해주세요. 홈 화면으로 돌아갑니다.");
        } else {
          alert("프로젝트를 불러오는 중 오류가 발생했습니다.");
        }
        navigate("/home");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id, navigate, location.state]);

  // subtasks → nodes 변환 함수
  const generateNodesFromProject = (project) => {
    const baseNode = [
      {
        id: CENTER_NODE_ID,
        type: "default",
        data: { label: project.title, page: "/center" },
        position: { x: 300, y: 200 },
        draggable: false,
        className: "my-node center-node",
      },
    ];

    const subtaskNodes = (project.subtasks || []).map((subtask) => ({
      id: subtask.id.toString(),
      type: "default",
      data: { label: subtask.title },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 200 + 100,
      },
      className: "my-node",
    }));

    return [...baseNode, ...subtaskNodes];
  };

  // subtasks → edges 변환 함수
  const generateEdgesFromProject = (project) => {
    return (project.subtasks || []).map((subtask) => ({
      id: `e-center-${subtask.id}`,
      source: CENTER_NODE_ID,
      target: subtask.id.toString(),
    }));
  };

  // project가 바뀔 때 nodes/edges 세팅
  useEffect(() => {
    if (project) {
      const newNodes = generateNodesFromProject(project);
      const newEdges = generateEdgesFromProject(project);
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [project, setNodes, setEdges]);

  const onNodeClick = useCallback(
    (event, node) => {
      if (node.id !== CENTER_NODE_ID) {
        navigate(`/project/${project.id}/${node.id}`);
      } else {
        alert("페이지 정보가 없습니다.");
      }
    },
    [navigate, CENTER_NODE_ID, project]
  );

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // subtask 추가 → Firestore의 project.subtasks 업데이트
  const handleAddSubtask = async (newSubtask) => {
    const updated = {
      ...project,
      subtasks: [...(project.subtasks || []), newSubtask],
    };
    setProject(updated);
    try {
      await updateProjectInDb(project.id, { subtasks: updated.subtasks });
    } catch (e) {
      console.error('서브태스크 저장 오류:', e);
      // rollback on failure
      alert("서브태스크 저장 중 오류가 발생했습니다.");
      setProject(project);
    }
    setShowForm(false);
  };

  const handleSubmitBoth = (newSubtask) => {
    const newId = Date.now();
    const newSubtaskWithId = { id: newId, ...newSubtask };
    handleAddSubtask(newSubtaskWithId);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>프로젝트를 불러오는 중...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>프로젝트를 찾을 수 없습니다.</p>
      </div>
    );
  }

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
        <button onClick={() => setShowForm(true)}>세부 목표 추가</button>
        {showForm && (
          <SubtaskForm onSubmit={handleSubmitBoth} onClose={() => setShowForm(false)} />
        )}

        <div style={{ height: 600 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
          />
        </div>
      </div>
    </div>
  );
}

export default Detail;