import { useState } from "preact/hooks";

interface CustomFormatInputProps {
    onSubmit: (packFormat: number) => void;
    placeholder?: string;
    buttonText?: string;
    className?: string;
}

export function CustomFormatInput({
    onSubmit,
    placeholder = "Custom format",
    buttonText = "Apply",
    className = ""
}: CustomFormatInputProps) {
    const [value, setValue] = useState("");

    const handleChange = (e: Event): void => {
        const target = e.target as HTMLInputElement;
        setValue(target.value.replace(/[^0-9]/g, "").slice(0, 10));
    };

    const handleSubmit = (): void => {
        const parsed = Number.parseInt(value, 10);
        if (!Number.isNaN(parsed) && parsed > 0) {
            onSubmit(parsed);
            setValue("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Enter") handleSubmit();
    };

    return (
        <div class={className}>
            <input
                type="text"
                class={`${className}-input`}
                placeholder={placeholder}
                value={value}
                onInput={handleChange}
                onKeyDown={handleKeyDown}
                inputMode="numeric"
            />
            <button type="button" class={`${className}-btn`} onClick={handleSubmit} disabled={!value}>
                {buttonText}
            </button>
        </div>
    );
}
