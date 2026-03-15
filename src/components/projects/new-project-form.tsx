'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Priority, ProjectStatus } from '@prisma/client';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createProject } from '@/actions/projects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { projectSchema } from '@/lib/validations/project';
import { z } from 'zod';

export function NewProjectForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
      color: '#22c55e',
      status: ProjectStatus.PLANNING,
      priority: Priority.MEDIUM,
    },
  });

  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) =>
    startTransition(async () => {
      try {
        const res = await createProject(values);
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success('Project created');
        window.location.href = '/app/projects';
      } catch {
        toast.error('Failed to create project');
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} className='space-y-3'>
      <div>
        <Input {...form.register('name')} placeholder='Project name' />
        {errors.name && <p className='text-sm text-red-400 mt-1'>{errors.name.message}</p>}
      </div>
      <div>
        <Input {...form.register('key')} placeholder='Key (e.g FLW)' />
        {errors.key && <p className='text-sm text-red-400 mt-1'>{errors.key.message}</p>}
      </div>
      <div>
        <Input {...form.register('description')} placeholder='Description' />
        {errors.description && <p className='text-sm text-red-400 mt-1'>{errors.description.message}</p>}
      </div>
      <Input type='color' {...form.register('color')} />
      <select {...form.register('status')} className='h-10 w-full rounded-md border border-white/10 bg-black/30 px-3'>
        {Object.values(ProjectStatus).map((status) => <option key={status} value={status}>{status}</option>)}
      </select>
      <select {...form.register('priority')} className='h-10 w-full rounded-md border border-white/10 bg-black/30 px-3'>
        {Object.values(Priority).map((priority) => <option key={priority} value={priority}>{priority}</option>)}
      </select>
      <Button type='submit' disabled={isPending}>{isPending ? 'Creating...' : 'Create'}</Button>
    </form>
  );
}
