import { Link } from '@tanstack/react-router';
import { Tag } from '@evefrontier/ui';
import { DappDetailGallery } from '@/components/directory/DappDetailGallery';
import { getDappDetailViewModel } from '@/directory/dappDetailModel';
import type {
  DappDetailPackageView,
  DappDetailViewModel,
} from '@/directory/dappDetailModel';
import type { DappIndexEntry } from '@/types/dapp-index';

function DirectoryBackLink() {
  return (
    <Link
      to="/"
      className="text-sm font-bold uppercase text-(--color-martian-red)"
    >
      ← Directory
    </Link>
  );
}

function DappDetailHero({ heroUrl, name }: { heroUrl: string | null; name: string }) {
  if (!heroUrl) return null;

  return (
    <div className="directory-detail-hero">
      <img alt="" className="directory-detail-hero-image" src={heroUrl} />
      <span className="sr-only">{name} hero image</span>
    </div>
  );
}

function DappDetailIdentity({ model }: { model: DappDetailViewModel }) {
  return (
    <header className="directory-detail-identity">
      <div className="directory-detail-identity-row">
        {model.logoUrl ? (
          <img
            alt=""
            className="directory-detail-logo"
            src={model.logoUrl}
          />
        ) : null}

        <div className="min-w-0 space-y-3">
          <h1 className="directory-detail-title">{model.name}</h1>

          <div className="directory-detail-tag-row">
            {model.categories.map((category) => (
              <Tag
                key={category.id}
                size="small"
                text={category.label}
                variant="secondary"
              />
            ))}
            {model.smartAssemblyTypes.map((assembly) => (
              <Tag
                key={assembly.id}
                size="small"
                text={assembly.label}
                variant="secondary"
              />
            ))}
            {model.serverTenantLabel ? (
              <Tag
                size="small"
                text={model.serverTenantLabel}
                variant="secondary"
              />
            ) : null}
          </div>
        </div>
      </div>

      <p className="directory-detail-summary">{model.summary}</p>
      {model.description ? (
        <p className="directory-detail-description">{model.description}</p>
      ) : null}
    </header>
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
    <div>
      <h3 className="ds-type-label mb-1 text-(--color-neutral-60)">{label}</h3>
      <a
        className="directory-detail-external-link"
        href={href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {href}
      </a>
    </div>
  );
}

function DappDetailLinks({ model }: { model: DappDetailViewModel }) {
  const hasLinks =
    model.liveUrl ||
    model.repositoryUrl ||
    model.documentationUrl ||
    model.metadataReadUrl;

  if (!hasLinks) return null;

  return (
    <section className="directory-detail-section">
      <h2 className="ds-type-label mb-3 text-(--color-neutral-60)">Links</h2>
      <div className="directory-detail-link-grid">
        <ExternalLinkRow href={model.liveUrl} label="Live" />
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
      <h2 className="ds-type-label mb-3 text-(--color-neutral-60)">Packages</h2>
      <div className="directory-detail-package-list">
        {packages.map((pkg) => (
          <article
            key={`${pkg.network}-${pkg.packageId}-${pkg.role}`}
            className="directory-detail-package-row"
          >
            <div className="directory-detail-package-meta">
              <p className="text-xs font-bold uppercase text-(--color-neutral)">
                {pkg.network} · {pkg.role}
              </p>
              {pkg.mvrName ? (
                <p className="text-sm text-(--color-neutral-60)">{pkg.mvrName}</p>
              ) : null}
              <p className="break-all text-xs text-(--color-neutral-60)">
                {pkg.packageId}
              </p>
              {pkg.packageInfoId ? (
                <p className="break-all text-xs text-(--color-neutral-60)">
                  Package info: {pkg.packageInfoId}
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
      <h2 className="ds-type-label mb-3 text-(--color-neutral-60)">Notes</h2>
      <p className="text-sm text-(--color-neutral)">{notes}</p>
    </section>
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
      <DirectoryBackLink />
      <DappDetailHero heroUrl={model.heroUrl} name={model.name} />
      <DappDetailIdentity model={model} />
      <DappDetailGallery slides={model.gallerySlides} />
      <DappDetailLinks model={model} />
      <DappDetailPackages packages={model.packages} />
      {model.notes ? <DappDetailNotes notes={model.notes} /> : null}
    </div>
  );
}
