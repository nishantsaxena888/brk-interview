@echo off
set PORT=%1
if "%PORT%"=="" set PORT=8080

echo ====================================================
echo Starting AWS Masterclass Interactive Learning Server
echo Port: %PORT%
echo URL:  http://localhost:%PORT%
echo ====================================================

python -m http.server %PORT% --directory "%~dp0aws-lambda-masterclass"
