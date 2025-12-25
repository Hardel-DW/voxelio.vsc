import { useState, useRef } from "react";

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

export function Autocomplete({ value, options, onChange, placeholder }: AutocompleteProps): React.ReactNode {
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
        // Delay pour permettre le click sur une option
        setTimeout(() => setIsOpen(false), 150);
    };

    return (
        <div className="autocomplete">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => handleInputChange(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
            />
            {isOpen && filteredOptions.length > 0 && (
                <ul className="autocomplete-dropdown">
                    {filteredOptions.map((opt) => (
                        <li
                            key={opt.value}
                            className={opt.value === value ? "selected" : ""}
                            onMouseDown={() => handleSelect(opt.value)}
                        >
                            {opt.label ?? opt.value}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
