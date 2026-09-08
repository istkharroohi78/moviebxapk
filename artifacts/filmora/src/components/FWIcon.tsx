const FWIcon = ({ className = "h-8 w-8" }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" className={className} aria-hidden="true">
        <defs>
            <linearGradient id="mb-icon-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3D3D" />
                <stop offset="55%" stopColor="#FF8A00" />
                <stop offset="100%" stopColor="#FFC93C" />
            </linearGradient>
        </defs>
        <rect x="2" y="2" width="40" height="40" rx="11" ry="11" fill="url(#mb-icon-grad-2)" />
        <rect x="7" y="11" width="30" height="22" rx="4" fill="rgba(0,0,0,0.32)" />
        <polygon points="19,16 19,28 30,22" fill="white" />
        <rect x="7" y="7" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.55)" />
        <rect x="7" y="34" width="30" height="3" rx="1.5" fill="rgba(255,255,255,0.35)" />
    </svg>
);

export default FWIcon;
