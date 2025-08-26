import React, { useEffect, useMemo, useState, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { formatDistanceToNow } from 'date-fns';
import './App.css';

/**
 * Simple localStorage-backed services for auth and notes.
 * This keeps the app fully frontend-only as requested.
 */

/* Auth Service */
const AUTH_KEY = 'notes-auth-user';
const NotesAuthContext = createContext(null);

function usePersistedState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue];
}

// PUBLIC_INTERFACE
function AuthProvider({ children }) {
  /** Provides authentication state and actions for the app. */
  const [user, setUser] = usePersistedState(AUTH_KEY, null);

  const login = useCallback((email, password) => {
    // demo login: accept anything non-empty
    if (!email || !password) throw new Error('Email and password are required');
    const u = { id: 'demo', email };
    setUser(u);
    return u;
  }, [setUser]);

  const register = useCallback((email, password) => {
    if (!email || !password) throw new Error('Email and password are required');
    const u = { id: 'demo', email };
    setUser(u);
    return u;
  }, [setUser]);

  const logout = useCallback(() => setUser(null), [setUser]);

  const value = useMemo(() => ({ user, login, logout, register }), [user, login, logout, register]);
  return <NotesAuthContext.Provider value={value}>{children}</NotesAuthContext.Provider>;
}

function useAuth() { return useContext(NotesAuthContext); }

/* Notes Service */
const NOTES_KEY = 'notes-data';
const META_KEY = 'notes-meta';
const NotesContext = createContext(null);

// PUBLIC_INTERFACE
function NotesProvider({ children }) {
  /** Provides notes state and CRUD actions for the app. */
  const [notes, setNotes] = usePersistedState(NOTES_KEY, []);
  const [meta, setMeta] = usePersistedState(META_KEY, { selectedNoteId: null, tags: {} });

  const createNote = useCallback(() => {
    const now = new Date().toISOString();
    const n = {
      id: uuidv4(),
      title: 'Untitled',
      content: '',
      tags: [],
      starred: false,
      updatedAt: now,
      createdAt: now
    };
    setNotes(prev => [n, ...prev]);
    setMeta(m => ({ ...m, selectedNoteId: n.id }));
    return n;
  }, [setNotes, setMeta]);

  const updateNote = useCallback((id, patch) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n));
  }, [setNotes]);

  const deleteNote = useCallback((id) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    setMeta(m => (m.selectedNoteId === id ? { ...m, selectedNoteId: null } : m));
  }, [setNotes, setMeta]);

  const selectNote = useCallback((id) => {
    setMeta(m => ({ ...m, selectedNoteId: id }));
  }, [setMeta]);

  const toggleStar = useCallback((id) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, starred: !n.starred } : n));
  }, [setNotes]);

  const value = useMemo(() => ({
    notes, createNote, updateNote, deleteNote, selectNote, selectedNoteId: meta.selectedNoteId, toggleStar
  }), [notes, createNote, updateNote, deleteNote, selectNote, meta.selectedNoteId, toggleStar]);

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

function useNotes() { return useContext(NotesContext); }

/* Theme */
function useTheme() {
  const [theme, setTheme] = useState(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });
  useEffect(() => { document.documentElement.setAttribute('data-theme', theme); }, [theme]);
  return { theme, setTheme };
}

