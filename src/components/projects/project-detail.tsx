'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Priority, ProjectStatus, TaskStatus } from '@prisma/client';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { addTaskComment, createTask } from '@/actions/tasks';
import { createKanbanColumn, updateProject, deleteProject } from '@/actions/projects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { projectSchema, columnSchema } from '@/lib/validations/project';
import { taskSchema } from '@/lib/validations/task';
import { z } from 'zod';

type ThreadComment = {
  id: string;
  content: string;
  parentId: string | null;
  author: { name: string | null; email: string | null };
  createdAt: string;
};

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  comments: ThreadComment[];
  activities: { id: string; action: string; meta: unknown; createdAt: string }[];
};

type Props = {
  project: {
    id: string;
    name: string;
    key: string;
    description: string | null;
    status: ProjectStatus;
    priority: Priority;
    color: string;
    tasks: TaskItem[];
  };
};

export function ProjectDetail({ project }: Props) {
  const [isPending, startTransition] = useTransition();

  const projectForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: project.name,
      key: project.key,
      description: project.description ?? '',
      color: project.color,
      status: project.status,
      priority: project.priority,
    },
  });

  const taskForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: Priority.MEDIUM,
      status: TaskStatus.TODO,
      projectId: project.id,
      assigneeId: null,
      dueAt: null,
    },
  });

  const columnForm = useForm<z.infer<typeof columnSchema>>({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      projectId: project.id,
      name: '',
      status: TaskStatus.TODO,
    },
  });

  const saveProject = projectForm.handleSubmit((values) =>
    startTransition(async () => {
      await updateProject(project.id, values);
      toast.success('Project updated');
      window.location.reload();
    }),
  );

  const addTask = taskForm.handleSubmit((values) =>
    startTransition(async () => {
      await createTask(values);
      toast.success('Task created');
      taskForm.reset({ ...taskForm.getValues(), title: '', description: '' });
      window.location.reload();
    }),
  );

  const addColumn = columnForm.handleSubmit((values) =>
    startTransition(async () => {
      await createKanbanColumn(values);
      toast.success('Column added');
      columnForm.reset({ ...columnForm.getValues(), name: '' });
    }),
  );

  return (
    <div>
      <h1 className='mb-4 text-2xl font-semibold'>{project.name}</h1>

      <Card className='glass mb-4 p-4'>
        <h2 className='mb-3 font-medium'>Edit project</h2>
        <form onSubmit={saveProject} className='grid gap-2 md:grid-cols-2'>
          <Input {...projectForm.register('name')} placeholder='Name' />
          <Input {...projectForm.register('key')} placeholder='Key' />
          <Input {...projectForm.register('description')} placeholder='Description' className='md:col-span-2' />
          <Input type='color' {...projectForm.register('color')} />
          <select {...projectForm.register('status')} className='h-10 rounded-md border border-white/10 bg-black/30 px-3'>
            {Object.values(ProjectStatus).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select {...projectForm.register('priority')} className='h-10 rounded-md border border-white/10 bg-black/30 px-3'>
            {Object.values(Priority).map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className='flex gap-2 md:col-span-2'>
            <Button disabled={isPending} className='flex-1'>Save project</Button>
            <Button
              type='button'
              variant='outline'
              className='text-red-400'
              disabled={isPending}
              onClick={() => {
                if (!window.confirm(`Delete project "${project.name}" and all its tasks? Items will be moved to the recycle bin.`)) return;
                startTransition(async () => {
                  await deleteProject(project.id);
                  toast.success('Project moved to recycle bin');
                  window.location.href = '/app/projects';
                });
              }}
            >
              Delete project
            </Button>
          </div>
        </form>
      </Card>

      <div className='mb-4 grid gap-4 md:grid-cols-2'>
        <Card className='glass p-4'>
          <h3 className='mb-2 font-medium'>Quick add task</h3>
          <form onSubmit={addTask} className='space-y-2'>
            <Input {...taskForm.register('title')} placeholder='Task title' />
            <Input {...taskForm.register('description')} placeholder='Description' />
            <select {...taskForm.register('status')} className='h-10 w-full rounded-md border border-white/10 bg-black/30 px-3'>
              {Object.values(TaskStatus).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select {...taskForm.register('priority')} className='h-10 w-full rounded-md border border-white/10 bg-black/30 px-3'>
              {Object.values(Priority).map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <Button disabled={isPending} className='w-full'>Create task</Button>
          </form>
        </Card>

        <Card className='glass p-4'>
          <h3 className='mb-2 font-medium'>Quick add column</h3>
          <form onSubmit={addColumn} className='space-y-2'>
            <Input {...columnForm.register('name')} placeholder='Column name' />
            <select {...columnForm.register('status')} className='h-10 w-full rounded-md border border-white/10 bg-black/30 px-3'>
              {Object.values(TaskStatus).map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Button disabled={isPending} className='w-full'>Add column</Button>
          </form>
        </Card>
      </div>

      <div className='grid gap-3'>
        {project.tasks.map((task) => {
          const roots = task.comments.filter((c) => !c.parentId);
          return (
            <Card key={task.id} className='glass p-4'>
              <h3 className='font-medium'>{task.title}</h3>
              <p className='text-sm text-white/70'>{task.description}</p>
              <p className='mt-2 text-xs'>{task.status} · {task.priority}</p>

              <div className='mt-3 space-y-2'>
                <p className='text-xs uppercase text-white/50'>Threaded comments</p>
                {roots.map((comment) => {
                  const replies = task.comments.filter((c) => c.parentId === comment.id);
                  return (
                    <div key={comment.id} className='rounded border border-white/10 bg-black/20 p-2 text-sm'>
                      <p className='text-white/90'>{comment.content}</p>
                      <p className='text-xs text-white/50'>by {comment.author.name ?? comment.author.email ?? 'Unknown'}</p>
                      {replies.length > 0 && (
                        <div className='mt-2 space-y-1 border-l border-white/10 pl-3'>
                          {replies.map((reply) => (
                            <p key={reply.id} className='text-xs text-white/70'>↳ {reply.content}</p>
                          ))}
                        </div>
                      )}
                      <Button
                        variant='outline'
                        className='mt-2 h-7 text-xs'
                        onClick={() =>
                          startTransition(async () => {
                            await addTaskComment({ taskId: task.id, parentId: comment.id, content: '@owner Thanks, noted.' });
                            toast.success('Reply added');
                            window.location.reload();
                          })
                        }
                      >
                        Quick reply
                      </Button>
                    </div>
                  );
                })}
              </div>

              <div className='mt-3 space-y-1'>
                <p className='text-xs uppercase text-white/50'>Activity</p>
                {task.activities.slice(0, 4).map((a) => (
                  <p key={a.id} className='text-xs text-white/70'>• {a.action} {a.meta ? `— ${JSON.stringify(a.meta)}` : ''}</p>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
