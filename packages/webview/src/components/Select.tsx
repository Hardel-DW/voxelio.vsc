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
    const [search, setSearch] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const selectedOption = options.find((opt) => opt.value === value);
    const displayText = selectedOption?.label ?? placeholder;

    const filteredOptions = options.filter((opt) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return opt.label.toLowerCase().includes(searchLower) || opt.value.toLowerCase().includes(searchLower);
    });

    const handleToggle = (): void => {
        const opening = !isOpen;
        setIsOpen(opening);
        if (opening) {
            setSearch("");
            setTimeout(() => searchRef.current?.focus(), 0);
        }
    };

    const handleSelect = (optionValue: string): void => {
        onChange(optionValue);
        setIsOpen(false);
        setSearch("");
    };

    const handleBlur = (e: FocusEvent): void => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
            setSearch("");
        }
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Escape") {
            setIsOpen(false);
            setSearch("");
        } else if (e.key === "Enter" || e.key === " ") {
            if (e.target === searchRef.current) return;
            e.preventDefault();
            handleToggle();
        }
    };

    return (
        <div class="select" role="listbox" ref={containerRef} onBlur={handleBlur} onKeyDown={handleKeyDown}>
            <button type="button" class="select-trigger" onClick={handleToggle}>
                <span class="select-value">{displayText}</span>
                <span class="select-arrow">{isOpen ? "\u25B2" : "\u25BC"}</span>
            </button>
            {isOpen && (
                <div class="select-dropdown">
                    <input
                        ref={searchRef}
                        type="text"
                        class="select-search"
                        placeholder="Search..."
                        value={search}
                        onInput={(e) => setSearch(e.currentTarget.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
                    <ul class="select-options">
                        {placeholder && (
                            <li class={`select-option ${!value ? "selected" : ""}`} onMouseDown={() => handleSelect("")}>
                                {placeholder}
                            </li>
                        )}
                        {filteredOptions.map((opt) => (
                            <li
                                key={opt.value}
                                class={`select-option ${opt.value === value ? "selected" : ""}`}
                                onMouseDown={() => handleSelect(opt.value)}>
                                {opt.label}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
