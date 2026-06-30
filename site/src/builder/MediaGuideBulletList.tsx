export function MediaGuideBulletList({
  items,
}: {
  items: readonly string[];
}) {
  return (
    <ul className="builder-media-guide-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
