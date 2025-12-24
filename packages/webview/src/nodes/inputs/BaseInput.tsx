import { cn } from "@/lib/cn.ts";

interface BaseInputProps {
    readonly value: string;
    readonly onChange: (value: string) => void;
    readonly type?: "text" | "number";
    readonly className?: string;
    readonly placeholder?: string;
    readonly min?: number;
    readonly max?: number;
}

export function BaseInput({ value, onChange, type = "text", className, placeholder, min, max }: BaseInputProps) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            min={min}
            max={max}
            className={cn(
                "flex-1 min-w-0 px-2 py-0.5 rounded text-sm",
                "bg-zinc-800 border border-zinc-700",
                "focus:outline-none focus:border-zinc-500",
                className
            )}
        />
    );
}
