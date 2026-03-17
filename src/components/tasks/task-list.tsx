'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Priority, TaskStatus } from '@prisma/client';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { createTask, updateTask, deleteTask } from '@/actions/tasks';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { taskSchema } from '@/lib/validations/task';
import { cn } from '@/lib/utils';

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

type Option = { id: string; name: string | null };

type Props = {
  tasks: Task[];
  projects: Option[];
  users: Option[];
};

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

const selectClass = 'h-10 w-full rounded-md border border-white/10 bg-black/30 px-3';

type FormValues = z.infer<typeof taskSchema>;

function TaskForm({
  defaultValues,
  projects,
  users,
  onSubmit,
  isPending,
  submitLabel,
  onCancel,
}: {
  defaultValues: FormValues;
  projects: Option[];
  users: Option[];
  onSubmit: (values: FormValues) => void;
  isPending: boolean;
  submitLabel: string;
  onCancel?: () => void;
}) {
  const form = useForm<FormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues,
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
      <Input {...form.register('title')} placeholder="Task title" />
      <Input {...form.register('description')} placeholder="Description (optional)" />
      <div className="grid gap-2 sm:grid-cols-2">
        <select {...form.register('status')} className={selectClass}>
          {Object.values(TaskStatus).map((s) => (
            <option key={s} value={s}>{statusLabel[s] ?? s}</option>
          ))}
        </select>
        <select {...form.register('priority')} className={selectClass}>
          {Object.values(Priority).map((p) => (
            <option key={p} value={p}>{p.charAt(0) + p.slice(1).toLowerCase()}</option>
          ))}
        </select>
        <select {...form.register('projectId')} className={selectClass}>
          <option value="">No project</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select {...form.register('assigneeId')} className={selectClass}>
          <option value="">Unassigned</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name ?? u.id}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button disabled={isPending} className="flex-1">{submitLabel}</Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  );
}

export function TaskList({ tasks, projects, users }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = (values: FormValues) => {
    startTransition(async () => {
      await createTask({
        ...values,
        projectId: values.projectId || null,
        assigneeId: values.assigneeId || null,
      });
      toast.success('Task created');
      setShowCreate(false);
    });
  };

  const handleUpdate = (taskId: string) => (values: FormValues) => {
    startTransition(async () => {
      await updateTask(taskId, {
        ...values,
        projectId: values.projectId || null,
        assigneeId: values.assigneeId || null,
      });
      toast.success('Task updated');
      setEditingId(null);
    });
  };

  const handleDelete = (taskId: string, title: string) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    startTransition(async () => {
      await deleteTask(taskId);
      toast.success('Task deleted');
    });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'New task'}
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-4 p-4">
          <h2 className="mb-3 font-medium">Create task</h2>
          <TaskForm
            defaultValues={{
              title: '',
              description: '',
              priority: Priority.MEDIUM,
              status: TaskStatus.TODO,
              projectId: null,
              assigneeId: null,
            }}
            projects={projects}
            users={users}
            onSubmit={handleCreate}
            isPending={isPending}
            submitLabel="Create task"
            onCancel={() => setShowCreate(false)}
          />
        </Card>
      )}

      {tasks.length === 0 && !showCreate && (
        <div className="flex flex-col items-center justify-center py-20 text-white/50">
          <p className="text-lg">No active tasks</p>
          <p className="text-sm">All tasks are completed or none have been created yet.</p>
        </div>
      )}

      <div className="grid gap-3">
        {tasks.map((task) => {
          const due = formatDate(task.dueAt);
          const isEditing = editingId === task.id;

          if (isEditing) {
            return (
              <Card key={task.id} className="p-4">
                <h3 className="mb-3 font-medium">Edit task</h3>
                <TaskForm
                  defaultValues={{
                    title: task.title,
                    description: task.description ?? '',
                    priority: task.priority as Priority,
                    status: task.status as TaskStatus,
                    projectId: task.project?.id ?? null,
                    assigneeId: task.assignee?.id ?? null,
                  }}
                  projects={projects}
                  users={users}
                  onSubmit={handleUpdate(task.id)}
                  isPending={isPending}
                  submitLabel="Save"
                  onCancel={() => setEditingId(null)}
                />
              </Card>
            );
          }

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
              <div className="flex shrink-0 gap-1">
                <Button variant="outline" className="h-8 text-xs" onClick={() => setEditingId(task.id)}>
                  Edit
                </Button>
                <Button variant="outline" className="h-8 text-xs text-red-400" onClick={() => handleDelete(task.id, task.title)}>
                  Delete
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
