This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/pages/api-reference/create-next-app).

## Getting Started

First, run the development server:

### Terminal 1 - Backend (FastAPI with venv):

```bash
# Navigate to project root
cd /path/to/your-project

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Start FastAPI server
cd backend  # if backend is in separate folder
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Alternative if main.py is in root:
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2 - Frontend (React):
```bash
# Navigate to project root (new terminal)
cd /path/to/your-project

# Start React development server
npm start
# or if using Vite:
# npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## 📝 Virtual Environment Management

### Daily Development Routine:

```bash
# 1. Activate venv (every time you start working)
source venv/bin/activate  # macOS/Linux
# or
venv\Scripts\activate     # Windows

# 2. Check you're in the right environment
which python
pip list

# 3. Work on your project...

# 4. Deactivate when done (optional)
deactivate
```

### Managing Python Dependencies:
```bash
# Install new package
pip install package-name

# Update requirements.txt after installing new packages
pip freeze > requirements.txt

# Install dependencies on new machine/after git pull
pip install -r requirements.txt

# Remove package
pip uninstall package-name
pip freeze > requirements.txt  # Update requirements file
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/pages/building-your-application/deploying) for more details.




