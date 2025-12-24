import { cn } from "@/lib/cn.ts";

interface BaseSelectProps {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly options: readonly string[];
    readonly className?: string;
}

export function BaseSelect({ value, onChange, options, className }: BaseSelectProps) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
                "flex-1 min-w-0 px-2 py-0.5 rounded text-sm",
                "bg-zinc-800 border border-zinc-700",
                "focus:outline-none focus:border-zinc-500",
                className
            )}>
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
    );
}
