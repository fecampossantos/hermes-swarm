import React, { useState, useEffect } from "react";
import OfficeScene from "./components/OfficeScene";
import AgentModal from "./components/AgentModal";
import KanbanBoard from "./components/KanbanBoard";
import SettingsModal from "./components/SettingsModal";
import { setGatewayConfig, checkGateway, getGatewayConfig } from "./gateway";
import { useSwarmState } from "./hooks/useSwarmState";
import { useKanbanState } from "./hooks/useKanbanState";

export default function App() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  
  // Connection and settings state
  const [isConnected, setIsConnected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Fetch real swarm data from backend hooks
  const swarm = useSwarmState();
  const kanbanTasks = useKanbanState();

  // Load persisted config on mount
  useEffect(() => {
    let loadedConfig = getGatewayConfig();
    const stored = localStorage.getItem("hermes-swarm-state");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.config) {
          loadedConfig = data.config;
          setGatewayConfig(loadedConfig);
        }
      } catch (e) {
        console.error("Failed to parse stored config");
      }
    }
    
    verifyConnection();
  }, []);

  const verifyConnection = async () => {
    const connected = await checkGateway();
    setIsConnected(connected);
  };

  // Sync config to local storage (agents are NO LONGER synced, backend is source of truth)
  useEffect(() => {
    localStorage.setItem("hermes-swarm-state", JSON.stringify({ 
      config: getGatewayConfig() 
    }));
  }, [isConnected]); // Save when connection state changes

  const handleSaveSettings = async (newConfig) => {
    setGatewayConfig(newConfig);
    setShowSettings(false);
    
    // Immediately check connection with new config
    const connected = await checkGateway();
    setIsConnected(connected);
    
    localStorage.setItem("hermes-swarm-state", JSON.stringify({ 
      config: newConfig 
    }));
  };

  return (
    <div className="app-container">
      {/* Visual Scene Area */}
      <OfficeScene 
        agents={swarm} 
        onAgentClick={setSelectedAgent} 
      />

      {/* Orchestration Sidebar */}
      <div className="sidebar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
          <h1 style={{ marginBottom: 0 }}>Hermes Swarm</h1>
          
          {/* Connection Indicator */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              cursor: 'pointer',
              background: 'rgba(0,0,0,0.2)',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '10px'
            }}
            onClick={() => setShowSettings(true)}
            title="Click to configure Gateway"
          >
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              background: isConnected ? '#22c55e' : '#ef4444',
              boxShadow: isConnected ? '0 0 8px #22c55e' : '0 0 8px #ef4444'
            }}></div>
            <span style={{ color: 'var(--text-muted)' }}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {/* The UI is now a Kanban Viewer and Dispatcher */}
        <KanbanBoard 
          tasks={kanbanTasks}
          hasGateway={isConnected}
        />
      </div>
      
      {/* Overlay Modals */}
      <AgentModal 
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
      
      {showSettings && (
        <SettingsModal 
          currentConfig={getGatewayConfig()}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
