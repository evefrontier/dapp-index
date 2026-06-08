import { createFileRoute } from '@tanstack/react-router';
import {
  WizardMessage,
  WizardShell,
} from '@/builder/WizardShell';
import { useListingStepController } from '@/builder/useListingStepController';

export const Route = createFileRoute('/builder_/listings/$draftId/$step')({
  component: BuilderListingStepPage,
});

function BuilderListingStepPage() {
  const controller = useListingStepController(Route.useParams());

  if (controller.kind === 'message') {
    return (
      <WizardMessage
        title={controller.title}
        body={controller.body}
      />
    );
  }

  return <WizardShell {...controller.shellProps} />;
}
