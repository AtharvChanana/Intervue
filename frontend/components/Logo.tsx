export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Speech bubble */}
      <path
        d="M4 8C4 5.79 5.79 4 8 4H32C34.21 4 36 5.79 36 8V26C36 28.21 34.21 30 32 30H14L8 36V30H8C5.79 30 4 28.21 4 26V8Z"
        stroke="#DC9F85"
        strokeWidth="2.8"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Play / forward arrow */}
      <path
        d="M16 13L27 20L16 27V13Z"
        fill="#DC9F85"
      />
    </svg>
  );
}
