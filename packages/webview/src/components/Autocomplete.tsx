import type { JSX } from "preact";
import { useState } from "preact/hooks";
import { useClickOutside } from "@/lib/useClickOutside.ts";
import { useDropdownPosition } from "@/lib/useDropdownPosition.ts";
import { clsx } from "@/lib/utils.ts";

interface AutocompleteOption {
    value: string;
    label?: string;
}

interface AutocompleteProps {
    value: string;
    options: AutocompleteOption[];
    onChange: (value: string) => void;
    placeholder?: string;
}

export function Autocomplete({ value, options, onChange, placeholder }: AutocompleteProps): JSX.Element | null {
    const [isOpen, setIsOpen] = useState(false);
    const { containerRef, dropdownRef, position, updatePosition } = useDropdownPosition<HTMLDivElement, HTMLDivElement>();
    useClickOutside(() => setIsOpen(false), containerRef);
    const filteredOptions = value ? options.filter((opt) => (opt.label ?? opt.value).toLowerCase().includes(value.toLowerCase())) : options;

    const handleSelect = (optionValue: string): void => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const handleClick = (): void => {
        setIsOpen(true);
        setTimeout(updatePosition, 0);
    };

    return (
        <div class="autocomplete" ref={containerRef}>
            <input
                type="text"
                value={value}
                onInput={(e) => onChange(e.currentTarget.value)}
                onClick={handleClick}
                placeholder={placeholder}
            />
            {isOpen && filteredOptions.length > 0 && (
                <div class={clsx("autocomplete-dropdown", position)} ref={dropdownRef}>
                    <ul class="autocomplete-options">
                        {filteredOptions.map((opt) => (
                            <li key={opt.value} class={opt.value === value ? "selected" : ""} onMouseDown={() => handleSelect(opt.value)}>
                                {opt.label ?? opt.value}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
