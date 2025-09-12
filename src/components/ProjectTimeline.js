import React from 'react';
import './ProjectTimeline.css'

const ProjectTimeline = ({ projects }) => {
  // 타임라인 데이터 계산
  // 타임라인 데이터 계산
const getTimelineData = () => {
  if (!projects || projects.length === 0) return [];

  const today = new Date();
  
  // 각 프로젝트의 시작일과 마감일 추출
  const projectsWithDates = projects.map(project => {
    const startDate = project.createdAt?.toDate ? project.createdAt.toDate() : new Date(project.createdAt);
    const deadline = new Date(project.deadline);
    
    return {
      ...project,
      startDate,
      deadline
    };
  });

  // 각 프로젝트의 위치 계산 (개별 프로젝트의 진행률 기준)
  return projectsWithDates.map(project => {
    // 각 프로젝트의 총 기간
    const projectTotalDays = (project.deadline - project.startDate) / (1000 * 60 * 60 * 24);
    
    // 프로젝트 시작일부터 현재까지의 경과 일수
    const elapsedDays = (today - project.startDate) / (1000 * 60 * 60 * 24);
    
    // 프로젝트 진행률 (0 = 시작일, 1 = 마감일)
    let progressRatio = elapsedDays / projectTotalDays;
    
    // 0-100% 범위로 제한
    progressRatio = Math.max(0, Math.min(1, progressRatio));
    
    // 위치를 0-100% 범위로 변환
    const position = progressRatio * 100;
    
    // 마감일까지 남은 일수 계산
    const daysToDeadline = Math.ceil((project.deadline - today) / (1000 * 60 * 60 * 24));
    
    return {
      ...project,
      position,
      daysToDeadline,
      isOverdue: daysToDeadline < 0
    };
  });
};

  // 우선순위에 따른 색상 결정
  const getProjectColor = (priority, isOverdue, progress) => {
    if (isOverdue) return '#ff4444'; // 빨간색 (마감 초과)
    if (progress === 100) return '#44ff44'; // 초록색 (완료)
    
    switch (priority) {
      case '상': return '#ff6b9d'; // 분홍색 (높은 우선순위)
      case '중': return '#ffd93d'; // 노란색 (중간 우선순위)
      case '하': return '#6bcfff'; // 파란색 (낮은 우선순위)
      default: return '#a0a0a0'; // 회색 (기본값)
    }
  };

  const timelineData = getTimelineData();

  if (timelineData.length === 0) {
    return (
      <div className="timeline-empty">
        프로젝트가 없습니다.
      </div>
    );
  }

  return (
    <div className="project-timeline">
      <h3 className="timeline-title">
        프로젝트 타임라인
      </h3>
      
      <div className="timeline-track-container">
        {/* 타임라인 가로 직선 */}
        <div className="timeline-track"></div>
        
        {/* 현재 날짜 기준으로 TODAY 위치 계산 */}
        {(() => {
          const today = new Date();
          const projectsWithDates = projects.map(project => ({
            startDate: project.createdAt?.toDate ? project.createdAt.toDate() : new Date(project.createdAt),
            deadline: new Date(project.deadline)
          }));
          
          const allStartDates = projectsWithDates.map(p => p.startDate);
          const allDeadlines = projectsWithDates.map(p => p.deadline);
          
          const earliestStart = new Date(Math.min(...allStartDates));
          const latestDeadline = new Date(Math.max(...allDeadlines));
          
          const totalDays = (latestDeadline - earliestStart) / (1000 * 60 * 60 * 24);
          const daysSinceStart = (today - earliestStart) / (1000 * 60 * 60 * 24);
          const todayPosition = Math.max(0, Math.min(100, (daysSinceStart / totalDays) * 100));
          
          return (
            <>
              {/* 현재 위치 표시선 */}
              <div 
                className="timeline-today-line"
                style={{ left: `${todayPosition}%` }}
              ></div>
              
              {/* 현재 날짜 라벨 */}
              <div 
                className="timeline-today-label"
                style={{ left: `${todayPosition}%` }}
              >
                TODAY
              </div>
            </>
          );
        })()}
        
        {/* 프로젝트 원들 */}
        {timelineData.map((project, index) => (
          <div key={project.id}>
            {/* 프로젝트 원 */}
            <div
              className="timeline-project"
              style={{
                left: `${project.position}%`,
                background: getProjectColor(project.priority, project.isOverdue, project.progress)
              }}
              title={`${project.title} - ${project.isOverdue ? '마감 초과' : `D-${project.daysToDeadline}`}`}
            />
            
            {/* D-day 라벨 */}
            <div 
              className="timeline-dday-label"
              style={{ left: `${project.position}%` }}
            >
              {project.isOverdue ? '초과' : `D-${project.daysToDeadline}`}
            </div>
          </div>
        ))}
      </div>
      
      {/* 범례 */}
      <div className="timeline-legend">
        <div className="timeline-legend-item">
          <div className="timeline-legend-dot timeline-legend-dot--high"></div>
          높음
        </div>
        <div className="timeline-legend-item">
          <div className="timeline-legend-dot timeline-legend-dot--medium"></div>
          중간
        </div>
        <div className="timeline-legend-item">
          <div className="timeline-legend-dot timeline-legend-dot--low"></div>
          낮음
        </div>
        <div className="timeline-legend-item">
          <div className="timeline-legend-dot timeline-legend-dot--overdue"></div>
          마감초과
        </div>
      </div>
    </div>
  );
};

export default ProjectTimeline;