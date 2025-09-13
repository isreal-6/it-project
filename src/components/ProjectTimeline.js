import React, { useState, useEffect, useMemo, useCallback } from 'react';
import './ProjectTimeline.css'

const ProjectTimeline = ({ projects }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 업데이트를 위한 useEffect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 1분마다 업데이트

    return () => clearInterval(timer);
  }, []);

  // 타임라인 데이터 계산 (useCallback으로 메모이제이션)
  const getTimelineData = useCallback((currentProjects, today) => {
    if (!currentProjects || currentProjects.length === 0) return [];

    return currentProjects.map(project => {
      // 날짜 데이터가 유효하지 않으면 계산하지 않음
      if (!project.createdAt || !project.deadline) {
        return { ...project, position: 0, daysToDeadline: 'N/A', isOverdue: false };
      }

      // Timestamp를 Date 객체로 변환
      const startDate = project.createdAt.toDate ? project.createdAt.toDate() : new Date(project.createdAt);
      const deadline = project.deadline.toDate ? project.deadline.toDate() : new Date(project.deadline);

      // 날짜가 유효하지 않은 경우 처리
      if (isNaN(startDate.getTime()) || isNaN(deadline.getTime())) {
        return { ...project, position: 0, daysToDeadline: 'N/A', isOverdue: false };
      }

      const projectTotalMs = deadline.getTime() - startDate.getTime();
      const elapsedMs = today.getTime() - startDate.getTime();

      // 프로젝트 총 기간이 0 이하일 경우 (오류 방지)
      if (projectTotalMs <= 0) {
        return { ...project, position: today > deadline ? 100 : 0, daysToDeadline: 0, isOverdue: today > deadline };
      }

      // 진행률 (0 = 시작일, 1 = 마감일)
      const progressRatio = elapsedMs / projectTotalMs;
      
      // 위치를 0-100% 범위로 제한
      const position = Math.max(0, Math.min(100, progressRatio * 100));

      // 마감일까지 남은 일수 계산
      const daysToDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      return {
        ...project,
        position,
        daysToDeadline,
        isOverdue: daysToDeadline < 0,
      };
    });
  }, []);

  // useMemo를 사용하여 성능 최적화
  const timelineData = useMemo(() => {
    // getTimelineData 함수를 의존성 배열에 추가합니다.
    return getTimelineData(projects, currentTime);
  }, [projects, currentTime, getTimelineData]);

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

  if (timelineData.length === 0) {
    return (
      <div className="timeline-empty">
        프로젝트가 없습니다.
      </div>
    );
  }

  return (
    <div className="project-timeline">
      <h3 className="timeline-title">프로젝트 타임라인</h3>
      {timelineData.map(project => (
        <div key={project.id} className="timeline-item">
          <div className="timeline-info">
            <span className="timeline-project-title">{project.title}</span>
            <span className="timeline-project-dday">
              {project.isOverdue 
                ? `D+${Math.abs(project.daysToDeadline)}` 
                : `D-${project.daysToDeadline}`}
            </span>
          </div>
          <div className="timeline-track-container">
            <div className="timeline-track">
              <div 
                className="timeline-progress-bar" 
                style={{ width: `${project.position}%` }}
              />
            </div>
            <div
              className="timeline-project-circle"
              style={{ 
                left: `${project.position}%`,
                backgroundColor: getProjectColor(project.priority, project.isOverdue, project.progress)
              }}
              title={`${project.title} - ${project.progress}% 완료`}
            />
          </div>
        </div>
      ))}
      
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
