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
