import { CheckIcon } from "./icons";

/** The visual square for a task; wrap it in a submit button. */
export function TaskCheck({ done, size = 28 }: { done: boolean; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`grid shrink-0 place-items-center rounded-[8px] transition-ui ${
        done ? "bg-navy-800 text-white" : "border-2 border-gray-400 bg-white text-transparent hover:border-navy-800"
      }`}
    >
      <CheckIcon size={Math.round(size * 0.57)} />
    </span>
  );
}
