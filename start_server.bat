@echo off
echo ==========================================
echo       Lecture Manager System Server
echo ==========================================
echo.
echo [INFO] Starting local web server...
echo [INFO] Please open your browser and visit:
echo.
echo        http://localhost:8000
echo.
echo [TIP] To stop the server, close this window or press Ctrl+C
echo.
python -m http.server
pause
