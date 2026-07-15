import React from 'react';

/**
 * Renders the pixel-art office background and the agents within it.
 * @param {Object} props
 * @param {Array} props.agents - List of agent objects
 * @param {Object} props.boss - Boss object
 * @param {Function} props.onAgentClick - Callback when an agent is clicked
 */
export default function OfficeScene({ agents, boss, onAgentClick }) {
  // Simple layout logic to scatter agents across the screen
  const getAgentStyle = (index, total) => {
    // Generate a pseudo-random but deterministic position
    const row = Math.floor(index / 5);
    const col = index % 5;
    const x = 20 + col * 15 + (row % 2) * 5; 
    const y = 30 + row * 20;
    
    return {
      left: `${x}%`,
      top: `${y}%`
    };
  };

  return (
    <div className="office-scene">
      <div className="office-floor"></div>
      <div className="agents-container">
        {agents.map((agent, i) => (
          <div 
            key={agent.id || i} 
            className="agent" 
            style={getAgentStyle(i, agents.length)}
            onClick={() => onAgentClick(agent)}
          >
            <div className="agent-sprite">
              <div className={`status-dot ${agent.status === 'working' ? 'thinking' : (agent.status === 'error' ? 'error' : '')}`}></div>
            </div>
            <div className="agent-name">{agent.profile_name || agent.id || `Worker ${i}`}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px' }}>
              {agent.status || 'idle'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
