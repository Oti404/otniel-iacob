# Development & Project Overview

This document serves as the primary guide for developers working on the project.

---

## 1. Project Directory Structure
- `frontend/`: User interface.
- `backend/`: Server logic & APIs.
- `database/`: Schemas & migrations.
- `shared/`: Shared code/types.
- `e2e/`: End-to-end tests.
- `docs/`: Project documentation.
- `n8n/`: Automation workflows.
- `scripts/`: Utility scripts.

---

## 2. Core Files
- `README.md`: Main entry point.
- `docker-compose.yml`: Infrastructure orchestration.

---

## 3. Batch Scripts Guide (.bat)
Use the scripts in the root or `scripts/` folder for Windows automation.
- `example_script.bat`: Usage `.\example_script.bat [args]`.

**Guidelines**: Ensure scripts are well-commented and handle error states.
