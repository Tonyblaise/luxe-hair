import { passwordRules } from "@luxe-hair/shared";
import { CheckIcon } from "@/components/ui/icons";

export function PasswordRules({ password, confirm }: { password: string; confirm: string }) {
  const rules = passwordRules(password, confirm);
  const items = [
    { met: rules.length, label: "At least 8 characters" },
    { met: rules.number, label: "Includes a number" },
    { met: rules.match, label: "Passwords match" },
  ];
  return (
    <ul className="flex flex-col gap-2 rounded-md bg-paper p-3.5">
      {items.map((r) => (
        <li key={r.label} className="flex items-center gap-2.5 text-[13px]">
          <span
            className={`grid size-5 shrink-0 place-items-center rounded-full transition-ui ${
              r.met ? "bg-navy-800 text-white" : "border border-gray-300 bg-white text-transparent"
            }`}
          >
            <CheckIcon size={12} />
          </span>
          <span className={r.met ? "text-navy-800" : "text-gray-600"}>{r.label}</span>
        </li>
      ))}
    </ul>
  );
}
