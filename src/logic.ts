import type { HistoryEntry, Specimen } from "./types";
import { IDENTIFY_LABEL, PRESS_LABEL } from "./types";
import { uid } from "./storage";

/** 办理入库（分配柜位）前检查缺项；返回缺失条件名称 */
export function missingRequirements(specimen: Specimen): string[] {
  const missing: string[] = [];
  if (specimen.press !== "done") missing.push("压制未完成");
  if (specimen.identify !== "passed") {
    missing.push(
      specimen.identify === "failed" ? "鉴定未通过" : "尚未完成鉴定",
    );
  }
  return missing;
}

/** 柜位是否已被其他标本占用 */
export function isCabinetOccupied(
  specimens: Specimen[],
  code: string,
  excludeId?: string,
): boolean {
  const normalized = code.trim().toUpperCase();
  return specimens.some(
    (s) =>
      s.id !== excludeId &&
      s.stage === "stored" &&
      s.locationCode.trim().toUpperCase() === normalized,
  );
}

export function nowEntry(action: string, detail: string): HistoryEntry {
  return { id: uid(), at: new Date().toISOString(), action, detail };
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function fieldSummary(s: Specimen): Array<[string, string]> {
  return [
    ["采集号", s.collectionNo],
    ["物种名称", s.species],
    ["采集地点", s.location],
    ["海拔", s.altitude || "—"],
    ["生境描述", s.habitat || "—"],
    ["采集人", s.collector],
    ["压制状态", PRESS_LABEL[s.press]],
    ["鉴定状态", IDENTIFY_LABEL[s.identify]],
    [
      "柜位",
      s.stage === "stored" && s.locationCode ? s.locationCode : "未分配",
    ],
  ];
}
