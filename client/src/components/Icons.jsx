// Small inline SVG icon set (stroke icons inherit currentColor).
const S = ({ children, size = 20, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>{children}</svg>
);

export const Crown = ({ size = 28, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 64 48" aria-hidden="true" {...p}>
    <defs>
      <linearGradient id="crownG" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7e2a1" />
        <stop offset="1" stopColor="#c08a36" />
      </linearGradient>
    </defs>
    <path d="M8 36 L4 10 L18 22 L32 4 L46 22 L60 10 L56 36 Z" fill="url(#crownG)" />
    <rect x="8" y="39" width="48" height="6" rx="2" fill="url(#crownG)" />
    <circle cx="32" cy="4" r="3.2" fill="#e0457b" />
    <circle cx="4" cy="10" r="2.6" fill="#f7e2a1" />
    <circle cx="60" cy="10" r="2.6" fill="#f7e2a1" />
    <circle cx="32" cy="26" r="3" fill="#e0457b" />
  </svg>
);

export const Phone = (p) => <S {...p}><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2Z" /></S>;
export const Calendar = (p) => <S {...p}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></S>;
export const MapPin = (p) => <S {...p}><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></S>;
export const Users = (p) => <S {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></S>;
export const Star = (p) => <S {...p}><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1Z" /></S>;
export const Gift = (p) => <S {...p}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" /></S>;
export const Rupee = (p) => <S {...p}><path d="M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10" /></S>;
export const Trophy = (p) => <S {...p}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.7V17c0 .6-.5 1-1 1.2C7.8 18.8 7 20.2 7 22M14 14.7V17c0 .6.5 1 1 1.2 1.2.6 2 2 2 3.8M18 2H6v7a6 6 0 0 0 12 0V2Z" /></S>;
export const Dress = (p) => <S {...p}><path d="M9 2v4l-2 4 3 2-5 10h14l-5-10 3-2-2-4V2" /></S>;
export const Brush = (p) => <S {...p}><path d="m9.1 11.9 8.3-8.3a2 2 0 1 1 2.9 2.9l-8.3 8.3M7 14a3 3 0 0 0-3 3c0 1.3-1 2-2 2 1 1.5 2.8 2 4 2a4 4 0 0 0 4-4 3 3 0 0 0-3-3Z" /></S>;
export const Sparkle = (p) => <S {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" /></S>;
export const Menu = (p) => <S {...p}><path d="M4 7h16M4 12h16M4 17h16" /></S>;
export const Close = (p) => <S {...p}><path d="M18 6 6 18M6 6l12 12" /></S>;
export const Arrow = (p) => <S {...p}><path d="M5 12h14M13 6l6 6-6 6" /></S>;
export const Check = (p) => <S {...p}><path d="M20 6 9 17l-5-5" /></S>;
export const Upload = (p) => <S {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" /></S>;
export const Download = (p) => <S {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></S>;
export const Printer = (p) => <S {...p}><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></S>;
export const Mail = (p) => <S {...p}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></S>;
export const Image = (p) => <S {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" /></S>;
export const Video = (p) => <S {...p}><path d="m22 8-6 4 6 4V8Z" /><rect x="2" y="6" width="14" height="12" rx="2" /></S>;
export const Heading = (p) => <S {...p}><path d="M6 4v16M18 4v16M6 12h12" /></S>;
export const Text = (p) => <S {...p}><path d="M4 6h16M4 12h16M4 18h10" /></S>;
export const Quote = (p) => <S {...p}><path d="M3 21c3 0 7-1 7-8V5H3v7h4c0 3-1 5-4 5M14 21c3 0 7-1 7-8V5h-7v7h4c0 3-1 5-4 5" /></S>;
export const Trash = (p) => <S {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></S>;
export const Up = (p) => <S {...p}><path d="m18 15-6-6-6 6" /></S>;
export const Down = (p) => <S {...p}><path d="m6 9 6 6 6-6" /></S>;
export const Edit = (p) => <S {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></S>;
export const Eye = (p) => <S {...p}><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></S>;
export const Grid = (p) => <S {...p}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></S>;
export const FileText = (p) => <S {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></S>;
export const Plus = (p) => <S {...p}><path d="M12 5v14M5 12h14" /></S>;
export const Badge = (p) => <S {...p}><rect x="4" y="3" width="16" height="18" rx="2" /><circle cx="12" cy="10" r="3" /><path d="M8 17c.8-1.5 2.3-2 4-2s3.2.5 4 2" /></S>;
export const Award = (p) => <S {...p}><circle cx="12" cy="8" r="6" /><path d="M15.5 13 17 22l-5-3-5 3 1.5-9" /></S>;
export const Logout = (p) => <S {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></S>;
export const Globe = (p) => <S {...p}><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" /></S>;
export const Instagram = (p) => <S {...p}><rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></S>;
export const Facebook = (p) => <S {...p}><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3Z" /></S>;
export const Youtube = (p) => <S {...p}><path d="M22.5 6.4a2.8 2.8 0 0 0-2-2C18.8 4 12 4 12 4s-6.8 0-8.5.4a2.8 2.8 0 0 0-2 2A29 29 0 0 0 1 12a29 29 0 0 0 .5 5.6 2.8 2.8 0 0 0 2 2c1.7.4 8.5.4 8.5.4s6.8 0 8.5-.4a2.8 2.8 0 0 0 2-2A29 29 0 0 0 23 12a29 29 0 0 0-.5-5.6Z" /><path d="m9.8 15.5 5.7-3.5-5.7-3.5Z" /></S>;
export const Whatsapp = (p) => <S {...p}><path d="M3 21l1.7-4.9A9 9 0 1 1 8 19.6Z" /><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.2-2-1-1 .8a4 4 0 0 1-2.3-2.3l.8-1-1-2Z" /></S>;
