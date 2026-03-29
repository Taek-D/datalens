import { useStore } from '../store';

interface AnalysisProgressProps {
  className?: string;
}

export function AnalysisProgress({ className = '' }: AnalysisProgressProps) {
  const analysisStep = useStore((s) => s.analysisStep);

  if (!analysisStep) return null;

  return (
    <div className={`flex items-center gap-3 bg-primary-light border border-primary/20 rounded-lg px-4 py-3 ${className}`} role="status">
      {/* Spinning indicator */}
      <svg
        className="animate-spin w-5 h-5 text-primary flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>
      <span className="text-sm font-medium text-primary">{analysisStep}</span>
    </div>
  );
}
