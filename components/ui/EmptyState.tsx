// components/ui/EmptyState.tsx
interface EmptyStateProps {
  emoji: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ emoji, title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        border: '1px dashed var(--border-color)',
      }}
    >
      <span className="text-5xl mb-4">{emoji}</span>
      <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm max-w-xs" style={{ color: 'var(--text-muted)' }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-5 px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--color-brand)' }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}