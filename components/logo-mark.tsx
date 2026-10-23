/**
 * The Job Copilot mark: a solid isometric cube with an open face — the
 * reference logo drawn as one path. The face is a hole (evenodd), so it takes
 * on whatever it sits on: white on the blue tiles, the gradient behind the
 * white onboarding artwork. The stroke rounds every corner (both silhouette
 * and face), matching the reference's soft cube.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 3.4 19.45 7.7v8.6L12 20.6l-7.45-4.3V7.7L12 3.4Z M13.5 9h2.6a1.5 1.5 0 0 1 1.5 1.5v1.4l-1.5.65 1.5.65v.35a1.5 1.5 0 0 1-1.5 1.5h-2.6A1.5 1.5 0 0 1 12 13.55V10.5A1.5 1.5 0 0 1 13.5 9Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
