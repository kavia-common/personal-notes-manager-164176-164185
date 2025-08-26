# Notes Frontend (React)

A complete web-based notes application UI built with React 18 and React Router 6.

- Implements the design spec in `assets/notes_app_main_design_notes.md` and `assets/style_guide.md`
- Responsive 3-column layout with App Bar, Sidebar, Notes List, and Editor
- Authentication (login/register) stored locally for demo use
- Note CRUD: create, select, edit, delete
- Favorite (star) notes
- Light/Dark theme with system preference
- Chatbot with web search powered by Perplexity API

## Getting Started

In the project directory:

### `npm install`
Install dependencies.

### Environment
To enable the chatbot web search, set your Perplexity API key:
1) Copy `.env.example` to `.env`
2) Fill in:
```
REACT_APP_PERPLEXITY_API_KEY=pk-xxxx_your_key_here
```
Obtain an API key from https://www.perplexity.ai/settings/api. Restart the dev server after changes.

### `npm start`
Runs the app in development mode at http://localhost:3000.

### `npm test`
Launches the test runner.

### `npm run build`
Builds the app for production.

## Chatbot Usage
- Click the floating chat button (bottom-right) to open the AI Assistant.
- Type your question and press Enter or click Send.
- The assistant searches the web (via Perplexity) and replies with a summary.
- When available, sources are listed below the response.

See `FEATURES.md` for more details.