/* Icons (simple inline SVGs for key actions) */
function Icon({ name, size = 20 }) {
  const s = { width: size, height: size };
  switch (name) {
    case 'search': return <svg style={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M20 20L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
    case 'plus': return <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
    case 'star': return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 17.3l-5.4 3.3 1.5-6.1L3 9.8l6.2-.6L12 3l2.8 6.2 6.2.6-5.1 4.7 1.5 6.1z"/></svg>;
    case 'star-outline': return <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M12 4.8l2.1 4.7 5.1.5-3.8 3.5 1.1 4.9L12 16.8l-4.5 2.6 1.1-4.9L4.8 10l5.1-.5L12 4.8z" stroke="currentColor" strokeWidth="1.5" fill="none"/></svg>;
    case 'kebab': return <svg style={s} viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>;
    case 'sync': return <svg style={s} viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 0115.5-5.9M21 12a9 9 0 01-15.5 5.9" stroke="currentColor" strokeWidth="2"/><path d="M7 6l-.5 4L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M17 18l.5-4L21 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
    default: return null;
  }
}

/* Protected route */
function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

/* Screens: Login/Register */
function LoginScreen() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    try {
      login(email, password);
      navigate('/');
    } catch (ex) {
      setErr(ex.message);
    }
  };

  return (
    <div className="editor-scroll" style={{ alignItems: 'center' }}>
      <div className="editor-content" style={{ maxWidth: 420 }}>
        <h1>Sign in</h1>
        {err && <div style={{ background: 'rgba(239,68,68,.16)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 10, padding: 12, color: 'var(--danger)', marginBottom: 12 }}>{err}</div>}
        <form onSubmit={submit} className="column" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn btn-primary" type="submit">Continue</button>
        </form>
        <div style={{ marginTop: 12, color: 'var(--text-muted)' }}>
          No account? <a href="/register" style={{ color: 'var(--accent)' }}>Create one</a>
        </div>
      </div>
    </div>
  );
}

function RegisterScreen() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    try {
      register(email, password);
      navigate('/');
    } catch (ex) { setErr(ex.message); }
  };

  return (
    <div className="editor-scroll" style={{ alignItems: 'center' }}>
      <div className="editor-content" style={{ maxWidth: 420 }}>
        <h1>Create account</h1>
        {err && <div style={{ background: 'rgba(239,68,68,.16)', border: '1px solid rgba(239,68,68,.35)', borderRadius: 10, padding: 12, color: 'var(--danger)', marginBottom: 12 }}>{err}</div>}
        <form onSubmit={submit} className="column" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input className="input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="input" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button className="btn btn-primary" type="submit">Create account</button>
        </form>
        <div style={{ marginTop: 12, color: 'var(--text-muted)' }}>
          Have an account? <a href="/login" style={{ color: 'var(--accent)' }}>Sign in</a>
        </div>
      </div>
    </div>
  );
}

