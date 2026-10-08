"use client";

import { useState, useRef, useEffect } from "react";

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  width = "w-full",
  className = "",
  disabled = false,
  name,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  // Normalize options to { label, value, icon, description }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === "string") {
      return { label: opt, value: opt, icon: null };
    }
    return {
      label: opt.label || opt.name || opt.value,
      value: opt.value !== undefined ? opt.value : opt.name || opt.label,
      icon: opt.icon || null,
      description: opt.description || null,
    };
  });

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  // Find currently selected option
  const selectedOption = normalizedOptions.find(
    (opt) => opt.value === value || opt.label === value
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
        setSearch("");
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleSelect = (optValue) => {
    if (onChange) {
      onChange(optValue);
    }
    setOpen(false);
    setSearch("");
  };

  return (
    <div ref={dropdownRef} className={`relative ${width} ${className}`}>
      {/* Invisible input for standard form submission & HTML5 validation */}
      {name && (
        <input
          type="text"
          tabIndex={-1}
          name={name}
          value={value || ""}
          required={required}
          onChange={() => {}}
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            width: 1,
            height: 1,
            opacity: 0,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Select Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((prev) => !prev)}
        className={`
          w-full
          flex
          items-center
          justify-between
          px-3.5
          py-3
          rounded-xl
          border
          text-sm
          font-medium
          transition-all
          duration-150
          text-left
          ${
            disabled
              ? "opacity-50 cursor-not-allowed border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/40 text-slate-400"
              : open
              ? "border-blue-500 ring-2 ring-blue-500/20 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 hover:border-slate-400 dark:hover:border-slate-600"
          }
        `}
      >
        <span className="flex items-center gap-2.5 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="text-base leading-none">
                  {selectedOption.icon}
                </span>
              )}
              <span className="font-normal text-slate-900 dark:text-slate-100">
                {selectedOption.label}
              </span>
            </>
          ) : (
            <span className="text-slate-400 dark:text-slate-400 font-normal">
              {placeholder}
            </span>
          )}
        </span>

        {/* Chevron Icon */}
        <svg
          className={`w-4 h-4 ml-2 text-slate-400 transition-transform duration-200 shrink-0 ${
            open ? "rotate-180 text-blue-500" : ""
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
            mt-1.5
            w-full
            max-h-72
            rounded-xl
            border
            border-gray-200
            dark:border-slate-700
            bg-white
            dark:bg-slate-900
            shadow-2xl
            dark:shadow-slate-950/80
            overflow-hidden
            z-50
            flex
            flex-col
          "
        >
          {/* Optional Search if more than 6 options */}
          {normalizedOptions.length > 6 && (
            <div className="p-2 border-b border-gray-100 dark:border-slate-800">
              <input
                type="text"
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="
                  w-full
                  px-3
                  py-1.5
                  text-xs
                  rounded-lg
                  border
                  border-gray-200
                  dark:border-slate-700
                  bg-gray-50
                  dark:bg-slate-800
                  text-slate-900
                  dark:text-slate-100
                  placeholder:text-slate-400
                  focus:outline-none
                  focus:border-blue-500
                "
              />
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto py-1 max-h-60 divide-y divide-gray-50 dark:divide-slate-800/40">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-xs text-slate-400 text-center">
                No matching options found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected =
                  value === opt.value || value === opt.label;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      w-full
                      flex
                      items-center
                      justify-between
                      px-3.5
                      py-2.5
                      text-left
                      text-sm
                      transition-colors
                      ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-medium"
                          : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }
                    `}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {opt.icon && (
                        <span className="text-base leading-none">
                          {opt.icon}
                        </span>
                      )}
                      <div className="truncate">
                        <span className="block truncate">{opt.label}</span>
                        {opt.description && (
                          <span className="block text-xs text-slate-400 truncate">
                            {opt.description}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Selected Checkmark */}
                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2.5}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
