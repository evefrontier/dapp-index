import { Button } from '@evefrontier/ui';
import { getPublishNextBlockerMessage } from './registrationDraftPublish';
import type { PublishStepControllerState } from './publishStepPresentation';

export type PublishStepFooterProps = {
  publishStep: PublishStepControllerState;
};

export function PublishStepFooter({ publishStep }: PublishStepFooterProps) {
  const {
    publishReadiness,
    publishState,
    walletAddress,
    onConnectWallet,
    onPublish,
  } = publishStep;
  const isPublishing = publishState.status === 'publishing';
  const publishBlocker = getPublishNextBlockerMessage(publishReadiness, {
    isPublishing,
  });

  return (
    <div className="space-y-3">
      {publishBlocker ? (
        <p className="builder-wizard-next-blocker text-end" role="status">
          {publishBlocker}
        </p>
      ) : null}
      <div className="flex flex-wrap justify-end gap-3">
        {!walletAddress ? (
          <Button
            disabled={isPublishing}
            size="small"
            type="button"
            variant="primary"
            onClick={onConnectWallet}
          >
            Connect wallet
          </Button>
        ) : (
          <Button
            disabled={isPublishing || !publishReadiness.ready}
            size="small"
            type="button"
            variant="primary"
            onClick={() => {
              void onPublish();
            }}
          >
            {isPublishing ? 'Publishing' : 'Publish listing'}
          </Button>
        )}
      </div>
    </div>
  );
}
