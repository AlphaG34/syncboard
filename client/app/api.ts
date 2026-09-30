export type Status = "Todo" | "Doing" | "Done";

export type Task = {
  id: number;
  title: string;
  notes: string | null;
  status: Status;
  version: number;
  updatedAt: string;
};

export type TaskValues = { title: string; notes: string; status: Status };

// Empty in production (same origin). Set in client/.env.development for local work.
const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });
  if (res.status === 204) return undefined as T;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    let message = "Something went wrong.";
    if (res.status === 409) message = "Someone else changed this task first.";
    else if (res.status === 404) message = "This task no longer exists.";
    else if (res.status === 400 && data?.errors) {
      message = (Object.values(data.errors) as string[][]).flat().join(" ");
    }
    throw new ApiError(res.status, message);
  }
  return data as T;
}

const body = (v: TaskValues) => ({
  title: v.title,
  notes: v.notes.trim() || null,
  status: v.status,
});

export const getTasks = () => request<Task[]>("/api/tasks");

export const createTask = (v: TaskValues) =>
  request<Task>("/api/tasks", { method: "POST", body: JSON.stringify(body(v)) });

export const updateTask = (id: number, v: TaskValues, baseVersion: number) =>
  request<Task>(`/api/tasks/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...body(v), baseVersion }),
  });

export const deleteTask = (id: number) =>
  request<void>(`/api/tasks/${id}`, { method: "DELETE" });