export const dynamic = 'force-dynamic';

import { getRecycledItems, purgeExpiredItems } from '@/actions/recycle';
import { RecycleBin } from '@/components/recycle/recycle-bin';

export default async function RecyclePage() {
  await purgeExpiredItems();
  const { tasks, projects } = await getRecycledItems();

  return <RecycleBin tasks={tasks} projects={projects} />;
}
