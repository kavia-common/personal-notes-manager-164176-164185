# Notes Frontend — Features

This frontend implements a complete notes manager UI based on assets/notes_app_main_design_notes.md and assets/style_guide.md.

Key features:
- Authentication (login/register) stored locally for demo purposes
- 3-column responsive layout (App Bar, Sidebar, Notes List, Editor)
- Note CRUD (create, select, update title/content, delete)
- Favorite/star toggle
- Search input UI (non-functional stub, ready for wiring)
- Theming (light/dark) respecting prefers-color-scheme with manual toggle
- Responsive behaviors for tablet/mobile (editor overlay placeholder via CSS classes)
- Accessibility-minded controls and focusable inputs
- Chatbot (floating button) that searches the web via Perplexity and shows conversational responses with sources

Tech:
- React 18, React Router v6
- LocalStorage for data persistence
- date-fns for time formatting
- UUID for note IDs

Env:
- REACT_APP_PERPLEXITY_API_KEY required to enable the chatbot web search.
