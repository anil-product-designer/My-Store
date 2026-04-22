# TRACE (Design Decision Log)

Document the rationale behind every design move.

**TRACE** is a standalone React application built to help product designers and engineers systematically track, organize, and present their design decisions. Stop relying on scattered Slack messages or massive Figma files. Establish a clean, chronological timeline of your design iterations with integrated "before & after" visual comparisons.

## 🚀 Key Features

- **Workspace Management**: Initialize dedicated workspaces for different clients or products.
- **Decision Timelines**: Log the specific rationale, advantages, and tradeoffs for every UX/UI change.
- **Visual Validation**: Built-in support for "Before & After" image uploads, including direct clipboard pasting.
- **Presentation Mode**: Launch a distraction-free, keyboard-navigable slideshow of your decisions, perfect for client reviews.
- **Integrated Design System**: Includes a fully functional, self-documenting internal design system built right into the app routing.
- **Supabase Ready**: Includes immediate "Demo Mode" fallback caching to `localStorage`, with optional seamless integration into a private Supabase instance.

## 💻 Tech Stack

- **Frontend Framework**: React 19 + Vite
- **Styling**: Pure CSS + CSS Variables (Strict 4px/8px grid system)
- **State Management**: Zustand
- **Icons**: Lucide React
- **Backend / DB**: Supabase (PostgreSQL)

## 🛠️ Getting Started (Local Development)

To run TRACE locally on your machine, pull down the repository and start the Vite development server.

```bash
# 1. Install dependencies
npm install

# 2. Run the local development server
npm run dev
```

Your app will be automatically served, typically on `http://localhost:5173`. 

If you wish to configure a Supabase backend for persistent cloud storage, input your `Project URL` and `Anon Public Key` when prompted on the initial splash screen setup menu.

---

## 📦 Pushing to GitHub

If you are ready to publish this exact codebase to your own GitHub repository, open your terminal at the root of the project and run the following sequential commands:

```bash
# 1. Stage all the files for the initial commit
git add .

# 2. Create your commit
git commit -m "Initial commit: TRACE Design Decision Log"

# 3. Ensure your default branch is named 'main'
git branch -M main

# 4. Link this local repository to your blank GitHub repository
# IMPORTANT: Replace the URL below with your ACTUAL GitHub repository URL!
git remote add origin https://github.com/YourUsername/YourRepositoryName.git

# 5. Push your code to GitHub
git push -u origin main
```
