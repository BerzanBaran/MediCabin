interface IconProps {
  size?: number;
}

const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function IconUser({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" />
    </svg>
  );
}

export function IconBook({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5z" />
      <path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5z" />
    </svg>
  );
}

export function IconHelp({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.3 9.5a2.7 2.7 0 1 1 3.9 2.4c-.9.5-1.2 1-1.2 1.9" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconNote({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M6 3.5h9l4.5 4.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z" />
      <path d="M15 3.5V8h4.5" />
      <path d="M8 12.5h8M8 16h5.5" />
    </svg>
  );
}

export function IconChart({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <path d="M7.5 20v-6M12 20v-9M16.5 20v-4" />
    </svg>
  );
}

export function IconPulse({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M3 12h4l2-6 3 12 2-9 1.5 3H21" />
    </svg>
  );
}

export function IconShield({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 3.5 19 6.5v5c0 5-3 8.2-7 9.5-4-1.3-7-4.5-7-9.5v-5z" />
      <path d="M9 12l2 2 4-4.5" />
    </svg>
  );
}

export function IconCamera({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M4 8.5c0-.8.7-1.5 1.5-1.5H8l1.2-2h5.6L16 7h2.5c.8 0 1.5.7 1.5 1.5v9c0 .8-.7 1.5-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.4" />
    </svg>
  );
}

export function IconCalendar({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="4" y="5.5" width="16" height="15" rx="1.5" />
      <path d="M4 10h16M8 3.5v3.5M16 3.5v3.5" />
    </svg>
  );
}

export function IconGrid({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.3" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.3" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.3" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.3" />
    </svg>
  );
}

export function IconLayers({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M12 3.5 20.5 8 12 12.5 3.5 8z" />
      <path d="M3.5 12 12 16.5 20.5 12" />
      <path d="M3.5 16 12 20.5 20.5 16" />
    </svg>
  );
}

export function IconLink({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <path d="M9.5 13.5l5-5" />
      <path d="M8 16.5 5.5 19a3 3 0 0 1-4.2-4.2L4 12.3" />
      <path d="M16 7.5 18.5 5a3 3 0 1 1 4.2 4.2L20 11.7" />
    </svg>
  );
}

export function IconSearch({ size = 22 }: IconProps) {
  return (
    <svg {...base} width={size} height={size}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}
