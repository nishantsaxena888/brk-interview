# 🚀 AWS Masterclass: Full-Stack Production & Run Guide

Yeh project ek full-stack, production-grade learning platform hai jisme **FastAPI REST API**, **PostgreSQL Database**, aur **Exact Interactive Frontend (HTML5/CSS3/JS Engines)** integrated hain.

Aap isko **Docker Compose** se, **Render.com** par, ya **locally** bina kisi dikkat ke chala sakte hain.

---

## 🐳 Option 1: Docker Compose Se Chalana (Full-Stack + PostgreSQL)

Sabse best aur recommended tarika — isme **PostgreSQL 15** database aur **FastAPI Backend + Frontend** ek sath start ho jate hain.

### Step-by-Step:
1. Terminal / Command Prompt open karein:
   ```cmd
   cd D:\wscs_bedrock\Uday_AWS_Services_notes
   ```
2. Build aur Run karein:
   ```cmd
   docker compose up --build
   ```
   *(Background me chalana ho to `-d` flag lagayein: `docker compose up --build -d`)*

3. **Status Check:**
   - **Web App & UI:** [http://localhost:8080](http://localhost:8080)
   - **Module 37 (Amazon Bedrock):** [http://localhost:8080/modules/module-37.html](http://localhost:8080/modules/module-37.html)
   - **FastAPI Interactive Docs (Swagger):** [http://localhost:8080/docs](http://localhost:8080/docs)
   - **Health Check API:** [http://localhost:8080/health](http://localhost:8080/health)
   - **PostgreSQL Port:** Host port `5433` par mapped hai (internal `5432`).

4. **Container Stop karna:**
   ```cmd
   docker compose down
   ```

---

## ☁️ Option 2: Render.com Par Cloud Deploy Karna

Project me `render.yaml` aur `Dockerfile` included hain jo 1-click cloud deploy support karte hain:

1. Apne GitHub repository me `Uday_AWS_Services_notes` push karein.
2. [Render Dashboard](https://dashboard.render.com/) par jayein:
   - **New** -> **Blueprint** select karein.
   - Apna GitHub repo connect karein.
   - Render automatically `render.yaml` detect karke:
     1. Free **Managed PostgreSQL Database** create karega (`masterclass_db`).
     2. **Web Service** build karega aur `DATABASE_URL` inject karega.
3. Health check path `/health` automated zero-downtime monitor karega.

---

## ⚡ Option 3: Local 1-Click Batch Script (Bina Docker ke)

Agar aapke system par Docker nahi chal raha hai aur aap turant dekhna chahte hain:
- Directory: `D:\wscs_bedrock\Uday_AWS_Services_notes\`
- Bas **`start_server.bat`** par double click karein!
- Ya custom port ke sath:
  ```cmd
  cd D:\wscs_bedrock\Uday_AWS_Services_notes
  start_server.bat 8080
  ```

---

## 🐍 Option 4: Local FastAPI + Uvicorn Direct Run

```cmd
cd D:\wscs_bedrock\Uday_AWS_Services_notes
pip install -r backend/requirements.txt
uvicorn backend.app:app --host 0.0.0.0 --port 8080 --reload
```
*(Bina PostgreSQL ke chalane par yeh automatically `data/masterclass.db` SQLite fallback use karega)*

---

## 🧩 Reusable Component Library (MasterclassUI)

Project me ek fully-functional, **1000% Reusable Component Library** add ki gayi hai jo Web Components (`<ui-terminal>`, `<ui-quiz>`, `<ui-code-editor>`, etc.) aur JavaScript API (`MasterclassUI.*`) dono support karti hai:

### 1. Interactive Component Catalog:
- Open karein: **[http://localhost:8080/components](http://localhost:8080/components)** (ya `http://localhost:8080/component-library.html`)
- Isme sabhi components ke **Live Interactive Demos**, **Props Controls**, aur **1-Click Copy Code** buttons available hain.

### 2. Kisi bhi HTML/React/Vue project me use karne ka tarika:
```html
<!-- Web Component Example -->
<ui-terminal title="Custom CLI" prompt="user$ " mode="simulated">
  <script type="application/json">
    { "help": "Available commands: help, status, clear" }
  </script>
</ui-terminal>

<!-- Or Vanilla JS API Example -->
<script src="js/components/masterclass-ui.js"></script>
<script>
  MasterclassUI.Quiz('#quiz-container', {
    title: 'Cloud Assessment',
    questions: [...]
  });
</script>
```

---

## 🌐 Complete URL Directory

| Resource | URL | Description |
| :--- | :--- | :--- |
| **Main Landing Page** | [http://localhost:8080](http://localhost:8080) | Course overview & 37 modules |
| **Component Library Explorer** | [http://localhost:8080/components](http://localhost:8080/components) | Interactive Storybook catalog for UI components |
| **Components Schema API** | [http://localhost:8080/api/components](http://localhost:8080/api/components) | JSON metadata of all reusable UI components |
| **Module 37: Amazon Bedrock** | [http://localhost:8080/modules/module-37.html](http://localhost:8080/modules/module-37.html) | Exact Bedrock interactive lab |
| **Module 01: AWS IAM** | [http://localhost:8080/modules/module-01.html](http://localhost:8080/modules/module-01.html) | Identity & Access Management |
| **Module 08: AWS Lambda** | [http://localhost:8080/modules/module-08.html](http://localhost:8080/modules/module-08.html) | Core Serverless compute |
| **Swagger API Docs** | [http://localhost:8080/docs](http://localhost:8080/docs) | Interactive API exploration |
| **Healthcheck API** | [http://localhost:8080/health](http://localhost:8080/health) | DB connection & uptime status |
| **Progress Sync API** | `POST http://localhost:8080/api/progress/sync` | Student progress persistence |
| **Quiz Submit API** | `POST http://localhost:8080/api/quizzes/submit` | Quiz score logging |
| **Sandbox Execution API**| `POST http://localhost:8080/api/sandbox/run-code` | Python code sandbox |

---

## 🛑 Process Kill / Stop Command (PowerShell)

Agar background me port 8080 occupied ho to usko release karne ke liye:
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process -Force
```
