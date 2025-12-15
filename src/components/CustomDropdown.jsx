import { useState, useRef, useEffect } from 'react';
import './CustomDropdown.css';

export function CustomDropdown({ 
  options, 
  value, 
  onChange, 
  placeholder = 'Select an option',
  disabled = false 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div className={`custom-dropdown ${disabled ? 'disabled' : ''}`} ref={dropdownRef}>
      <button
        type="button"
        className={`dropdown-button ${isOpen ? 'open' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span className="dropdown-button-text">
          {selectedOption ? (
            <>
              {selectedOption.icon && <span className="dropdown-icon">{selectedOption.icon}</span>}
              {selectedOption.label}
              {selectedOption.count !== undefined && (
                <span className="dropdown-count">({selectedOption.count} moles)</span>
              )}
            </>
          ) : (
            <span className="dropdown-placeholder">{placeholder}</span>
          )}
        </span>
        <span className={`dropdown-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="dropdown-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`dropdown-option ${value === option.value ? 'selected' : ''} ${option.isSpecial ? 'special' : ''}`}
              onClick={() => handleSelect(option.value)}
            >
              {option.icon && <span className="option-icon">{option.icon}</span>}
              <span className="option-label">{option.label}</span>
              {option.count !== undefined && (
                <span className="option-count">{option.count}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

