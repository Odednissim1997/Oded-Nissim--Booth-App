import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        background: 'linear-gradient(145deg, #0a1628 0%, #112244 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Chicago skyline silhouette */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginBottom: 6 }}>
        {/* Left buildings */}
        <div style={{ width: 10, height: 28, background: 'rgba(255,255,255,0.4)', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: 13, height: 42, background: 'rgba(255,255,255,0.55)', borderRadius: '2px 2px 0 0' }} />

        {/* Willis Tower — stepped silhouette */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 1 }}>
            <div style={{ width: 3, height: 16, background: 'white' }} />
            <div style={{ width: 3, height: 16, background: 'white' }} />
          </div>
          <div style={{ width: 18, height: 10, background: 'white' }} />
          <div style={{ width: 26, height: 13, background: 'white' }} />
          <div style={{ width: 34, height: 48, background: 'white' }} />
        </div>

        {/* Right buildings */}
        <div style={{ width: 14, height: 54, background: 'rgba(255,255,255,0.65)', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: 11, height: 36, background: 'rgba(255,255,255,0.5)', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: 9, height: 22, background: 'rgba(255,255,255,0.35)', borderRadius: '2px 2px 0 0' }} />
      </div>

      {/* Dollar sign */}
      <div style={{ fontSize: 58, fontWeight: 900, color: '#fbbf24', lineHeight: 1 }}>$</div>

      {/* Label */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: 4, marginTop: 5 }}>
        CHI
      </div>
    </div>,
    { width: 180, height: 180 },
  );
}
