# SPRINT-01: Zero-Friction Onboarding Architecture

**Goal:** Implement the local development DevContainers and NPM Workspaces topology as defined in `ADR-Onboarding-Architecture.md`.

## 1. Pre-Flight Check
- **Feasibility:** High. Relies on standard Docker and VS Code DevContainers features.
- **Dependencies (Strict Sequence):** 
  1. `docker-compose.yml` must be created/moved to the root and its network (`monorepo-net`) configured **first**. The DevContainer cannot attach to a network that doesn't exist.
  2. `package.json` at root must be created and NPM Workspaces configured **before** any child directory adjustments to ensure dependency linking works correctly.
  3. `.devcontainer/devcontainer.json` is created **last**, referencing the network from step 1 and leveraging the workspaces from step 2.
- **Auth Requirements:** None for local development infrastructure.

## 2. Architecture Blueprint
*Refer to `docs/architecture/ADR-Onboarding-Architecture.md` for the full Mermaid topology.*
**Logical Flow:**
Root `docker-compose.yml` (Network & DB/n8n) ➔ Root `package.json` (Workspaces) ➔ `.devcontainer/devcontainer.json` (Node environment).

## 3. Time-Blocked Execution

### Task 1: Centralize Docker Compose Infrastructure
- **Description:** Move `n8n/docker-compose.yml` to the root directory. Configure it to define the `monorepo-net` bridge network and named volumes (e.g., `n8n_data`). Ensure the `n8n` service explicitly connects to this network. Add a PostgreSQL database service connected to the same network.
- **Time Estimate:** 15 minutes
- **Definition of Done:** `docker-compose.yml` exists at the root. The network `monorepo-net` and named volumes are explicitly defined. Old `n8n/docker-compose.yml` is deleted.

### Task 2: Initialize Root NPM Workspaces
- **Description:** Create the root `package.json` to configure the directories (e.g., `frontend`, `backend`, `shared`) as NPM workspaces. Add unified scripts (e.g., `dev` that concurrently starts frontend and backend, if applicable).
- **Time Estimate:** 10 minutes
- **Definition of Done:** Root `package.json` exists with the `workspaces` array. Unified execution scripts are defined.

### Task 3: Configure DevContainer Environment
- **Description:** Create `.devcontainer/devcontainer.json`. Set the base image (Node.js + TypeScript). Configure `runArgs` to attach to `monorepo-net`. Add necessary VS Code extensions (ESLint, Prettier, Angular Language Service, Docker). Add `postCreateCommand` to run `npm install` at the root.
- **Time Estimate:** 20 minutes
- **Definition of Done:** `.devcontainer/devcontainer.json` is fully populated, correctly references the network, includes required extensions, and automates workspace setup.

## 4. Retrospective Protocol
- **Estimated Total Time:** 45 minutes
- **Actual Time:** [To be filled post-sprint]
- **Notes:** [To be filled post-sprint]
