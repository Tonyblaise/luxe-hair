"use client";

/** On/off toggle (44×26 track, 20px knob). */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-[26px] w-11 shrink-0 items-center rounded-full p-[3px] transition-ui ${checked ? "bg-cyan-400" : "bg-gray-300"}`}
    >
      <span
        className={`size-5 rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? "translate-x-[18px]" : ""}`}
      />
    </button>
  );
}
