import type { JSX } from "preact";
import { useRef, useState } from "preact/hooks";

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
    const [filter, setFilter] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredOptions = options.filter((opt) => {
        const searchValue = filter || value;
        if (!searchValue) return true;
        return opt.value.toLowerCase().includes(searchValue.toLowerCase());
    });

    const handleInputChange = (newValue: string): void => {
        setFilter(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleSelect = (optionValue: string): void => {
        onChange(optionValue);
        setFilter("");
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleFocus = (): void => {
        setIsOpen(true);
    };

    const handleBlur = (): void => {
        setTimeout(() => setIsOpen(false), 150);
    };

    return (
        <div class="autocomplete">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onInput={(e) => handleInputChange(e.currentTarget.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul class="autocomplete-dropdown">
                    {filteredOptions.map((opt) => (
                        <li key={opt.value} class={opt.value === value ? "selected" : ""} onMouseDown={() => handleSelect(opt.value)}>
                            {opt.label ?? opt.value}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
