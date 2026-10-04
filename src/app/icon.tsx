import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        background: '#0a1628',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 900, color: '#fbbf24' }}>$</div>
    </div>,
    { width: 32, height: 32 },
  );
}
