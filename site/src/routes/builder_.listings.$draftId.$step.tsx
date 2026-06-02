import { createFileRoute } from '@tanstack/react-router';
import {
  BuilderWizardMessage,
  BuilderWizardShell,
} from '@/builder/BuilderWizardShell';
import { useBuilderListingStepController } from '@/builder/useBuilderListingStepController';

export const Route = createFileRoute('/builder_/listings/$draftId/$step')({
  component: BuilderListingStepPage,
});

function BuilderListingStepPage() {
  const controller = useBuilderListingStepController(Route.useParams());

  if (controller.kind === 'message') {
    return (
      <BuilderWizardMessage
        title={controller.title}
        body={controller.body}
      />
    );
  }

  return <BuilderWizardShell {...controller.shellProps} />;
}
