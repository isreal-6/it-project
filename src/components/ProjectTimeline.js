// ProjectTimeline.js
import React, { useState, useEffect } from "react";
import "./ProjectTimeline.css";

function ProjectTimeline({ projects }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000 * 60); // 1분마다 업데이트, 더 자주 움직이려면 1000ms로 변경

    return () => clearInterval(timer);
  }, []);

  const getProgressRatio = (createdAt, deadline) => {
    if (!createdAt || !deadline) return 0;

    const startDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const endDate = deadline.toDate ? deadline.toDate() : new Date(deadline);

    const totalDuration = endDate - startDate;
    const elapsed = now - startDate;

    if (totalDuration <= 0) return 1;
    return Math.min(Math.max(elapsed / totalDuration, 0), 1);
  };

  return (
    <div className="timeline-container">
      <div className="timeline-line" />
      {projects.map((project) => {
        const ratio = getProgressRatio(project.createdAt, project.deadline);
        return (
          <div
            key={project.id}
            className="timeline-dot"
            style={{ left: `${ratio * 100}%` }}
            title={project.title}
          />
        );
      })}
    </div>
  );
}

export default ProjectTimeline;

