# Security Remediation TODOs

Aceste sarcini au fost extrase din auditul `THREAT_MATRIX.md` și trebuie implementate de către agenții responsabili.

## [x] 1. Extragerea Secretelor Hardcodate (Responsabil: **DevOps**)
- **Vulnerabilitate:** Secrete hardcodate în `docker-compose.yml` (`POSTGRES_USER`, `POSTGRES_PASSWORD`, `DB_POSTGRESDB_PASSWORD`).
- **Acțiune Necesară:** La momentul configurării CI/CD, agentul DevOps trebuie să extragă aceste variabile într-un sistem de gestiune a secretelor (ex: AWS Secrets Manager). Fișierul `docker-compose.yml` va rămâne strict pentru execuția locală.

## [x] 2. Fixarea Versiunii Angular CLI (Responsabil: **Coder**)
- **Vulnerabilitate:** Instalare non-deterministă a Angular CLI în containerul de dezvoltare.
- **Locație:** `.devcontainer/devcontainer.json` -> `"postCreateCommand": "npm install -g @angular/cli && npm install"`
- **Acțiune Necesară:** Agentul Coder trebuie să modifice comanda de instalare pentru a specifica o versiune fixă (ex: `@angular/cli@21.0.4` având în vedere că proiectul e generat cu v21). Aceasta previne riscurile de tip supply chain și problemele de compatibilitate viitoare.
