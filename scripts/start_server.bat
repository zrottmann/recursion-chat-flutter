@echo off
cd /d C:\Users\Zrott\OneDrive\Desktop\Claude\Trading Post
venv\Scripts\python.exe -m uvicorn app_sqlite:app --host 127.0.0.1 --port 3000 --reload
