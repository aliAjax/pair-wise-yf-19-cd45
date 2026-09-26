import type { Specimen, Stage } from "../types";

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  ).toUpperCase();
}

export function now(): string {
  return new Date().toISOString();
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** 柜位码归一化：去除首尾空白，柜位比较不区分大小写与内部空格差异 */
export function normalizeCabinet(value: string): string {
  return value.trim().replace(/\s+/g, "").toUpperCase();
}

/** 距分配柜位仍缺少的条件；返回空数组表示条件齐备 */
export function missingConditions(s: Specimen): string[] {
  const missing: string[] = [];
  if (s.press !== "pressed") missing.push("压制未完成");
  if (s.iden === "pending") missing.push("鉴定尚未完成");
  if (s.iden === "rejected") missing.push("鉴定未通过");
  return missing;
}

export function canAssign(s: Specimen): boolean {
  return missingConditions(s).length === 0;
}

export function stageOf(s: Specimen): Stage {
  if (s.cabinet) return "stored";
  return canAssign(s) ? "ready" : "waiting";
}

export function isCabinetTaken(
  specimens: Specimen[],
  cabinet: string,
  selfId?: string
): boolean {
  const target = normalizeCabinet(cabinet);
  return specimens.some(
    (s) =>
      s.cabinet !== null &&
      s.id !== selfId &&
      normalizeCabinet(s.cabinet) === target
  );
}

export function occupiedBy(
  specimens: Specimen[],
  cabinet: string,
  selfId?: string
): Specimen | undefined {
  const target = normalizeCabinet(cabinet);
  return specimens.find(
    (s) =>
      s.cabinet !== null &&
      s.id !== selfId &&
      normalizeCabinet(s.cabinet) === target
  );
}

/** 列出当前所有已占用柜位（按名称排序） */
export function occupiedCabinets(specimens: Specimen[]): Specimen[] {
  return specimens
    .filter((s) => s.cabinet !== null)
    .sort((a, b) =>
      normalizeCabinet(a.cabinet ?? "").localeCompare(
        normalizeCabinet(b.cabinet ?? ""),
        "zh-CN"
      )
    );
}
