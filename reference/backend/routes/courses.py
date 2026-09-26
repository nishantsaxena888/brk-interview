import os
import json
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

router = APIRouter(prefix="/api/courses", tags=["Courses"])

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MASTERCLASS_DIR = os.path.join(BASE_DIR, "aws-lambda-masterclass")

@router.get("/info")
async def get_course_info():
    """Returns course metadata and high-level curriculum outline."""
    return {
        "id": "aws-masterclass",
        "title": "Enterprise AWS Masterclass",
        "subtitle": "From Zero to Production-Ready Cloud & Serverless Architect",
        "total_modules": 37,
        "phases": [
            {"name": "Phase 01: Core AWS", "modules": ["module-01", "module-02", "module-03", "module-04", "module-05", "module-06", "module-07"]},
            {"name": "Phase 02: Modern Application Development", "modules": ["module-08", "module-09", "module-10", "module-11", "module-12", "module-13", "module-14"]},
            {"name": "Phase 03: Containers & DevOps", "modules": ["module-15", "module-16", "module-17", "module-18", "module-19", "module-20", "module-21"]},
            {"name": "Phase 04: Security & Operations", "modules": ["module-22", "module-23", "module-24", "module-25", "module-26", "module-27", "module-28"]},
            {"name": "Phase 05: Architect Level", "modules": ["module-29", "module-30", "module-31", "module-32", "module-33", "module-34", "module-35"]},
            {"name": "Phase 06: Emerging & AI Services", "modules": ["module-36", "module-37"]}
        ]
    }

@router.get("/modules")
async def list_modules():
    """Dynamically lists all available HTML module pages and files."""
    modules_dir = os.path.join(MASTERCLASS_DIR, "modules")
    if not os.path.exists(modules_dir):
        return {"modules": []}

    module_files = sorted([f for f in os.listdir(modules_dir) if f.endswith(".html")])
    return {
        "count": len(module_files),
        "modules": [
            {
                "file": f,
                "id": f.replace(".html", ""),
                "url": f"/modules/{f}"
            }
            for f in module_files
        ]
    }
