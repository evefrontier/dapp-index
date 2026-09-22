import { createFileRoute } from '@tanstack/react-router';
import {
  DappDetailNotFound,
  DappDetailView,
} from '@/components/directory/DappDetailView';
import { fetchDappBySlug } from '@/api/catalog';

export const Route = createFileRoute('/dapps/$slug')({
  loader: ({ params }) => fetchDappBySlug(params.slug),
  component: DappDetailPage,
});

function DappDetailPage() {
  const entry = Route.useLoaderData();

  if (!entry) {
    return <DappDetailNotFound />;
  }

  return <DappDetailView entry={entry} />;
}
