import React, { useState } from 'react';
import { createBoss, createCharacter } from '../gateway';

/**
 * Form to create the Boss or Agents.
 * @param {Object} props
 * @param {boolean} props.hasBoss - True if a boss already exists
 * @param {Function} props.onBossCreated - Callback when boss is created
 * @param {Function} props.onAgentCreated - Callback when an agent is created
 */
export default function CreateAgentForm({ hasBoss, onBossCreated, onAgentCreated }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('dev');
  const [soul, setSoul] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      if (!hasBoss) {
        // Create boss
        await createBoss(name);
        onBossCreated({ name, role: 'boss', status: 'idle', soul: 'I am the Boss.' });
      } else {
        // Create regular agent
        await createCharacter(name, soul);
        onAgentCreated({ name, role, status: 'idle', soul });
      }
      setName('');
      setSoul('');
    } catch (error) {
      console.error("Failed to create agent", error);
      alert("Error connecting to agent session. Ensure your API token is set. Fallback: creating locally.");
      
      // Fallback for UI presentation
      if (!hasBoss) {
        onBossCreated({ name, role: 'boss', status: 'idle', soul: 'I am the Boss.' });
      } else {
        onAgentCreated({ name, role, status: 'idle', soul });
      }
      setName('');
      setSoul('');
    }
    setLoading(false);
  };

  return (
    <div className="section">
      <h2>{hasBoss ? 'Create Agent' : 'Create Boss'}</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            placeholder="e.g. Alice" 
            required
          />
        </div>
        
        {hasBoss && (
          <>
            <div className="input-group">
              <label>Role</label>
              <select value={role} onChange={e => setRole(e.target.value)}>
                <option value="dev">Developer</option>
                <option value="qa">QA Tester</option>
                <option value="cto">CTO</option>
                <option value="designer">Designer</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>SOUL.md</label>
              <textarea 
                value={soul} 
                onChange={e => setSoul(e.target.value)} 
                rows="4" 
                placeholder="Define this agent's instructions..."
              ></textarea>
            </div>
          </>
        )}
        
        <button type="submit" className="btn" disabled={loading}>
          {loading ? 'Creating...' : (hasBoss ? 'Spawn Agent' : 'Spawn Boss')}
        </button>
      </form>
    </div>
  );
}
