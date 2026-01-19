import { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "job-tracker-items-v1";

const STATUS_OPTIONS = ["Applied", "Interview", "Offer", "Rejected"];

function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatDateInput(value) {
  // value from <input type="date"> is YYYY-MM-DD
  return value || "";
}

export default function App() {
  const [items, setItems] = useState(loadItems);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [date, setDate] = useState(formatDateInput(new Date().toISOString().slice(0, 10)));
  const [status, setStatus] = useState("Applied");

  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    saveItems(items);
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((it) => (filterStatus === "All" ? true : it.status === filterStatus))
      .filter((it) => {
        if (!q) return true;
        return (
          it.company.toLowerCase().includes(q) ||
          it.role.toLowerCase().includes(q) ||
          it.status.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [items, filterStatus, search]);

  const counts = useMemo(() => {
    const base = { All: items.length };
    STATUS_OPTIONS.forEach((s) => (base[s] = items.filter((i) => i.status === s).length));
    return base;
  }, [items]);

  function addItem(e) {
    e.preventDefault();
    const c = company.trim();
    const r = role.trim();
    if (!c || !r) return;

    setItems((prev) => [
      {
        id: crypto.randomUUID(),
        company: c,
        role: r,
        date,
        status,
        createdAt: Date.now(),
      },
      ...prev,
    ]);

    setCompany("");
    setRole("");
    setStatus("Applied");
  }

  function updateStatus(id, newStatus) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: newStatus } : it)));
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function clearAll() {
    if (!confirm("Clear all applications?")) return;
    setItems([]);
  }

  return (
    <div className="page">
      <div className="card">
        <header className="header">
          <div>
            <h1>Job Tracker</h1>
            <p className="muted">Track applications, statuses, and progress.</p>
          </div>
          <button className="ghost" onClick={clearAll} disabled={items.length === 0}>
            Clear all
          </button>
        </header>

        <form className="form" onSubmit={addItem}>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Company (e.g., Sky)"
          />
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            placeholder="Role (e.g., Junior Data Analyst)"
          />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit">Add</button>
        </form>

        <div className="controls">
          <input
            className="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company / role / status..."
          />

          <div className="chips">
            <button
              className={filterStatus === "All" ? "chip active" : "chip"}
              onClick={() => setFilterStatus("All")}
              type="button"
            >
              All ({counts.All})
            </button>
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                className={filterStatus === s ? "chip active" : "chip"}
                onClick={() => setFilterStatus(s)}
                type="button"
              >
                {s} ({counts[s]})
              </button>
            ))}
          </div>
        </div>

        <div className="list">
          {filtered.length === 0 ? (
            <p className="muted" style={{ marginTop: 10 }}>
              No applications yet. Add one above.
            </p>
          ) : (
            filtered.map((it) => (
              <div key={it.id} className="item">
                <div className="itemMain">
                  <div className="titleRow">
                    <div className="title">
                      {it.company} — <span className="role">{it.role}</span>
                    </div>
                    <div className="date">{it.date}</div>
                  </div>
                  <div className="meta">
                    <span className={"badge " + it.status.toLowerCase()}>{it.status}</span>
                  </div>
                </div>

                <div className="actions">
                  <select
                    value={it.status}
                    onChange={(e) => updateStatus(it.id, e.target.value)}
                    aria-label="Update status"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button className="danger" onClick={() => removeItem(it.id)}>
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

