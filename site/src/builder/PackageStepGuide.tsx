import { useRef } from 'react';

export function PackageStepGuide() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="builder-text-button"
        onClick={() => {
          dialogRef.current?.showModal();
        }}
      >
        Package guide
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="builder-package-guide-title"
        className="builder-info-dialog"
        onClick={(event) => {
          const panel = event.currentTarget.querySelector(
            '.builder-info-dialog-panel',
          );
          if (panel && !panel.contains(event.target as Node)) {
            dialogRef.current?.close();
          }
        }}
      >
        <div className="builder-info-dialog-panel">
          <div className="space-y-4 text-sm text-(--color-neutral-60)">
            <h3
              className="text-base font-bold uppercase text-(--color-neutral)"
              id="builder-package-guide-title"
            >
              Sui packages
            </h3>
            <p className="text-(--color-neutral)">
              Start with package identity (network, role, package ID). Expand
              Move Registry (MVR) on a package when you have MVR names or
              PackageInfo IDs.
            </p>
            <p className="text-xs">
              Use Check MVR match at the bottom to compare MVR names against
              package IDs. You can skip this while drafting; it is useful before
              publish. MVR name and PackageInfo ID are required in published
              metadata.
            </p>
            <ul className="grid gap-2 text-xs">
              <li>
                <span className="font-bold uppercase text-(--color-neutral)">
                  List
                </span>{' '}
                your primary app package (core), packages the dapp calls in
                transactions, and key trust surfaces such as exchange, custody,
                escrow, or settlement.
              </li>
              <li>
                <span className="font-bold uppercase text-(--color-neutral)">
                  Skip
                </span>{' '}
                internal implementation-only dependencies that users do not need
                to review.
              </li>
            </ul>
            <p className="text-xs">
              Need MVR names or PackageInfo IDs?{' '}
              <a
                className="text-(--color-martian-red) underline"
                href="https://docs.suins.io/move-registry"
                target="_blank"
                rel="noreferrer"
              >
                Move Registry docs
              </a>{' '}
              ·{' '}
              <a
                className="text-(--color-martian-red) underline"
                href="https://www.moveregistry.com/"
                target="_blank"
                rel="noreferrer"
              >
                MVR portal
              </a>
            </p>
          </div>
          <form className="mt-4 flex justify-end" method="dialog">
            <button type="submit" className="builder-info-dialog-close">
              Close
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
}
