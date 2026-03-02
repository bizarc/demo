import { Button } from './Button';

export interface FilterTabProps {
    label: string;
    count: number;
    active: boolean;
    onClick: () => void;
}

/**
 * Filter tab with label and optional count badge. Use for status filters (e.g. All, Draft, Active).
 * Spacing between label and count is applied here so it stays consistent across the app.
 */
export function FilterTab({ label, count, active, onClick }: FilterTabProps) {
    return (
        <Button
            type="button"
            onClick={onClick}
            variant={active ? 'ghost' : 'secondary'}
            size="sm"
            className={active ? 'border border-primary bg-primary-highlight text-primary' : ''}
        >
            <span className="inline-flex items-center gap-2">
                <span>{label}</span>
                {count > 0 && (
                    <span
                        className={`rounded-full px-1.5 text-[11px] leading-[18px] ${active ? 'bg-primary text-white' : 'bg-border-subtle text-foreground-muted'}`}
                    >
                        {count}
                    </span>
                )}
            </span>
        </Button>
    );
}
