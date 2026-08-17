import { Button } from '@evefrontier/ui';
import { useState } from 'react';
import type { DappDetailGallerySlide } from '@/directory/resolveDetailMedia';

const HERO_TITLE_ID = 'dapp-detail-hero-title';

function GallerySlide({
  slide,
}: {
  slide: DappDetailGallerySlide;
}) {
  if (slide.kind === 'video') {
    return (
      <video
        className="directory-detail-hero-media"
        controls
        playsInline
        poster={slide.posterUrl ?? undefined}
        src={slide.sourceUrl}
      />
    );
  }

  return (
    <img
      alt={slide.alt}
      className="directory-detail-hero-media"
      src={slide.url}
    />
  );
}

/**
 * Identity hero: the active gallery slide with the listing title overlaid, plus the
 * carousel controls. Renders an empty frame when the entry has no media so the title
 * is always present.
 */
export function DappDetailHero({
  name,
  slides,
}: {
  name: string;
  slides: readonly DappDetailGallerySlide[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const activeSlide = slides[activeIndex] ?? slides[0] ?? null;
  const hasMultipleSlides = slides.length > 1;

  function showPrevious() {
    setActiveIndex((index) => (index === 0 ? slides.length - 1 : index - 1));
  }

  function showNext() {
    setActiveIndex((index) => (index === slides.length - 1 ? 0 : index + 1));
  }

  return (
    <section aria-labelledby={HERO_TITLE_ID} className="directory-detail-hero">
      <div className="directory-detail-hero-frame">
        {activeSlide ? (
          <GallerySlide slide={activeSlide} />
        ) : (
          <div className="directory-detail-hero-media" />
        )}

        {hasMultipleSlides ? (
          <p className="directory-detail-hero-counter">
            {activeIndex + 1} / {slides.length}
          </p>
        ) : null}

        <div className="directory-detail-hero-overlay">
          <h1 className="directory-detail-hero-title" id={HERO_TITLE_ID}>
            {name}
          </h1>
        </div>
      </div>

      {activeSlide?.caption || hasMultipleSlides ? (
        <div className="directory-detail-hero-footer">
          {activeSlide?.caption ? (
            <p className="directory-detail-hero-caption">{activeSlide.caption}</p>
          ) : null}

          {hasMultipleSlides ? (
            <div className="directory-detail-hero-nav">
              <div className="directory-detail-hero-steps">
                {slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    aria-current={index === activeIndex ? 'true' : undefined}
                    aria-label={`Show slide ${index + 1}`}
                    className="directory-detail-hero-step"
                    data-state={index === activeIndex ? 'current' : 'inactive'}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                  />
                ))}
              </div>

              <div className="directory-detail-hero-controls">
                <Button
                  aria-label="Previous slide"
                  size="small"
                  type="button"
                  variant="secondary"
                  onClick={showPrevious}
                >
                  ← Prev
                </Button>
                <Button
                  aria-label="Next slide"
                  size="small"
                  type="button"
                  variant="secondary"
                  onClick={showNext}
                >
                  Next →
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
