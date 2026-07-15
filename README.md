# Hermes Swarm

Hermes Swarm is a React-based observability dashboard for managing and visualizing a swarm of AI agents powered by the Hermes Gateway. The UI connects to the backend orchestration layer (via the `/api/sessions` and Kanban APIs) to display real-time execution status of background `slash_worker` processes.

> **Note**: This project is currently on hold / at a break. I don't have the time to continue working on it right now, so the codebase is paused as-is.

## Features (In Progress)
- **Real-Time Agent Polling**: Fetches active agents directly from the Hermes Gateway (`/api/sessions`).
- **Office Scene**: A visual pixel-art dashboard showing the active agents and their working states.
- **Kanban Board**: A task dispatcher that allows sending goals directly to the orchestration layer.

## Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Start the dev server: `npm run dev`
4. Configure your Gateway URL in the UI settings (default proxy is enabled).
