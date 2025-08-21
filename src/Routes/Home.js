import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Project from "../components/Project";
import ProjectForm from "../components/ProjectForm";
import "./Home.css"

function Home() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [positions, setPositions] = useState({});
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("projects", JSON.stringify(projects))
  }, [projects])

  useEffect(() => {
    localStorage.setItem("positions", JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    const storedProjects = JSON.parse(localStorage.getItem("projects") || "[]");
    const storedPositions = JSON.parse(localStorage.getItem("positions") || "{}");
    setProjects(storedProjects);
    setPositions(storedPositions);
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const getPosition = (id) => {
    const pos = positions[id];
    return pos
      ? {
          top: pos.y - pos.radius + mapOffset.y,
          left: pos.x - pos.radius + mapOffset.x,
        }
      : { top: 0, left: 0 };
  };

  const getRadius = (priority) => {
    if (priority === "상") return 75;
    if (priority === "중") return 55;
    return 40;
  };

  const handleMouseDown = (e) => {
    // 사이드바 영역은 드래그 제외
    if (e.target.closest('.sidebar')) return;
    
    setIsDragging(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !lastMousePos) return;

    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;

    setMapOffset((prev) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setLastMousePos(null);
  };

  const handleAddProject = (newProject) => {
    const id = Date.now();
    const project = {
      id,
      ...newProject,
      subtasks: [],
    };

    const radius = getRadius(project.priority);
    const padding = 20;
    const tryLimit = 500;
    // 맵 영역만 고려 (사이드바 제외)
    const mapWidth = window.innerWidth - 300; // 사이드바 너비 300px
    const screenHeight = window.innerHeight;
    const centerX = mapWidth / 2;
    const centerY = screenHeight / 2;

    const tempPositions = { ...positions };
    let x = 0;
    let y = 0;
    let placed = false;
    let attempt = 0;

    const isOverlapping = (cx, cy, r, allPositions) => {
      return Object.values(allPositions).some((pos) => {
        const dx = pos.x - cx;
        const dy = pos.y - cy;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < pos.radius + r + padding;
      });
    };

    const isWithinMapArea = (cx, cy, r) => {
      return cx - r >= 0 && cx + r <= mapWidth && cy - r >= 0 && cy + r <= screenHeight;
    };

    const numExisting = Object.keys(tempPositions).length;

    if (numExisting === 0) {
      x = centerX;
      y = centerY;
      tempPositions[id] = { x, y, radius };
      placed = true;
    } else {
      const maxDistance = Math.max(mapWidth, screenHeight);
      const step = radius + padding;
      
      for (let distance = step; distance <= maxDistance && !placed && attempt < tryLimit; distance += step) {
        const circumference = 2 * Math.PI * distance;
        const angleStep = Math.max(0.1, (2 * Math.PI) / Math.max(8, circumference / (radius * 2)));
        
        for (let angle = 0; angle < 2 * Math.PI && !placed && attempt < tryLimit; angle += angleStep) {
          const existingPositions = Object.values(tempPositions);
          
          for (const existingPos of existingPositions) {
            if (placed || attempt >= tryLimit) break;
            
            const cx = existingPos.x + Math.cos(angle) * distance;
            const cy = existingPos.y + Math.sin(angle) * distance;
            
            attempt++;
            
            if (isWithinMapArea(cx, cy, radius) && !isOverlapping(cx, cy, radius, tempPositions)) {
              x = cx;
              y = cy;
              tempPositions[id] = { x, y, radius };
              placed = true;
              break;
            }
          }
        }
      }
      
      if (!placed) {
        const gridSize = Math.min(radius * 2 + padding, 50);
        
        for (let gx = radius; gx <= mapWidth - radius && !placed && attempt < tryLimit; gx += gridSize) {
          for (let gy = radius; gy <= screenHeight - radius && !placed && attempt < tryLimit; gy += gridSize) {
            attempt++;
            
            if (!isOverlapping(gx, gy, radius, tempPositions)) {
              x = gx;
              y = gy;
              tempPositions[id] = { x, y, radius };
              placed = true;
              break;
            }
          }
        }
      }
      
      if (!placed) {
        const maxRandomAttempts = 200;
        for (let i = 0; i < maxRandomAttempts && !placed; i++) {
          const rx = radius + Math.random() * (mapWidth - 2 * radius);
          const ry = radius + Math.random() * (screenHeight - 2 * radius);
          
          if (!isOverlapping(rx, ry, radius, tempPositions)) {
            x = rx;
            y = ry;
            tempPositions[id] = { x, y, radius };
            placed = true;
          }
        }
      }
    }

    if (!placed) {
      alert("프로젝트를 배치할 공간이 부족합니다. 화면을 확대하거나 일부 프로젝트를 삭제해주세요.");
      return;
    }

    setProjects((prev) => [...prev, project]);
    setPositions(tempPositions);
  };

  const editProject = (updatedProject) => {
    setProjects((prev) =>
     prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const deleteProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setPositions((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="game-container">
      {/* 메인 맵 영역 */}
      <div 
        className="map-area"
        onMouseDown={handleMouseDown}
        style={{
          position: "relative",
          overflow: "hidden",
          userSelect: isDragging ? "none" : "auto",
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        {projects.map((project) => (
          <Project
            key={project.id}
            project={project}
            onDeleteProject={deleteProject}
            onEditProject={editProject}
            position={getPosition(project.id)}
          />
        ))}

        {showForm && (
          <ProjectForm
            onSubmit={handleAddProject}
            onClose={() => setShowForm(false)}
          />
        )}
      </div>

      {/* 게임 스타일 사이드바 */}
      <div className="sidebar">
        {/* 프로필 섹션 */}
        <div className="profile-section">
          <div className="profile-avatar">
            <div className="avatar-circle"></div>
          </div>
        </div>
        <div className="profile-info">
          <h2 className="profile-name">플레이어</h2>
          <p className="profile-date">{getCurrentDate()}</p>
        </div>

        {/* 메뉴 버튼들 */}
        <div className="menu-section">
          <button 
            className="game-button add-project"
            onClick={() => setShowForm(true)}
          >
            프로젝트 추가
          </button>
          <button 
            className="game-button manage"
            onClick={() => navigate("/manage")}
          >
            프로젝트 관리
          </button>
          <button 
            className="game-button store"
            onClick={() => navigate("/store")}
          >
            상점
          </button>
          <button 
            className="game-button logout"
            onClick={() => navigate("/")}
          >
            로그아웃
          </button>
        </div>

        {/* 상태 정보 */}
        <div className="status-section">
          <div className="status-item">
            <span className="status-label">총 프로젝트</span>
            <span className="status-value">{projects.length}</span>
          </div>
          <div className="status-item">
            <span className="status-label">완료된 프로젝트</span>
            <span className="status-value">
              {projects.filter(p => p.status === '완료').length}
            </span>
          </div>
        </div>

        {/* 하단 팁 */}
        <div className="tip-section">
          <div className="tip-box">
            <p>💡 팁: 마우스로 맵을 드래그하여 이동할 수 있습니다!</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;