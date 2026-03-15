'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt: Date | null;
  project: { id: string; name: string } | null;
  assignee: { id: string; name: string | null } | null;
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

export function TaskList({ tasks }: { tasks: Task[] }) {
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
            </Card>
          );
        })}
      </div>
    </div>
  );
}
