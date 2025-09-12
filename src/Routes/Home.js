// Home.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProjectMap from "../components/ProjectMap";
import ProjectForm from "../components/ProjectForm";
import "./Home.css"
import { subscribeAuth, getCurrentUserDisplayName } from '../services/auth';
import { 
  createProject,
  updateProject,
  deleteProject as deleteProjectFromDB,
  updateProjectPosition,
  subscribeToUserProjects
} from '../services/projects';

function Home() {
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [positions, setPositions] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [isLoadingName, setIsLoadingName] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeAuth(async (user) => {
      console.log('Auth state changed:', user);
      setCurrentUser(user);
      
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
        setProjects([]);
        setPositions({});
        navigate('/');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // 사용자의 프로젝트 실시간 구독
  useEffect(() => {
    if (!currentUser) return;

    console.log('프로젝트 실시간 구독 시작:', currentUser.uid);
    
    const unsubscribe = subscribeToUserProjects(currentUser.uid, ({ projects: userProjects, positions: userPositions }) => {
      console.log('프로젝트 데이터 업데이트:', userProjects, userPositions);
      setProjects(userProjects);
      setPositions(userPositions);
    });

    return () => {
      console.log('프로젝트 구독 해제');
      unsubscribe();
    };
  }, [currentUser]);

  const getRadius = (priority) => {
    if (priority === "상") return 75;
    if (priority === "중") return 55;
    return 40;
  };

  const handleAddProject = async (newProject) => {
    if (!currentUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    try {
      const radius = getRadius(newProject.priority);
      const padding = 20;
      const tryLimit = 500;
      
      // 맵 영역만 고려 (사이드바 제외)
      const mapWidth = window.innerWidth - 300; // 사이드바 너비 300px
      const screenHeight = window.innerHeight;
      const centerX = mapWidth / 2;
      const centerY = screenHeight / 2;

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

      const numExisting = Object.keys(positions).length;

      if (numExisting === 0) {
        x = centerX;
        y = centerY;
        placed = true;
      } else {
        const maxDistance = Math.max(mapWidth, screenHeight);
        const step = radius + padding;
        
        for (let distance = step; distance <= maxDistance && !placed && attempt < tryLimit; distance += step) {
          const circumference = 2 * Math.PI * distance;
          const angleStep = Math.max(0.1, (2 * Math.PI) / Math.max(8, circumference / (radius * 2)));
          
          for (let angle = 0; angle < 2 * Math.PI && !placed && attempt < tryLimit; angle += angleStep) {
            const existingPositions = Object.values(positions);
            
            for (const existingPos of existingPositions) {
              if (placed || attempt >= tryLimit) break;
              
              const cx = existingPos.x + Math.cos(angle) * distance;
              const cy = existingPos.y + Math.sin(angle) * distance;
              
              attempt++;
              
              if (isWithinMapArea(cx, cy, radius) && !isOverlapping(cx, cy, radius, positions)) {
                x = cx;
                y = cy;
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
              
              if (!isOverlapping(gx, gy, radius, positions)) {
                x = gx;
                y = gy;
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
            
            if (!isOverlapping(rx, ry, radius, positions)) {
              x = rx;
              y = ry;
              placed = true;
            }
          }
        }
      }

      if (!placed) {
        alert("프로젝트를 배치할 공간이 부족합니다. 화면을 확대하거나 일부 프로젝트를 삭제해주세요.");
        return;
      }

      const position = { x, y, radius };
      
      // ownerId를 포함한 프로젝트 데이터 생성
      const projectData = {
        ...newProject,  // title이 그대로 포함됨
        ownerId: currentUser.uid,
        subtasks: []
      };
      
      // Firebase에 프로젝트 추가
      await createProject(projectData, position);
      
      console.log('프로젝트가 성공적으로 추가되었습니다.');
    } catch (error) {
      console.error('프로젝트 추가 중 오류:', error);
      alert('프로젝트 추가 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const editProject = async (updatedProject) => {
    if (!currentUser) return;

    try {
      // 업데이트 가능한 필드만 선별
      const { id, title, deadline, progress, priority, description } = updatedProject;
      const updateData = {
        title,
        deadline,
        progress,
        priority
      };
      
      // description이 있으면 포함
      if (description !== undefined) {
        updateData.description = description;
      }
      
      await updateProject(id, updateData);
      
      console.log('프로젝트가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('프로젝트 수정 중 오류:', error);
      alert('프로젝트 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const deleteProject = async (id) => {
    if (!currentUser) return;

    try {
      // 데이터베이스에서 프로젝트 삭제
      await deleteProjectFromDB(id);
      
      console.log('프로젝트가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('프로젝트 삭제 중 오류:', error);
      alert('프로젝트 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 프로젝트 위치 변경 시 데이터베이스 업데이트
  const handlePositionChange = async (newPositions) => {
    if (!currentUser) return;

    try {
      // 변경된 위치만 찾아서 업데이트
      const changedPositions = {};
      
      Object.keys(newPositions).forEach(projectId => {
        const oldPos = positions[projectId];
        const newPos = newPositions[projectId];
        
        if (!oldPos || 
            oldPos.x !== newPos.x || 
            oldPos.y !== newPos.y || 
            oldPos.radius !== newPos.radius) {
          changedPositions[projectId] = newPos;
        }
      });

      if (Object.keys(changedPositions).length > 0) {
        // 각각의 변경된 프로젝트 위치를 개별적으로 업데이트
        await Promise.all(
          Object.entries(changedPositions).map(([projectId, position]) =>
            updateProjectPosition(projectId, position)
          )
        );
        console.log('프로젝트 위치가 성공적으로 업데이트되었습니다.');
      }
      
      // UI 상태는 실시간 구독을 통해 자동으로 업데이트됨
    } catch (error) {
      console.error('프로젝트 위치 업데이트 중 오류:', error);
      // 에러가 발생해도 UI는 일시적으로 업데이트 (사용자 경험 개선)
      setPositions(newPositions);
    }
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // 로딩 중일 때
  if (isLoading) {
    return (
      <div className="loading-container">
        <p>로딩 중...</p>
      </div>
    );
  }

  // 로그인하지 않은 경우
  if (!currentUser) {
    return null; // 이미 navigate('/')로 리다이렉트됨
  }

  return ( 
    <div className="game-container">
      {/* 게임 스타일 사이드바 */}
      <div className="sidebar">
        <div className="profile-section">
          <div className="profile-avatar">
            <div className="avatar-circle"></div>
          </div>
          <div className="profile-info">
            <h2 className="profile-name">
              {isLoadingName ? '로딩 중...' : (displayName || '코딩잘하고싶엉')}
            </h2>
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
            className="game-button search"
          >
            검색
            {/*팝업관련 코드 추가예정*/}
          </button>
          <button 
            className="game-button add-project"
            onClick={() => setShowForm(true)}
          >
            프로젝트 추가
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
              onPositionsChange={handlePositionChange}
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