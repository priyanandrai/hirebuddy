export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 600 420"
      className="w-full h-auto"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>
        {`
          .dash-line {
            stroke-dasharray: 4 6;
            animation: dashMove 4s linear infinite;
          }

          .pulse {
            animation: pulse 2.5s ease-in-out infinite;
            transform-origin: center;
          }

          .fade {
            animation: fade 3s ease-in-out infinite;
          }

          @keyframes dashMove {
            to {
              stroke-dashoffset: -20;
            }
          }

          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.15);
              opacity: 0.7;
            }
          }

          @keyframes fade {
            0%, 100% {
              opacity: 0.6;
            }
            50% {
              opacity: 1;
            }
          }
        `}
      </style>

      {/* Background */}
      <rect width="600" height="420" rx="24" fill="#F6F8FA" />

      {/* Decorative circles */}
      <circle cx="480" cy="90" r="50" fill="#DBEAFE" />
      <circle cx="120" cy="320" r="40" fill="#E0F2FE" />

      {/* Main card */}
      <rect
        x="90"
        y="90"
        width="420"
        height="240"
        rx="20"
        fill="#FFFFFF"
        stroke="#E5E7EB"
      />

      {/* Helper */}
      <circle cx="180" cy="170" r="26" fill="#BFDBFE" />
      <rect x="150" y="205" width="60" height="40" rx="12" fill="#93C5FD" />

      {/* Customer */}
      <circle cx="320" cy="170" r="26" fill="#FDE68A" />
      <rect x="290" y="205" width="60" height="40" rx="12" fill="#FCD34D" />

      {/* Animated connection */}
      <line
        x1="210"
        y1="170"
        x2="290"
        y2="170"
        stroke="#CBD5E1"
        strokeWidth="2"
        className="dash-line"
      />

      {/* Verified */}
      <g className="fade">
        <rect x="150" y="270" width="90" height="36" rx="10" fill="#ECFEFF" />
        <circle cx="168" cy="288" r="6" fill="#22C55E" />
        <text x="182" y="293" fontSize="12" fill="#065F46">
          Verified
        </text>
      </g>

      {/* Pricing */}
      <g className="fade">
        <rect x="255" y="270" width="90" height="36" rx="10" fill="#EFF6FF" />
        <text x="268" y="293" fontSize="12" fill="#1D4ED8">
          ₹ Pricing
        </text>
      </g>

      {/* Tracking */}
      <g>
        <rect x="360" y="270" width="110" height="36" rx="10" fill="#F0FDFA" />
        <circle cx="378" cy="288" r="5" fill="#0EA5E9" className="pulse" />
        <text x="390" y="293" fontSize="12" fill="#0369A1">
          Live tracking
        </text>
      </g>
    </svg>
  );
}
