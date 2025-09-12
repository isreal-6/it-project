import { useParams, useNavigate } from "react-router-dom";
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

  const [project, setProject] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // 중심 노드 ID 상수
  const CENTER_NODE_ID = "center";

  // 프로젝트 불러오기 (Firestore)
  useEffect(() => {
    const run = async () => {
      const found = await getProjectFromDb(id);
      if (found) {
        setProject(found);
      } else {
        alert("프로젝트를 찾을 수 없습니다.");
        navigate("/home");
      }
    };
    run();
  }, [id, navigate]);

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

  if (!project) return <div>Loading...</div>;

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