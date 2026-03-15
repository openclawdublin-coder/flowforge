'use client';

import { useMemo, useState, useTransition } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { bulkAssignQueueTasks, quickAddTask, reorderTask } from '@/actions/tasks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { queueQuickAddSchema } from '@/lib/validations/task';
import { z } from 'zod';

type QueueTask = { id: string; title: string; projectId: string | null; status: 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE'; order: number };
type LiteEntity = { id: string; name: string };

type Props = {
  initialTasks: QueueTask[];
  projects: LiteEntity[];
  users: LiteEntity[];
};

function SortableTask({ task, selected, onToggle }: { task: QueueTask; selected: boolean; onToggle: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className='rounded-md border border-white/10 bg-white/5 p-3'
      {...attributes}
      {...listeners}
    >
      <label className='flex items-start gap-2'>
        <input checked={selected} onChange={onToggle} type='checkbox' className='mt-1' />
        <span className='text-sm'>{task.title}</span>
      </label>
    </div>
  );
}

export function QueueBoard({ initialTasks, projects, users }: Props) {
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string>('');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const form = useForm<z.infer<typeof queueQuickAddSchema>>({
    resolver: zodResolver(queueQuickAddSchema),
    defaultValues: { title: '' },
  });

  const ids = useMemo(() => tasks.map((t) => t.id), [tasks]);

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      await quickAddTask(values.title);
      toast.success('Task added to queue');
      form.reset();
      window.location.reload();
    }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newTasks = arrayMove(tasks, oldIndex, newIndex).map((task, index) => ({ ...task, order: index + 1 }));
    setTasks(newTasks);

    const movedTask = newTasks[newIndex];
    startTransition(async () => {
      await reorderTask({ taskId: movedTask.id, toStatus: movedTask.status, toOrder: movedTask.order });
      toast.success('Queue order saved');
    });
  };

  const runBulkAssign = () =>
    startTransition(async () => {
      if (!selectedIds.length) {
        toast.error('Select at least one task');
        return;
      }
      await bulkAssignQueueTasks({
        taskIds: selectedIds,
        projectId: projectId || null,
        assigneeId: assigneeId || null,
      });
      toast.success('Bulk assignment saved');
      setSelectedIds([]);
      window.location.reload();
    });

  return (
    <div>
      <h1 className='mb-4 text-2xl font-semibold'>Queue</h1>
      <form onSubmit={onSubmit} className='mb-4 flex gap-2'>
        <Input {...form.register('title')} placeholder='Quick add task' />
        <Button type='submit' disabled={isPending}>{isPending ? '...' : 'Add'}</Button>
      </form>

      <div className='mb-4 glass rounded-xl p-4'>
        <h2 className='mb-2 text-sm font-medium text-white/80'>Bulk assign selected</h2>
        <div className='grid gap-2 md:grid-cols-3'>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className='h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm'>
            <option value=''>No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className='h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm'>
            <option value=''>No assignee</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
          <Button type='button' onClick={runBulkAssign} disabled={isPending}>Move / Assign</Button>
        </div>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className='space-y-2'>
            {tasks.map((task) => (
              <SortableTask
                key={task.id}
                task={task}
                selected={selectedIds.includes(task.id)}
                onToggle={() =>
                  setSelectedIds((prev) =>
                    prev.includes(task.id) ? prev.filter((id) => id !== task.id) : [...prev, task.id],
                  )
                }
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
