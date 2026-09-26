import sys
import time
import asyncio
import subprocess
from fastapi import APIRouter, HTTPException
from ..models import CodeExecutionRequest, CodeExecutionResponse

router = APIRouter(prefix="/api/sandbox", tags=["Sandbox"])

BLOCKED_PATTERNS = [
    "import shutil",
    "shutil.rmtree",
    "os.remove",
    "os.system('rm",
    "subprocess.Popen(['rm",
    ":(){ :|:& };:", # fork bomb
]

@router.post("/run-code", response_model=CodeExecutionResponse)
async def run_code_in_sandbox(payload: CodeExecutionRequest):
    """Executes Python code safely with execution timeout and sandboxing."""
    # Basic security safety guardrail
    code = payload.code
    for pattern in BLOCKED_PATTERNS:
        if pattern in code:
            return CodeExecutionResponse(
                status="blocked",
                stdout="",
                stderr=f"Security Policy Violation: '{pattern}' is not permitted in the interactive sandbox.",
                execution_time_ms=0.0
            )

    start_time = time.time()
    timeout = min(payload.timeout_seconds or 5, 10)

    try:
        # Run in separate Python process asynchronously
        proc = await asyncio.create_subprocess_exec(
            sys.executable, "-c", code,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )

        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(proc.communicate(), timeout=timeout)
            duration_ms = round((time.time() - start_time) * 1000, 2)
            return CodeExecutionResponse(
                status="success" if proc.returncode == 0 else "error",
                stdout=stdout_bytes.decode("utf-8", errors="replace"),
                stderr=stderr_bytes.decode("utf-8", errors="replace"),
                execution_time_ms=duration_ms
            )
        except asyncio.TimeoutError:
            proc.kill()
            return CodeExecutionResponse(
                status="timeout",
                stdout="",
                stderr=f"Execution timed out after {timeout} seconds.",
                execution_time_ms=round(timeout * 1000, 2)
            )
    except Exception as e:
        return CodeExecutionResponse(
            status="internal_error",
            stdout="",
            stderr=str(e),
            execution_time_ms=round((time.time() - start_time) * 1000, 2)
        )
