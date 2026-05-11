'use client';

interface AvatarProps {
  src?: string | null;
  color: string;
  name: string;
  initials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: string;
}

const SIZES: Record<string, { w: number; h: number; font: number }> = {
  xs: { w: 28, h: 28, font: 12 },
  sm: { w: 36, h: 36, font: 14 },
  md: { w: 48, h: 48, font: 18 },
  lg: { w: 72, h: 72, font: 28 },
  xl: { w: 96, h: 96, font: 36 },
};

export function getInitials(name: string): string {
  const parts = name.trim().replace(/[^a-zA-Z0-9\s_]/g, ' ').split(/[\s_]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  const letters = name.replace(/[^a-zA-Z]/g, '');
  return (letters.slice(0, 2) || name.slice(0, 2) || 'EQ').toUpperCase();
}

export default function Avatar({ src, color, name, initials, size = 'md', radius = '50%' }: AvatarProps) {
  const { w, h, font } = SIZES[size] || SIZES.md;
  const label = initials || getInitials(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={{ width: w, height: h, borderRadius: radius, objectFit: 'cover', flexShrink: 0,
          border: '2px solid rgba(255,255,255,0.08)' }}
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  return (
    <div style={{ width: w, height: h, borderRadius: radius, background: color, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Clash Display', sans-serif", fontWeight: 700,
      fontSize: font, color: '#0A0A0F', letterSpacing: '-0.01em',
      border: '2px solid rgba(255,255,255,0.1)',
    }}>
      {label}
    </div>
  );
}
