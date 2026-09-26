import type { IdenStatus, PressStatus, Stage } from "../types";
import {
  IDEN_LABEL,
  PRESS_LABEL,
  STAGE_HINT,
  STAGE_LABEL,
} from "../types";

export function PressBadge({ value }: { value: PressStatus }) {
  return (
    <span className={`badge press-${value}`}>{PRESS_LABEL[value]}</span>
  );
}

export function IdenBadge({ value }: { value: IdenStatus }) {
  return <span className={`badge iden-${value}`}>{IDEN_LABEL[value]}</span>;
}

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span className={`badge stage-${stage}`} title={STAGE_HINT[stage]}>
      {STAGE_LABEL[stage]}
    </span>
  );
}

interface SegOption<T extends string> {
  value: T;
  label: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  options: SegOption<T>[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <div className="segmented" role="group" aria-label={ariaLabel}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          className={value === o.value ? "active" : ""}
          disabled={disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
