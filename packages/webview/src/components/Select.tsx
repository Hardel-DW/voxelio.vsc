import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";
import { useClickOutside } from "@/lib/useClickOutside.ts";
import { useDropdownPosition } from "@/lib/useDropdownPosition.ts";
import { clsx } from "@/lib/utils.ts";

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
    const { containerRef, dropdownRef, position, updatePosition } = useDropdownPosition<HTMLDivElement, HTMLDivElement>();
    useClickOutside(() => {
        setIsOpen(false);
        setSearch("");
    }, containerRef);
    const searchRef = useRef<HTMLInputElement>(null);
    const selectedOption = options.find((opt) => opt.value === value);
    const displayText = selectedOption?.label ?? placeholder;
    const filteredOptions = search ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase())) : options;

    const handleToggle = (): void => {
        const opening = !isOpen;
        setIsOpen(opening);
        if (opening) {
            setSearch("");
            setTimeout(() => {
                updatePosition();
                searchRef.current?.focus();
            }, 0);
        }
    };

    const handleSelect = (optionValue: string): void => {
        onChange(optionValue);
        setIsOpen(false);
        setSearch("");
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
        if (e.key === "Escape") {
            setIsOpen(false);
            setSearch("");
        } else if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggle();
        }
    };

    return (
        <div class="select" role="listbox" ref={containerRef} onKeyDown={handleKeyDown}>
            <button type="button" class="select-trigger" onClick={handleToggle}>
                <span class="select-value">{displayText}</span>
                <span class="select-arrow">{isOpen ? "\u25B2" : "\u25BC"}</span>
            </button>
            {isOpen && (
                <div class={clsx("select-dropdown", position)} ref={dropdownRef}>
                    <input
                        ref={searchRef}
                        type="text"
                        class="select-search"
                        placeholder="Search..."
                        value={search}
                        onInput={(e) => setSearch(e.currentTarget.value)}
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
