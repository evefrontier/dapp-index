import { Button } from '@evefrontier/component-library';
import { useState } from 'react';
import type { DappDetailGallerySlide } from '@/directory/resolveDetailMedia';

function GallerySlide({
  slide,
}: {
  slide: DappDetailGallerySlide;
}) {
  if (slide.kind === 'video') {
    return (
      <video
        className="directory-detail-gallery-media"
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
      className="directory-detail-gallery-media"
      src={slide.url}
    />
  );
}

export function DappDetailGallery({
  slides,
}: {
  slides: readonly DappDetailGallerySlide[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (slides.length === 0) return null;

  const activeSlide = slides[activeIndex] ?? slides[0];
  const hasMultipleSlides = slides.length > 1;

  function showPrevious() {
    setActiveIndex((index) => (index === 0 ? slides.length - 1 : index - 1));
  }

  function showNext() {
    setActiveIndex((index) => (index === slides.length - 1 ? 0 : index + 1));
  }

  return (
    <section aria-labelledby="dapp-detail-gallery-heading" className="directory-detail-gallery">
      <div className="directory-detail-gallery-header">
        <h2
          className="ds-type-label text-(--colors-neutral-60)"
          id="dapp-detail-gallery-heading"
        >
          Gallery
        </h2>
        {hasMultipleSlides ? (
          <p className="text-xs font-bold uppercase text-(--colors-neutral-60)">
            {activeIndex + 1} / {slides.length}
          </p>
        ) : null}
      </div>

      <div className="directory-detail-gallery-stage">
        <div className="directory-detail-gallery-frame">
          <GallerySlide slide={activeSlide} />
        </div>

        {activeSlide.caption ? (
          <p className="directory-detail-gallery-caption">{activeSlide.caption}</p>
        ) : null}

        {hasMultipleSlides ? (
          <div className="directory-detail-gallery-controls">
            <Button
              aria-label="Previous slide"
              size="sm"
              type="button"
              variant="secondary"
              onClick={showPrevious}
            >
              Prev
            </Button>
            <Button
              aria-label="Next slide"
              size="sm"
              type="button"
              variant="secondary"
              onClick={showNext}
            >
              Next
            </Button>
          </div>
        ) : null}
      </div>

      {hasMultipleSlides ? (
        <div className="directory-detail-gallery-dots">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              aria-current={index === activeIndex ? 'true' : undefined}
              aria-label={`Show slide ${index + 1}`}
              className="directory-detail-gallery-dot"
              data-active={index === activeIndex ? 'true' : 'false'}
              type="button"
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
