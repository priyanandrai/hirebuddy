export default function HeroIllustration() {
    return (
      <svg
        viewBox="0 0 600 400"
        className="w-full h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="600" height="400" fill="#F0F7FF" rx="24" />
        <circle cx="450" cy="120" r="60" fill="#D1FAE5" />
        <rect x="80" y="200" width="180" height="120" rx="16" fill="#DBEAFE" />
        <rect x="300" y="220" width="200" height="80" rx="16" fill="#E5E7EB" />
        <text x="120" y="260" fill="#111827" fontSize="18">
          Helper
        </text>
      </svg>
    );
  }

  