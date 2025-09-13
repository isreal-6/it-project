// ProjectForm.js
import { useState } from "react";
import { Timestamp } from "firebase/firestore";
import "./ProjectForm.css";

function ProjectForm({ onSubmit, onClose }) {
  const [title, setTitle] = useState("");
  const [deadline, setDeadline] = useState("");
  const [progress, setProgress] = useState(0);
  const [priority, setPriority] = useState("중");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !deadline) return;

    // deadline을 Timestamp로 변환
    const deadlineTimestamp = deadline instanceof Date
      ? Timestamp.fromDate(deadline)
      : new Date(deadline); // 혹시 문자열이면 Date로 변환 후 Timestamp

    onSubmit({ 
      title, 
      deadline: deadlineTimestamp, 
      progress: Number(progress), 
      priority 
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>프로젝트 추가</h2>
        <form onSubmit={handleSubmit}>
          <label>
            프로젝트명:
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label>
            마감일:
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(new Date(e.target.value))}
            />
          </label>

          <label>
            진행도 (%):
            <input
              type="number"
              value={progress}
              onChange={(e) => setProgress(e.target.value)}
              min="0"
              max="100"
            />
          </label>

          <label>
            중요도:
            <select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="상">상</option>
              <option value="중">중</option>
              <option value="하">하</option>
            </select>
          </label>

          <button type="submit">추가</button>
          <button type="button" onClick={onClose}>취소</button>
        </form>
      </div>
    </div>
  );
}

export default ProjectForm;
