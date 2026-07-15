import React, { useState } from "react";
import { dispatchTask } from "../gateway";

export default function KanbanBoard({ tasks, hasGateway }) {
  const [input, setInput] = useState("");
  const [assignee, setAssignee] = useState("orchestrator");

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!input.trim() || !hasGateway) return;
    
    try {
      await dispatchTask(input, assignee);
      setInput("");
    } catch (e) {
      console.error("Failed to dispatch task:", e);
    }
  };

  return (
    <div className="log-container">
      <div className="section" style={{ marginBottom: 0, flex: 1, display: "flex", flexDirection: "column" }}>
        <h2>Kanban Board</h2>
        
        <div className="log-messages" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", maxHeight: "250px" }}>
          {tasks.length === 0 ? (
            <div className="msg" style={{ borderLeftColor: "transparent", color: "#94a3b8" }}>
              No tasks on the board.
            </div>
          ) : (
            tasks.map((task, idx) => (
              <div key={idx} className="msg" style={{ borderLeftColor: task.status === 'done' ? '#22c55e' : (task.status === 'in_progress' ? '#eab308' : '#3b82f6') }}>
                <strong>[{task.status || 'open'}] {task.assignee || 'unassigned'}: </strong>
                {task.description || task.task}
              </div>
            ))
          )}
        </div>
        
        <form onSubmit={handleDispatch} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={hasGateway ? "Task description..." : "Connect to Gateway first"}
              disabled={!hasGateway}
              style={{ 
                flex: 1, 
                background: "rgba(15, 23, 42, 0.5)", 
                border: "1px solid var(--border-glass)",
                borderRadius: "6px",
                color: "white",
                padding: "10px"
              }}
            />
            <input 
              type="text" 
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              placeholder="Assign to..."
              disabled={!hasGateway}
              style={{ 
                width: '100px', 
                background: "rgba(15, 23, 42, 0.5)", 
                border: "1px solid var(--border-glass)",
                borderRadius: "6px",
                color: "white",
                padding: "10px"
              }}
            />
            <button type="submit" className="btn" style={{ width: "auto" }} disabled={!hasGateway || !input.trim()}>
              Dispatch
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
