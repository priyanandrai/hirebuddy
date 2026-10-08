"use client";

import { useState, useRef, useEffect } from "react";

const CustomDropdown = ({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  width = "w-72",
}) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find(
    (option) => option.value === value
  );

  return (
    <div
      ref={dropdownRef}
      className={`relative ${width}`}
    >
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="
          w-full
          flex
          items-center
          justify-between
          px-4
          py-3
          rounded-lg
          border
          border-slate-700
          bg-slate-900
          text-white
          text-sm
          font-medium
          hover:border-slate-500
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500/30
          transition
        "
      >
        <span className="flex items-center gap-2">
          {selectedOption?.icon && (
            <span>{selectedOption.icon}</span>
          )}

          <span>
            {selectedOption?.label || placeholder}
          </span>
        </span>

        {/* Arrow */}
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          className="
            absolute
            left-0
            top-full
            mt-2
            w-full
            rounded-lg
            border
            border-slate-700
            bg-slate-900
            shadow-xl
            overflow-hidden
            z-50
          "
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`
                w-full
                flex
                items-center
                gap-2
                px-4
                py-3
                text-left
                text-sm
                transition
                ${
                  value === option.value
                    ? "bg-slate-800 text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }
              `}
            >
              {option.icon && (
                <span>{option.icon}</span>
              )}

              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;