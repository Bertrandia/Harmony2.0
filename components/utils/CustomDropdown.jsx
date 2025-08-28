import React from "react";

const CustomDropdown = ({ label, value, options, onChange }) => {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setOpen(false);
  };

  const selectedLabel =
    options.find((opt) => opt.value === value)?.label || "Select an option";

  return (
    <div className="space-y-2 relative">
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>

      <div
        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
        text-gray-700 font-medium cursor-pointer flex justify-between items-center
        hover:border-amber-200 transition-all"
        onClick={() => setOpen(!open)}
      >
        {selectedLabel}
        <svg
          className={`w-4 h-4 ml-2 transform transition-transform ${
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
      </div>

      {open && (
        <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg">
          <ul className="max-h-56 overflow-y-auto">
            {options.map((opt) => (
              <li
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className="px-4 py-2 cursor-pointer hover:bg-amber-50"
              >
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
export default CustomDropdown;
