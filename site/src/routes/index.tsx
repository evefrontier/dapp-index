import { createFileRoute } from '@tanstack/react-router';
import { DappDirectoryPage } from '@/components/DappDirectoryPage';

export const Route = createFileRoute('/')({
  component: DappDirectoryPage,
});
