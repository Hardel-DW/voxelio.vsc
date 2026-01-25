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
    const [search, setSearch] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const filteredOptions = options.filter((opt) => {
        if (!search) return true;
        const searchLower = search.toLowerCase();
        return opt.value.toLowerCase().includes(searchLower) || (opt.label?.toLowerCase().includes(searchLower) ?? false);
    });

    const handleInputChange = (newValue: string): void => {
        onChange(newValue);
    };

    const handleSelect = (optionValue: string): void => {
        onChange(optionValue);
        setSearch("");
        setIsOpen(false);
        inputRef.current?.blur();
    };

    const handleFocus = (): void => {
        setIsOpen(true);
        setSearch("");
        setTimeout(() => searchRef.current?.focus(), 0);
    };

    const handleBlur = (e: FocusEvent): void => {
        const container = inputRef.current?.parentElement;
        if (!container?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
            setSearch("");
        }
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
                <div class="autocomplete-dropdown">
                    <input
                        ref={searchRef}
                        type="text"
                        class="autocomplete-search"
                        placeholder="Search..."
                        value={search}
                        onInput={(e) => setSearch(e.currentTarget.value)}
                        onMouseDown={(e) => e.stopPropagation()}
                    />
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
