# Check if python is available
$pythonCmd = Get-Command python -ErrorAction SilentlyContinue

if ($pythonCmd) {
    Write-Host "Starting problem import..."
    python backend_rag/import_all_problems.py
} else {
    Write-Host "Python not found. Please ensure Python is installed and in your PATH."
}
