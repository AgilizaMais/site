type Props = {
  eyebrow: string;
  title: string | readonly string[];
  accent: string;
  as?: 'h2' | 'h3';
  className?: string;
  id?: string;
};

/** Título de seção com linhas mascaradas (animadas por <Reveals/>). */
export function SectionTitle({ eyebrow, title, accent, as: Tag = 'h2', className = '', id }: Props) {
  const lines = typeof title === 'string' ? [title] : [...title];
  return (
    <div className={className}>
      <p className="eyebrow" data-reveal>
        {eyebrow}
      </p>
      <Tag id={id} className="display h2" data-reveal-lines style={{ marginTop: '1.1rem' }}>
        {lines.map((l, i) => (
          <span className="line-mask" key={i}>
            <span>
              {l}
              {i === lines.length - 1 && (
                <>
                  {' '}
                  <em className="accent">{accent}</em>
                </>
              )}
            </span>
          </span>
        ))}
      </Tag>
    </div>
  );
}
