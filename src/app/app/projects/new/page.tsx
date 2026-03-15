import { NewProjectForm } from '@/components/projects/new-project-form';

export default function NewProjectPage() {
  return (
    <div className='mx-auto max-w-xl rounded-xl glass p-6'>
      <h1 className='mb-4 text-xl font-semibold'>Create project</h1>
      <NewProjectForm />
    </div>
  );
}
