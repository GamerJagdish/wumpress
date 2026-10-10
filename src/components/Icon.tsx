'use client';

interface IconProps {
  name: string;
  className?: string;
  size?: number | string;
}

export default function Icon({ name, className = '', size }: IconProps) {
  return (
    <span
      className={`material-symbols-rounded select-none leading-none inline-flex items-center justify-center shrink-0 ${className}`}
      style={size ? { fontSize: typeof size === 'number' ? `${size}px` : size } : undefined}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
