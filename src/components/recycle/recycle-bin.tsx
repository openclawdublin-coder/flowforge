'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  restoreTask,
  restoreProject,
  permanentDeleteTask,
  permanentDeleteProject,
  emptyRecycleBin,
} from '@/actions/recycle';

type RecycledTask = {
  id: string;
  title: string;
  status: string;
  priority: string;
  deletedAt: Date | null;
  project: { id: string; name: string } | null;
};

type RecycledProject = {
  id: string;
  name: string;
  key: string;
  status: string;
  deletedAt: Date | null;
  _count: { tasks: number };
};

type Props = {
  tasks: RecycledTask[];
  projects: RecycledProject[];
};

type Filter = 'all' | 'tasks' | 'projects';

function daysRemaining(deletedAt: Date | null) {
  if (!deletedAt) return 0;
  const d = new Date(deletedAt);
  const expiry = new Date(d.getTime() + 30 * 24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function formatDeletedDate(deletedAt: Date | null) {
  if (!deletedAt) return '';
  return new Date(deletedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function RecycleBin({ tasks, projects }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [isPending, startTransition] = useTransition();

  const handleRestoreTask = (taskId: string) => {
    startTransition(async () => {
      await restoreTask(taskId);
      toast.success('Task restored');
    });
  };

  const handleRestoreProject = (projectId: string) => {
    startTransition(async () => {
      await restoreProject(projectId);
      toast.success('Project and its tasks restored');
    });
  };

  const handlePermanentDeleteTask = (taskId: string, title: string) => {
    if (!window.confirm(`Permanently delete "${title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await permanentDeleteTask(taskId);
      toast.success('Task permanently deleted');
    });
  };

  const handlePermanentDeleteProject = (projectId: string, name: string) => {
    if (!window.confirm(`Permanently delete project "${name}" and all its tasks? This cannot be undone.`)) return;
    startTransition(async () => {
      await permanentDeleteProject(projectId);
      toast.success('Project permanently deleted');
    });
  };

  const handleEmptyBin = () => {
    if (!window.confirm('Permanently delete all items in the recycle bin? This cannot be undone.')) return;
    startTransition(async () => {
      await emptyRecycleBin();
      toast.success('Recycle bin emptied');
    });
  };

  const showTasks = filter === 'all' || filter === 'tasks';
  const showProjects = filter === 'all' || filter === 'projects';
  const totalItems = tasks.length + projects.length;

  const filters: { key: Filter; label: string }[] = [
    { key: 'all', label: `All (${totalItems})` },
    { key: 'tasks', label: `Tasks (${tasks.length})` },
    { key: 'projects', label: `Projects (${projects.length})` },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recycle ♻️</h1>
        {totalItems > 0 && (
          <Button variant="outline" className="text-red-400" onClick={handleEmptyBin} disabled={isPending}>
            Empty recycle bin
          </Button>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              filter === f.key ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {totalItems === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-white/50">
          <p className="text-lg">Recycle bin is empty</p>
          <p className="text-sm">Deleted items will appear here for 30 days before being permanently removed.</p>
        </div>
      )}

      <div className="grid gap-3">
        {showProjects &&
          projects.map((project) => {
            const days = daysRemaining(project.deletedAt);
            return (
              <Card key={`project-${project.id}`} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{project.name}</p>
                    <Badge>{project.key}</Badge>
                    <span className="rounded-full bg-blue-500/20 px-2 py-1 text-xs text-blue-400">Project</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                    <span>Deleted {formatDeletedDate(project.deletedAt)}</span>
                    <span>·</span>
                    <span>{days} days remaining</span>
                    {project._count.tasks > 0 && (
                      <>
                        <span>·</span>
                        <span>{project._count.tasks} tasks included</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleRestoreProject(project.id)}
                    disabled={isPending}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 text-xs text-red-400"
                    onClick={() => handlePermanentDeleteProject(project.id, project.name)}
                    disabled={isPending}
                  >
                    Delete forever
                  </Button>
                </div>
              </Card>
            );
          })}

        {showTasks &&
          tasks.map((task) => {
            const days = daysRemaining(task.deletedAt);
            return (
              <Card key={`task-${task.id}`} className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{task.title}</p>
                    <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-400">Task</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-white/50">
                    <span>Deleted {formatDeletedDate(task.deletedAt)}</span>
                    <span>·</span>
                    <span>{days} days remaining</span>
                    {task.project && (
                      <>
                        <span>·</span>
                        <span>{task.project.name}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => handleRestoreTask(task.id)}
                    disabled={isPending}
                  >
                    Restore
                  </Button>
                  <Button
                    variant="outline"
                    className="h-8 text-xs text-red-400"
                    onClick={() => handlePermanentDeleteTask(task.id, task.title)}
                    disabled={isPending}
                  >
                    Delete forever
                  </Button>
                </div>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
