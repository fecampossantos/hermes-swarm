import React from 'react';

/**
 * Modal to display agent details and thoughts.
 * @param {Object} props
 * @param {Object} props.agent - The selected agent object
 * @param {Function} props.onClose - Callback to close the modal
 */
export default function AgentModal({ agent, onClose }) {
  if (!agent) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{agent.name} {agent.role === 'boss' ? '(Boss)' : ''}</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <h3>Role</h3>
          <p>{agent.role || 'Unknown'}</p>
          
          <h3>SOUL.md summary</h3>
          <p>{agent.soul || 'No soul provided.'}</p>
          
          <h3>Current Status</h3>
          <p>{agent.status === 'thinking' ? 'Deep in thought...' : 'Idle and waiting for tasks.'}</p>
          
          <h3>Recent Thoughts</h3>
          <p>{agent.thoughts || 'No recent thoughts logged.'}</p>
        </div>
      </div>
    </div>
  );
}
