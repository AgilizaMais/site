export function Eyebrow({
  children,
  className = '',
  ...rest
}: React.ComponentPropsWithoutRef<'span'>) {
  return (
    <span className={`block font-mono text-label uppercase text-muted ${className}`} {...rest}>
      {children}
    </span>
  );
}
