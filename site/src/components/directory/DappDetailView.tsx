import { Button } from '@evefrontier/ui';
import { Link } from '@tanstack/react-router';
import { DappDetailHero } from '@/components/directory/DappDetailHero';
import { InstallDappButton } from '@/components/directory/InstallDappButton';
import { getDappDetailViewModel } from '@/directory/dappDetailModel';
import type {
  DappDetailPackageView,
  DappDetailViewModel,
} from '@/directory/dappDetailModel';
import type { DappIndexEntry } from '@/types/dapp-index';

function DirectoryBackLink() {
  return (
    <Link className="directory-detail-back" to="/">
      ← Back
    </Link>
  );
}

function DappDetailBreadcrumb({ segments }: { segments: readonly string[] }) {
  if (segments.length === 0) return null;

  return (
    <p className="directory-detail-breadcrumb">{segments.join(' > ')}</p>
  );
}

function DappDetailMetaCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <h2 className="directory-detail-meta-label">{label}</h2>
      <p className="directory-detail-meta-value">{value}</p>
    </div>
  );
}

function DappDetailMetaRow({ model }: { model: DappDetailViewModel }) {
  if (!model.creatorLabel && !model.networkLabel) return null;

  return (
    <div className="directory-detail-meta-row">
      {model.creatorLabel ? (
        <DappDetailMetaCell label="Creator" value={model.creatorLabel} />
      ) : (
        <span />
      )}
      {model.networkLabel ? (
        <DappDetailMetaCell label="Network" value={model.networkLabel} />
      ) : null}
    </div>
  );
}

function DappDetailTags({ labels }: { labels: readonly string[] }) {
  if (labels.length === 0) return null;

  return (
    <ul className="directory-detail-tag-row">
      {labels.map((label) => (
        <li key={label} className="directory-detail-tag-text">
          {label}
        </li>
      ))}
    </ul>
  );
}

function DappDetailSummary({ model }: { model: DappDetailViewModel }) {
  return (
    <div className="directory-detail-copy">
      <p className="directory-detail-summary">{model.summary}</p>
      {model.description ? (
        <p className="directory-detail-description">{model.description}</p>
      ) : null}
    </div>
  );
}

function ExternalLinkRow({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      className="directory-detail-link-row"
      href={href}
      rel="noopener noreferrer"
      target="_blank"
      title={href}
    >
      <h3 className="directory-detail-link-label">{label}</h3>
      <p className="directory-detail-external-link">{href}</p>
    </a>
  );
}

function DappDetailLinks({
  model,
  entry,
}: {
  model: DappDetailViewModel;
  entry: DappIndexEntry;
}) {
  const hasLinks =
    model.repositoryUrl || model.documentationUrl || model.metadataReadUrl;

  if (!hasLinks) return null;

  return (
    <section className="directory-detail-section">
      <h2 className="ds-type-label text-(--color-neutral)">Links</h2>
      <div className="directory-detail-link-grid">
        {model.repositoryUrl ? (
          <ExternalLinkRow href={model.repositoryUrl} label="Repository" />
        ) : null}
        {model.documentationUrl ? (
          <ExternalLinkRow href={model.documentationUrl} label="Documentation" />
        ) : null}
        {model.metadataReadUrl ? (
          <ExternalLinkRow
            href={model.metadataReadUrl}
            label="Walrus metadata"
          />
        ) : null}
      </div>
      <InstallDappButton entry={entry} />
    </section>
  );
}

function DappDetailPackages({
  packages,
}: {
  packages: readonly DappDetailPackageView[];
}) {
  if (packages.length === 0) return null;

  return (
    <section className="directory-detail-section">
      <h2 className="ds-type-label text-(--color-neutral)">Package</h2>
      <div className="directory-detail-package-list">
        {packages.map((pkg) => (
          <article
            key={`${pkg.network}-${pkg.packageId}-${pkg.role}`}
            className="directory-detail-package-row"
          >
            <div className="directory-detail-package-meta">
              <p className="text-xs font-semibold uppercase text-(--color-neutral-60)">
                {pkg.network} {pkg.role && `· ${pkg.role}`}
              </p>
              {pkg.mvrName ? (
                <p className="text-sm font-medium text-(--color-neutral)">{pkg.mvrName}</p>
              ) : null}
              <p className="break-all text-xs font-mono text-(--color-neutral-60)">
                {pkg.packageId}
              </p>
              {pkg.packageInfoId ? (
                <p className="break-all text-xs font-mono text-(--color-neutral-60)">
                  {pkg.packageInfoId}
                </p>
              ) : null}
            </div>

            {pkg.explorerUrl ? (
              <a
                className="directory-detail-external-link"
                href={pkg.explorerUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                View on explorer
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

function DappDetailNotes({ notes }: { notes: string }) {
  return (
    <section className="directory-detail-section">
      <h2 className="ds-type-label text-(--color-neutral)">Notes</h2>
      <p className="text-sm leading-relaxed text-(--color-neutral-60)">{notes}</p>
    </section>
  );
}

function DappDetailConnect({ liveUrl }: { liveUrl: string }) {
  return (
    <div className="directory-detail-cta">
      <Button external href={liveUrl} size="large" variant="primary">
        Connect
      </Button>
    </div>
  );
}

export function DappDetailNotFound() {
  return (
    <div className="space-y-4">
      <DirectoryBackLink />
      <p className="text-sm text-(--color-neutral-60)">Listing not found.</p>
    </div>
  );
}

export function DappDetailView({ entry }: { entry: DappIndexEntry }) {
  const model = getDappDetailViewModel(entry);

  return (
    <div className="directory-detail-page">
      <div className="directory-detail-topbar">
        <DirectoryBackLink />
        <DappDetailBreadcrumb segments={model.breadcrumbSegments} />
      </div>

      <DappDetailHero name={model.name} slides={model.gallerySlides} />

      <div className="directory-detail-identity">
        <DappDetailMetaRow model={model} />
        <DappDetailTags labels={model.tagLabels} />
        <DappDetailSummary model={model} />
      </div>

      <DappDetailLinks model={model} entry={entry} />
      {model.notes ? <DappDetailNotes notes={model.notes} /> : null}

      <DappDetailPackages packages={model.packages} />
      <DappDetailConnect liveUrl={model.liveUrl} />
    </div>
  );
}
