import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    value: string;
    options: SelectOption[];
    onChange: (value: string) => void;
    placeholder?: string;
}

export function Select({ value, options, onChange, placeholder = "Select..." }: SelectProps): JSX.Element {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const displayText = selectedOption?.label ?? placeholder;

    const handleToggle = (): void => {
        setIsOpen(!isOpen);
    };

    const handleSelect = (optionValue: string): void => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const handleBlur = (e: FocusEvent): void => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Escape") {
            setIsOpen(false);
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
        }
    };

    return (
        <div class="select" ref={containerRef} onBlur={handleBlur} tabIndex={0} onKeyDown={handleKeyDown}>
            <button type="button" class="select-trigger" onClick={handleToggle}>
                <span class="select-value">{displayText}</span>
                <span class="select-arrow">{isOpen ? "\u25B2" : "\u25BC"}</span>
            </button>
            {isOpen && (
                <ul class="select-dropdown">
                    {placeholder && (
                        <li class={`select-option ${!value ? "selected" : ""}`} onMouseDown={() => handleSelect("")}>
                            {placeholder}
                        </li>
                    )}
                    {options.map((opt) => (
                        <li
                            key={opt.value}
                            class={`select-option ${opt.value === value ? "selected" : ""}`}
                            onMouseDown={() => handleSelect(opt.value)}>
                            {opt.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
