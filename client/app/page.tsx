"use client";

import { HubConnectionBuilder } from "@microsoft/signalr";
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { API, ApiError, createTask, deleteTask, getTasks, updateTask } from "./api";
import type { Status, Task, TaskValues } from "./api";

const COLUMNS: { status: Status; label: string }[] = [
  { status: "Todo", label: "To do" },
  { status: "Doing", label: "Doing" },
  { status: "Done", label: "Done" },
];

const LOAD_ERROR = "Could not load the tasks. Please try again.";

function TaskForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial: TaskValues;
  submitLabel: string;
  onSubmit: (values: TaskValues) => Promise<void>;
  onCancel?: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const title = values.title.trim();
  const titleError =
    title === "" ? "Title is required." : title.length > 120 ? "Title must be 120 characters or fewer." : "";

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (titleError) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(values);
      if (!onCancel) {
        setValues(initial);
        setTouched(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <label>
        Title
        <input
          value={values.title}
          onChange={(e) => {
            setTouched(true);
            setValues({ ...values, title: e.target.value });
          }}
          placeholder="What needs doing?"
          aria-invalid={touched && !!titleError}
        />
      </label>
      {touched && titleError && (
        <p className="field-error" role="alert">
          {titleError}
        </p>
      )}
      <label>
        Notes (optional)
        <textarea
          value={values.notes}
          onChange={(e) => setValues({ ...values, notes: e.target.value })}
          rows={2}
        />
      </label>
      <label>
        Status
        <select
          value={values.status}
          onChange={(e) => setValues({ ...values, status: e.target.value as Status })}
        >
          {COLUMNS.map((c) => (
            <option key={c.status} value={c.status}>
              {c.label}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button type="submit" className="primary" disabled={busy || !!titleError}>
          {busy ? "Saving…" : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function TaskCard({
  task,
  onMove,
  onSave,
  onDelete,
}: {
  task: Task;
  onMove: (task: Task, status: Status) => void;
  onSave: (task: Task, values: TaskValues) => Promise<void>;
  onDelete: (task: Task) => void;
}) {
  const [editing, setEditing] = useState(false);
  const index = COLUMNS.findIndex((c) => c.status === task.status);
  const prev = COLUMNS[index - 1];
  const next = COLUMNS[index + 1];

  if (editing) {
    return (
      <li className="card">
        <TaskForm
          initial={{ title: task.title, notes: task.notes ?? "", status: task.status }}
          submitLabel="Save"
          onSubmit={async (values) => {
            await onSave(task, values);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="card">
      <h3>{task.title}</h3>
      {task.notes && <p>{task.notes}</p>}
      <div className="actions">
        {prev && (
          <button onClick={() => onMove(task, prev.status)} aria-label={`Move "${task.title}" to ${prev.label}`}>
            ← {prev.label}
          </button>
        )}
        {next && (
          <button onClick={() => onMove(task, next.status)} aria-label={`Move "${task.title}" to ${next.label}`}>
            {next.label} →
          </button>
        )}
        <button onClick={() => setEditing(true)}>Edit</button>
        <button className="danger" onClick={() => onDelete(task)}>
          Delete
        </button>
      </div>
    </li>
  );
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  useEffect(() => {
    getTasks()
      .then(setTasks)
      .catch(() => setError(LOAD_ERROR))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
  const connection = new HubConnectionBuilder()
    .withUrl(`${API}/hub`)
    .withAutomaticReconnect()
    .build();

  const upsert = (task: Task) =>
    setTasks((current) =>
      current.some((t) => t.id === task.id)
        ? current.map((t) => (t.id === task.id ? task : t))
        : [...current, task],
    );

  connection.on("taskCreated", upsert);
  connection.on("taskUpdated", upsert);
  connection.on("taskDeleted", (id: number) =>
    setTasks((current) => current.filter((t) => t.id !== id)),
  );

  // After a dropped connection, reload in case messages were missed
  connection.onreconnected(() => {
    getTasks().then(setTasks).catch(() => {});
  });

  connection.start().catch(() => {});
  return () => {
    connection.stop();
  };
}, []);

  async function reload() {
    try {
      setTasks(await getTasks());
      setError("");
    } catch {
      setError(LOAD_ERROR);
    }
  }

  function retry() {
    setLoading(true);
    reload().finally(() => setLoading(false));
  }

  async function handleCreate(values: TaskValues) {
  const created = await createTask(values);
  setTasks((current) =>
    current.some((t) => t.id === created.id) ? current : [...current, created],
  );
}

  async function handleSave(task: Task, values: TaskValues) {
    try {
      const updated = await updateTask(task.id, values, task.version);
      setTasks((current) => current.map((t) => (t.id === updated.id ? updated : t)));
      setBanner("");
    } catch (err) {
      if (err instanceof ApiError && (err.status === 409 || err.status === 404)) {
        await reload();
        setBanner(`${err.message} The board was refreshed.`);
        return;
      }
      throw err;
    }
  }

  function handleMove(task: Task, status: Status) {
    handleSave(task, { title: task.title, notes: task.notes ?? "", status }).catch((err) =>
      setBanner(err instanceof Error ? err.message : "Could not move the task."),
    );
  }

  async function handleDelete(task: Task) {
    if (!window.confirm(`Delete "${task.title}"?`)) return;
    try {
      await deleteTask(task.id);
      setTasks((current) => current.filter((t) => t.id !== task.id));
    } catch (err) {
      setBanner(err instanceof Error ? err.message : "Could not delete the task.");
    }
  }

  return (
    <main className="page">
      <h1>SyncBoard</h1>
      <p className="subtitle">A shared task board.</p>

      <section className="panel" aria-labelledby="new-task">
        <h2 id="new-task">New task</h2>
        <TaskForm
          initial={{ title: "", notes: "", status: "Todo" }}
          submitLabel="Add task"
          onSubmit={handleCreate}
        />
      </section>

      {banner && (
        <p className="banner" role="alert">
          {banner}
        </p>
      )}

      {loading && <p className="state">Loading tasks…</p>}

      {!loading && error && (
        <div className="state error">
          <p>{error}</p>
          <button onClick={retry}>Try again</button>
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <p className="state">No tasks yet. Add your first one above.</p>
      )}

      {!loading && !error && tasks.length > 0 && (
        <div className="board">
          {COLUMNS.map((col) => {
            const items = tasks.filter((t) => t.status === col.status);
            return (
              <section className="column" key={col.status} aria-labelledby={`col-${col.status}`}>
                <h2 id={`col-${col.status}`}>
                  {col.label} <span className="count">{items.length}</span>
                </h2>
                {items.length === 0 ? (
                  <p className="empty">Nothing here yet.</p>
                ) : (
                  <ul>
                    {items.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onMove={handleMove}
                        onSave={handleSave}
                        onDelete={handleDelete}
                      />
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}