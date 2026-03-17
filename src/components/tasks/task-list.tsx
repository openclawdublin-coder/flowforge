'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { updateTask } from '@/actions/tasks';
import { toast } from 'sonner';
import { Pencil, X } from 'lucide-react';

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueAt: Date | null;
  project: { id: string; name: string } | null;
  assignee: { id: string; name: string | null } | null;
};

type SelectOption = { id: string; name: string | null };

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const statuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'] as const;

const priorityColor: Record<string, string> = {
  URGENT: 'text-red-400',
  HIGH: 'text-orange-400',
  MEDIUM: 'text-yellow-400',
  LOW: 'text-green-400',
};

const statusLabel: Record<string, string> = {
  BACKLOG: 'Backlog',
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

function formatDate(date: Date | null) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (diffDays < 0) return { text: `${formatted} (overdue)`, overdue: true };
  if (diffDays === 0) return { text: `${formatted} (today)`, overdue: true };
  if (diffDays <= 3) return { text: `${formatted} (${diffDays}d)`, overdue: false };
  return { text: formatted, overdue: false };
}

function EditForm({
  task,
  projects,
  users,
  onClose,
}: {
  task: Task;
  projects: SelectOption[];
  users: SelectOption[];
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [projectId, setProjectId] = useState(task.project?.id ?? '');
  const [assigneeId, setAssigneeId] = useState(task.assignee?.id ?? '');

  function handleSave() {
    startTransition(async () => {
      try {
        await updateTask(task.id, {
          title,
          description: description || undefined,
          status: status as any,
          priority: priority as any,
          projectId: projectId || null,
          assigneeId: assigneeId || null,
        });
        toast.success('Task updated');
        onClose();
      } catch {
        toast.error('Failed to update task');
      }
    });
  }

  const selectClass =
    'h-10 w-full rounded-md border border-border bg-black/20 px-3 text-sm text-white appearance-none';

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-white/70">Edit Task</span>
        <button onClick={onClose} className="text-white/50 hover:text-white">
          <X size={16} />
        </button>
      </div>
      <div className="grid gap-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
        />
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={selectClass}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className={selectClass}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0) + p.slice(1).toLowerCase()}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className={selectClass}
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className={selectClass}
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name ?? 'Unknown'}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={pending || title.trim().length < 2}>
            {pending ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function TaskList({
  tasks,
  projects,
  users,
}: {
  tasks: Task[];
  projects: SelectOption[];
  users: SelectOption[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-white/50">
        <p className="text-lg">No active tasks</p>
        <p className="text-sm">All tasks are completed or none have been created yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Tasks</h1>
      <div className="grid gap-3">
        {tasks.map((task) => {
          if (editingId === task.id) {
            return (
              <EditForm
                key={task.id}
                task={task}
                projects={projects}
                users={users}
                onClose={() => setEditingId(null)}
              />
            );
          }

          const due = formatDate(task.dueAt);
          return (
            <Card key={task.id} className="flex items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{task.title}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/50">
                  <Badge>{statusLabel[task.status] ?? task.status}</Badge>
                  <span className={cn(priorityColor[task.priority])}>
                    {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                  </span>
                  {task.project && <span>{task.project.name}</span>}
                  {task.assignee && <span>{task.assignee.name}</span>}
                </div>
              </div>
              {due && (
                <span
                  className={cn(
                    'shrink-0 text-xs',
                    due.overdue ? 'text-red-400' : 'text-white/50'
                  )}
                >
                  {due.text}
                </span>
              )}
              <button
                onClick={() => setEditingId(task.id)}
                className="shrink-0 rounded-md p-2 text-white/40 hover:bg-white/10 hover:text-white"
                aria-label="Edit task"
              >
                <Pencil size={14} />
              </button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
