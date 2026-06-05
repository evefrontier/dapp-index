import { createFileRoute } from '@tanstack/react-router';
import { BuilderHomeView } from '@/builder/BuilderHomeView';
import { useBuilderHomeController } from '@/builder/useBuilderHomeController';

export const Route = createFileRoute('/builder')({
  component: BuilderPage,
});

function BuilderPage() {
  return <BuilderHomeView {...useBuilderHomeController()} />;
}
