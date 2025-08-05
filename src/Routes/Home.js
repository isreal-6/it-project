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
    const tryLimit = 500; // 시도 횟수 증가
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const centerX = screenWidth / 2;
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

    const isWithinScreen = (cx, cy, r) => {
      return cx - r >= 0 && cx + r <= screenWidth && cy - r >= 0 && cy + r <= screenHeight;
    };

    const numExisting = Object.keys(tempPositions).length;

    if (numExisting === 0) {
      // 첫 프로젝트는 중앙에
      x = centerX;
      y = centerY;
      tempPositions[id] = { x, y, radius };
      placed = true;
    } else {
      // 1단계: 기존 프로젝트들 주변의 빈 공간 탐색 (가까운 거리부터)
      const maxDistance = Math.max(screenWidth, screenHeight);
      const step = radius + padding; // 탐색 간격
    
      for (let distance = step; distance <= maxDistance && !placed && attempt < tryLimit; distance += step) {
        // 각 거리에서 원형으로 탐색
        const circumference = 2 * Math.PI * distance;
        const angleStep = Math.max(0.1, (2 * Math.PI) / Math.max(8, circumference / (radius * 2))); // 적절한 각도 간격
      
        for (let angle = 0; angle < 2 * Math.PI && !placed && attempt < tryLimit; angle += angleStep) {
          // 기존의 모든 프로젝트를 중심으로 탐색
          const existingPositions = Object.values(tempPositions);
        
          for (const existingPos of existingPositions) {
            if (placed || attempt >= tryLimit) break;
          
            const cx = existingPos.x + Math.cos(angle) * distance;
            const cy = existingPos.y + Math.sin(angle) * distance;
          
            attempt++;
          
            if (isWithinScreen(cx, cy, radius) && !isOverlapping(cx, cy, radius, tempPositions)) {
              x = cx;
              y = cy;
              tempPositions[id] = { x, y, radius };
              placed = true;
              break;
            }
          }
        }
      }
    
      // 2단계: 여전히 배치되지 않았다면, 전체 화면을 그리드로 탐색
      if (!placed) {
        const gridSize = Math.min(radius * 2 + padding, 50);
      
        for (let gx = radius; gx <= screenWidth - radius && !placed && attempt < tryLimit; gx += gridSize) {
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
    
      // 3단계: 마지막 수단으로 랜덤 배치 시도
      if (!placed) {
        const maxRandomAttempts = 200;
        for (let i = 0; i < maxRandomAttempts && !placed; i++) {
          const rx = radius + Math.random() * (screenWidth - 2 * radius);
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


  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", }}>
      <header className="header">
        <h1>프로젝트 목록</h1>
        <div className="header-buttons-section">
          <button className="header-button" onClick={() => setShowForm(true)}>프로젝트 추가</button>
          <button className="header-button" onClick={() => navigate("/store")}>상점</button>
          <button className="header-button" onClick={() => navigate("/")}>로그아웃</button>
        </div>
      </header>

      <div
        className="main-page"
        onMouseDown={handleMouseDown}
        style={{
          flex: 1,
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
    </div>
  );

}

export default Home;
