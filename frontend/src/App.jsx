// src/App.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = "http://localhost:5000/api";

function App() {
  // Auth state
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : null
  );

  // Notes state
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form for notes
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // When token changes, set axios default + fetch notes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchNotes();
    }
  }, [token]);

  // Fetch notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await axios.get(`${API_BASE}/notes`);
      setNotes(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load notes");
    } finally {
      setLoading(false);
    }
  };

  // Handle register / login
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (authMode === "register") {
        const res = await axios.post(`${API_BASE}/auth/register`, {
          name,
          email,
          password,
        });
        handleAuthSuccess(res.data);
      } else {
        const res = await axios.post(`${API_BASE}/auth/login`, {
          email,
          password,
        });
        handleAuthSuccess(res.data);
      }
    } catch (err) {
      console.error(err);
      const msg =
        err.response?.data?.message || "Failed to authenticate. Try again.";
      setError(msg);
    }
  };

  const handleAuthSuccess = (data) => {
    const { token, user } = data;
    setToken(token);
    setCurrentUser(user);

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    // Clear auth form
    setName("");
    setEmail("");
    setPassword("");

    fetchNotes();
  };

  const handleLogout = () => {
    setToken("");
    setCurrentUser(null);
    setNotes([]);
    setTitle("");
    setContent("");
    setEditingNoteId(null);
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  // Create / update note
  const handleNoteSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      alert("Please enter both title and content");
      return;
    }

    try {
      setError("");

      if (editingNoteId) {
        await axios.put(`${API_BASE}/notes/${editingNoteId}`, {
          title,
          content,
        });
      } else {
        await axios.post(`${API_BASE}/notes`, {
          title,
          content,
        });
      }

      setTitle("");
      setContent("");
      setEditingNoteId(null);

      fetchNotes();
    } catch (err) {
      console.error(err);
      setError("Failed to save note");
    }
  };

  const handleDelete = async (id) => {
    const ok = confirm("Are you sure you want to delete this note?");
    if (!ok) return;

    try {
      setError("");
      await axios.delete(`${API_BASE}/notes/${id}`);
      setNotes((prev) => prev.filter((note) => note._id !== id));
    } catch (err) {
      console.error(err);
      setError("Failed to delete note");
    }
  };

  const handleEdit = (note) => {
    setEditingNoteId(note._id);
    setTitle(note.title);
    setContent(note.content);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setTitle("");
    setContent("");
  };

  const filteredNotes = notes.filter((note) => {
    const text = (note.title + " " + note.content).toLowerCase();
    return text.includes(searchTerm.toLowerCase());
  });

  // =======================
  //  NOT LOGGED IN → AUTH UI
  // =======================
  if (!token) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card">
          <h1 className="app-title">Notes App</h1>
          <p className="app-subtitle">
            {authMode === "login"
              ? "Login to see and manage your notes."
              : "Create an account to start saving notes."}
          </p>

          {error && <p className="error-text">{error}</p>}

          <form onSubmit={handleAuthSubmit} className="form">
            {authMode === "register" && (
              <div className="form-group">
                <label className="form-label">
                  Name
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input"
                    placeholder="Your name"
                  />
                </label>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="you@example.com"
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Password
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  placeholder="Password"
                />
              </label>
            </div>

            <button type="submit" className="btn btn-primary">
              {authMode === "login" ? "Login" : "Register"}
            </button>
          </form>

          <p className="auth-toggle">
            {authMode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={() =>
                setAuthMode((prev) => (prev === "login" ? "register" : "login"))
              }
              className="link-button"
            >
              {authMode === "login" ? "Register here" : "Login here"}
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ==================
  //  LOGGED IN → APP UI
  // ==================
  return (
    <div className="app-container">
      <header className="app-header">
        <div>
          <h1 className="app-title">Notes App</h1>
          <p className="app-subtitle">
            Simple personal notes with login & CRUD.
          </p>
        </div>
        <div className="user-info">
          <span className="user-name">
            {currentUser?.name || currentUser?.email}
          </span>
          <button onClick={handleLogout} className="btn btn-outline">
            Logout
          </button>
        </div>
      </header>

      <main>
        {error && <p className="error-text">{error}</p>}

        {/* Note form */}
        <section className="card">
          <h2 className="section-title">
            {editingNoteId ? "Edit Note" : "Add a Note"}
          </h2>

          <form onSubmit={handleNoteSubmit} className="form">
            <div className="form-group">
              <label className="form-label">
                Title
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input"
                  placeholder="Note title"
                />
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">
                Content
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="textarea"
                  placeholder="Write your note here..."
                />
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {editingNoteId ? "Update Note" : "Add Note"}
              </button>
              {editingNoteId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Search */}
        <section className="search-section">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notes..."
            className="search-input"
          />
        </section>

        {/* Notes list */}
        <section>
          <h2 className="section-title">Your Notes</h2>

          {loading && <p className="muted-text">Loading notes...</p>}
          {!loading && filteredNotes.length === 0 && (
            <p className="muted-text">No notes yet. Add your first note above.</p>
          )}

          <div className="notes-list">
            {filteredNotes.map((note) => (
              <article key={note._id} className="note-card">
                <h3 className="note-title">{note.title}</h3>
                <p className="note-content">{note.content}</p>
                <p className="note-meta">
                  {note.createdAt &&
                    new Date(note.createdAt).toLocaleString()}
                </p>
                <div className="note-actions">
                  <button
                    onClick={() => handleEdit(note)}
                    className="btn btn-ghost"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="btn btn-danger"
                  >
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