/* App Bar */
function AppBar({ onNewNote }) {
  const { theme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState('');
  const onToggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  return (
    <div className="appbar">
      <div className="brand" aria-label="Notes App Brand">
        <span style={{ width: 24, height: 24, borderRadius: 6, background: 'var(--accent)', display: 'inline-block' }}></span>
        <span>Notes</span>
      </div>
      <div className="row" style={{ flex: 1 }}>
        <div className="row" style={{ position: 'relative', flex: 1, maxWidth: 560 }}>
          <span className="row" style={{ position: 'absolute', left: 8, top: 0, bottom: 0, color: 'var(--text-muted)' }}><Icon name="search" /></span>
          <input className="input" style={{ width: '100%', paddingLeft: 36 }} placeholder="Search notes" value={query} onChange={e => setQuery(e.target.value)} />
        </div>
      </div>
      <button className="btn btn-primary" onClick={onNewNote}><span className="row"><Icon name="plus" /> New Note</span></button>
      <button className="icon-btn" title="Sync"><Icon name="sync" /></button>
      <button className="btn btn-secondary" onClick={onToggleTheme} aria-label="Toggle theme">{theme === 'light' ? 'Dark' : 'Light'}</button>
      <div className="row" style={{ marginLeft: 8 }}>
        <div title={user?.email} style={{ width: 32, height: 32, borderRadius: 16, background: 'var(--bg-active)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
          {user?.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <button className="btn btn-secondary" onClick={logout}>Logout</button>
      </div>
    </div>
  );
}

/* Sidebar */
function Sidebar() {
  const location = useLocation();
  const active = (path) => location.pathname === path ? 'active' : '';
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="label">Primary</div>
        <a className={`nav-item ${active('/')}`} href="/">All Notes</a>
        <a className={`nav-item ${active('/favorites')}`} href="/favorites">Favorites</a>
        <a className={`nav-item ${active('/archive')}`} href="/archive">Archive</a>
        <a className={`nav-item ${active('/trash')}`} href="/trash">Trash</a>
      </div>
      <div className="sidebar-section">
        <div className="label">Tags</div>
        <div className="row" style={{ flexWrap: 'wrap', gap: 8, padding: '0 8px' }}>
          <span className="chip" style={{ background: 'rgba(96,165,250,.18)', color: 'var(--text-normal)' }}>work</span>
          <span className="chip" style={{ background: 'rgba(52,211,153,.18)' }}>personal</span>
          <span className="chip" style={{ background: 'rgba(167,139,250,.18)' }}>ideas</span>
          <span className="chip" style={{ background: 'rgba(148,163,184,.18)' }}>misc</span>
        </div>
      </div>
    </aside>
  );
}

/* Notes List */
function NotesList({ filter = 'all' }) {
  const { notes, selectNote, selectedNoteId, createNote, toggleStar } = useNotes();

  const filtered = useMemo(() => {
    switch (filter) {
      case 'favorites': return notes.filter(n => n.starred);
      default: return notes;
    }
  }, [notes, filter]);

  return (
    <section className="list">
      <div className="list-header">
        <div className="list-title">{filter === 'favorites' ? 'Favorites' : 'All Notes'}</div>
        <div className="spacer" />
        <button className="btn btn-primary" onClick={createNote}><span className="row"><Icon name="plus" /> New</span></button>
      </div>
      <div className="list-body" role="list">
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <div style={{ width: 120, height: 120, margin: '0 auto', borderRadius: 16, background: 'var(--bg-active)' }} />
            <div style={{ fontWeight: 600, marginTop: 16, color: 'var(--text-strong)' }}>No notes yet</div>
            <div style={{ marginTop: 6 }}>Create your first note</div>
            <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={createNote}>New Note</button>
          </div>
        ) : filtered.map(n => (
          <div key={n.id} className={`note-item ${selectedNoteId === n.id ? 'selected' : ''}`} role="listitem" onClick={() => selectNote(n.id)}>
            <div className="row space-between">
              <div className="note-title">{n.title || 'Untitled'}</div>
              <button className="icon-btn" onClick={(e) => { e.stopPropagation(); toggleStar(n.id); }} aria-label="Toggle favorite">
                <span style={{ color: n.starred ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {n.starred ? <Icon name="star" /> : <Icon name="star-outline" />}
                </span>
              </button>
            </div>
            <div className="note-snippet">{(n.content || '').replace(/<[^>]+>/g, '').slice(0, 160) || 'No content yet'}</div>
            <div className="note-meta">
              <span>{n.updatedAt ? `Updated ${formatDistanceToNow(new Date(n.updatedAt))} ago` : ''}</span>
              <span className="chip">note</span>
              <span className="row" style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}><Icon name="kebab" /></span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* Editor Pane */
function EditorPane() {
  const { notes, selectedNoteId, updateNote, deleteNote } = useNotes();
  const selected = notes.find(n => n.id === selectedNoteId);

  const onTitle = (e) => selected && updateNote(selected.id, { title: e.target.value });
  const onContent = (e) => selected && updateNote(selected.id, { content: e.target.value });

  if (!selected) {
    return (
      <section className="editor">
        <div className="editor-toolbar row">
          <div className="row" style={{ color: 'var(--text-muted)' }}>Select a note to get started</div>
        </div>
        <div className="editor-scroll">
          <div className="editor-content" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Choose a note from the list or create a new one.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="editor">
      <div className="editor-toolbar row">
        <input className="editor-title" value={selected.title} placeholder="Untitled" onChange={onTitle} aria-label="Note title" />
        <div className="row" style={{ borderLeft: `1px solid var(--border-subtle)`, paddingLeft: 8, marginLeft: 8 }}>
          <button className="icon-btn" title="Bold"><b>B</b></button>
          <button className="icon-btn" title="Italic"><i>I</i></button>
          <button className="icon-btn" title="Underline"><u>U</u></button>
        </div>
        <div className="spacer" />
        <button className="btn btn-secondary" onClick={() => deleteNote(selected.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>Delete</button>
      </div>
      <div className="editor-scroll">
        <div className="editor-content">
          <textarea
            aria-label="Note editor"
            style={{
              width: '100%',
              minHeight: '60vh',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-normal)',
              fontSize: 16,
              lineHeight: 1.6,
              resize: 'vertical',
            }}
            placeholder="Start writing..."
            value={selected.content}
            onChange={onContent}
          />
        </div>
      </div>
    </section>
  );
}

/* Main Shell that follows the 3-column layout */
function Shell({ filter }) {
  const { createNote } = useNotes();
  return (
    <div className="app-root">
      <AppBar onNewNote={createNote} />
      <Sidebar />
      <NotesList filter={filter} />
      <EditorPane />
    </div>
  );
}

/* Router setup */
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/" element={<RequireAuth><Shell filter="all" /></RequireAuth>} />
      <Route path="/favorites" element={<RequireAuth><Shell filter="favorites" /></RequireAuth>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// PUBLIC_INTERFACE
function App() {
  /** Entry component creating providers and router per design. */
  return (
    <AuthProvider>
      <NotesProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </NotesProvider>
    </AuthProvider>
  );
}

export default App;
