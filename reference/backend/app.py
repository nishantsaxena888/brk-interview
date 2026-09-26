import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .database import init_db
from .routes.health import router as health_router
from .routes.courses import router as courses_router
from .routes.progress import router as progress_router
from .routes.quizzes import router as quizzes_router
from .routes.sandbox import router as sandbox_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Database on startup
    try:
        await init_db()
        print("Masterclass Database initialized successfully.")
    except Exception as e:
        print(f"Warning: Database initialization encountered an issue: {e}")
    yield

app = FastAPI(
    title="AWS Lambda Masterclass Platform API",
    description="Full-stack API and interactive engine for Enterprise AWS Masterclass notes and labs.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable Universal CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(health_router)
app.include_router(courses_router)
app.include_router(progress_router)
app.include_router(quizzes_router)
app.include_router(sandbox_router)

# Frontend directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "aws-lambda-masterclass")

@app.get("/components")
@app.get("/library")
async def get_component_library():
    """Serves the interactive Component Library Explorer catalog."""
    from fastapi.responses import FileResponse, RedirectResponse
    catalog_path = os.path.join(FRONTEND_DIR, "component-library.html")
    if os.path.exists(catalog_path):
        return FileResponse(catalog_path)
    return RedirectResponse(url="/")

@app.get("/api/components")
async def list_components_metadata():
    """Returns metadata schema for all MasterclassUI reusable components."""
    return {
        "library": "MasterclassUI",
        "version": "1.0.0",
        "compliance": "Strict 1000% Reusable Component Architecture",
        "components": [
            {"name": "Terminal", "element": "<ui-terminal>", "factory": "MasterclassUI.Terminal", "description": "Interactive CLI simulator with configurable commands and callbacks"},
            {"name": "CodeEditor", "element": "<ui-code-editor>", "factory": "MasterclassUI.CodeEditor", "description": "Code workspace with syntax highlighting, reset, and live sandbox execution"},
            {"name": "Quiz", "element": "<ui-quiz>", "factory": "MasterclassUI.Quiz", "description": "Knowledge assessment engine with instant grading and PostgreSQL syncing"},
            {"name": "CommandBlock", "element": "<ui-command>", "factory": "MasterclassUI.CommandBlock", "description": "Copyable CLI command block with description and syntax styling"},
            {"name": "Diagram", "element": "None (JS)", "factory": "MasterclassUI.Diagram", "description": "System architecture flow diagram with interactive nodes and connections"},
            {"name": "Lab", "element": "None (JS)", "factory": "MasterclassUI.Lab", "description": "Step-by-step interactive lab scenarios with progress tracking"},
            {"name": "ConsoleSimulator", "element": "None (JS)", "factory": "MasterclassUI.ConsoleSimulator", "description": "Simulated cloud management console with tabs and actions"}
        ]
    }

if os.path.exists(FRONTEND_DIR):
    # Mount at root with HTML=True so index.html and module HTML pages are served directly
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
else:
    print(f"Warning: Frontend directory not found at {FRONTEND_DIR}")
