import { createFileRoute } from '@tanstack/react-router';
import { HomeView } from '@/builder/HomeView';
import { useHomeController } from '@/builder/useHomeController';

export const Route = createFileRoute('/builder')({
  component: BuilderPage,
});

function BuilderPage() {
  return <HomeView {...useHomeController()} />;
}
