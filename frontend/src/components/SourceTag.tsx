/**
 * SOURCE TAG COMPONENT
 *
 * A small pill/badge component that displays document sources
 * Shows where the AI got its information from
 *
 * Props (inputs to the component):
 * - sources: Array of source names
 */

interface SourceTagProps {
  sources: string[];
}

export function SourceTag({ sources }: SourceTagProps) {
  // Don't render anything if there are no sources
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-50">
      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sources</span>
      <div className="flex flex-wrap gap-2">
        {sources.map((source, index) => (
          <div
            key={index}
            className="group relative flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all cursor-default"
          >
            <span className="text-[10px] font-bold text-blue-600">[{index + 1}]</span>
            <span className="text-xs text-gray-600 font-medium">{source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
