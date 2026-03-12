# 🚀 FOOLPROOF STARTUP GUIDE

## The Simplest Way to Start Your App

### Every Day - Just 2 Steps:

**Step 1: Start Backend**
```
Double-click: D:\D_Downloads\Capstone\CAPSTONE\Kshitij CAPSTONE\START_BACKEND.bat
```
- Automatically kills old processes
- Starts on port 8000
- Keep the window open

**Step 2: Start Frontend** (in a new window)
```
Double-click: D:\D_Downloads\Capstone\CAPSTONE\START_FRONTEND.bat
```
- Starts on port 5173
- Keep the window open

**Done!** Open http://localhost:5173 in your browser

---

## Alternative: PowerShell (if you prefer)

**Backend:**
```powershell
cd "D:\D_Downloads\Capstone\CAPSTONE\Kshitij CAPSTONE\backend_rag"
python main.py
```

**Frontend:**
```powershell
cd "D:\D_Downloads\Capstone\CAPSTONE"
npm run dev
```

---

## ❓ Troubleshooting

### "Port 8000 is already in use"
- The batch script handles this automatically!
- Or manually: Open Task Manager → Find Python processes → End them

### "Module not found"
```powershell
cd "D:\D_Downloads\Capstone\CAPSTONE\Kshitij CAPSTONE\backend_rag"
pip install -r requirements.txt
```
You only need to do this ONCE or when adding new packages.

### "Can't connect to backend"
1. Check backend window shows: `Application startup complete`
2. Visit: http://localhost:8000/docs
3. If empty, restart the backend batch file

---

## 📍 Important URLs

- **Frontend**: http://localhost:5173
- **Backend API Docs**: http://localhost:8000/docs
- **Backend Health**: http://localhost:8000

---

## 🛑 How to Stop

Press `Ctrl+C` in each terminal window, then close them.

---

**That's it! No virtual environment confusion, no reinstalling packages every time.**
