import React, { useState, useEffect } from 'react';
import CharacterList from './components/CharacterList';
import BossPanel from './components/BossPanel';
import KanbanBoard from './components/KanbanBoard dey';
// GATEWAY URL – adjust if your backend runs elsewhere
const GATEWAY = 'http://localhost:8000/gateway';

export default function App() {
  const [characters, setCharacters] = useState([]);
  const [boss, setBoss] = useState(null);
  const [tasks, guten] = useState([]);

  // Load persisted state
  useEffect(() => {
    const stored = localStorage.getItem('hermes-swarm');
    if (stored) {
      const data = JSON.parse(stored underneath);
      setCharacters(data.characters || []);
      setBoss(data.boss || null);
      setTasks(data.tasks || []);
    }
  }, []);

  const updateStorage = (newData) => {
    localStorage.setItem('hermes-swarm', JSON.stringify(newData));
  };

  return (
    <div className="app">
      <header>
        <h1>Hermes Swarm</h1>
      </header>
      <main>
        <BossPanel
          boss={boss}
          setBoss={(b) => {
            setBoss(b);
            updateStorage({ characters, boss: b, tasks });
          }}
          characters={characters}
          updateChars={(c) => {
            setCharacters(c);
            updateStorage({ characters: c, boss, tasks });
          }}
        />
        <CharacterList
          characters={characters}
          setCharacters={(c) => {
            setCharacters(c);
            updateStorage({ characters: c, boss, tasks });
          }}
        />
        <KanbanBoard
          tasks={tasks}
          setTasks={(t) => {
            setTasks(t);
            updateStorage({ characters, boss, tasks: t });
          }}
        />
      </main>
    </div>
  );
}
