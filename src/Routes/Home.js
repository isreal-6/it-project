// Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectMap from "../components/ProjectMap";
import ProjectForm from "../components/ProjectForm";
import "./Home.css"
import { subscribeAuth, getCurrentUserDisplayName } from '../services/auth';

function Home() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [positions, setPositions] = useState({});
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [isLoadingName, setIsLoadingName] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuth(async (user) => {
      console.log('Auth state changed:', user);
      if (user) {
        setIsLoadingName(true);
        try {
          const name = await getCurrentUserDisplayName();
          console.log('Display name retrieved:', name);
          setDisplayName(name || '사용자');
        } catch (error) {
          console.error('Error getting display name:', error);
          setDisplayName('사용자');
        } finally {
          setIsLoadingName(false);
        }
      } else {
        setDisplayName('');
        setIsLoadingName(false);
      }
    });

    return () => unsubscribe();
  }, []);

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

  const getRadius = (priority) => {
    if (priority === "상") return 75;
    if (priority === "중") return 55;
    return 40;
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
      {/* 게임 스타일 사이드바 */}
      <div className="sidebar">
        <div className="profile-section">
          <div className="profile-avatar">
            <div className="avatar-circle"></div>
          </div>
          <div className="profile-info">
            <h2 className="profile-name">코딩잘하고싶엉</h2>
            <button
              className="logout-button"
              onClick={() => navigate("/")}
            >
              로그아웃
            </button>
          </div>
        </div>

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
      </div>

      {/* 메인 콘텐츠 영역 */}
      <div className="main-content">
        {/* 헤더 */}
        <header className="main-header">
          <p>{getCurrentDate()}</p>
          <h1>
            {isLoadingName ? '로딩 중...' : `${displayName || '사용자'}님`}, 오늘은 어떤 우주를 정복해볼까요?
          </h1>
        </header>

        {/*작업영역*/}
        <div className="workspace">
          {/* 프로젝트 맵 */}
          <div className="project-map-container">
            <ProjectMap
              projects={projects}
              positions={positions}
              onDeleteProject={deleteProject}
              onEditProject={editProject}
              onPositionsChange={setPositions}
            />
          
            {showForm && (
              <ProjectForm
                onSubmit={handleAddProject}
                onClose={() => setShowForm(false)}
              />
            )}
          </div>
          {/*우측 패널*/}
          <div className="right-pannel">
            <div className="todo">
              <h3>오늘의 할 일</h3>
              {/*투두리스트 추가예정*/}
            </div>
            <div className="inspiration">
              <h3>영감카드</h3>
            </div>
          </div>
        </div>

        {/* 타임라인 */}
        <footer className="timeline-container">
          <div className="timeline">
            <h3>프로젝트 타임라인</h3>
            {/* 타임라인 내용 추가 예정 */}
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;