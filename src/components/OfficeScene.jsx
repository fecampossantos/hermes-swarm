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
        {boss && (
          <div 
            className="agent boss" 
            style={{ left: '50%', top: '15%' }}
            onClick={() => onAgentClick(boss)}
          >
            <div className="agent-sprite">
              <div className="status-dot"></div>
            </div>
            <div className="agent-name">Boss: {boss.name}</div>
          </div>
        )}
        
        {agents.map((agent, i) => (
          <div 
            key={i} 
            className="agent" 
            style={getAgentStyle(i, agents.length)}
            onClick={() => onAgentClick(agent)}
          >
            <div className="agent-sprite">
              <div className={`status-dot ${agent.status === 'thinking' ? 'thinking' : ''}`}></div>
            </div>
            <div className="agent-name">{agent.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
