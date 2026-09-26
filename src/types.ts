// 压制状态：待压制 / 已压制
export type PressStatus = "pending" | "pressed";

// 鉴定状态：待鉴定 / 鉴定通过 / 鉴定未通过
export type IdenStatus = "pending" | "passed" | "rejected";

// 队列阶段：待处理（压制或鉴定未完成）/ 待上柜（条件齐备）/ 已入库（已分配柜位）
export type Stage = "waiting" | "ready" | "stored";

export interface HistoryEntry {
  id: string;
  time: string;
  action: string;
  detail?: string;
}

export interface Specimen {
  id: string;
  code: string; // 采集号
  species: string; // 物种名称
  location: string; // 采集地点
  elevation: string; // 海拔
  habitat: string; // 生境描述
  collector: string; // 采集人
  press: PressStatus; // 压制状态
  iden: IdenStatus; // 鉴定状态
  cabinet: string | null; // 馆藏柜位
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
}

export type SpecimenDraft = Pick<
  Specimen,
  | "code"
  | "species"
  | "location"
  | "elevation"
  | "habitat"
  | "collector"
  | "press"
  | "iden"
>;

export const PRESS_LABEL: Record<PressStatus, string> = {
  pending: "待压制",
  pressed: "已压制",
};

export const IDEN_LABEL: Record<IdenStatus, string> = {
  pending: "待鉴定",
  passed: "鉴定通过",
  rejected: "鉴定未通过",
};

export const STAGE_LABEL: Record<Stage, string> = {
  waiting: "待处理",
  ready: "待上柜",
  stored: "已入库",
};

export const STAGE_HINT: Record<Stage, string> = {
  waiting: "压制或鉴定尚未完成，保留在待处理队列",
  ready: "压制完成且鉴定通过，可分配柜位",
  stored: "柜位已分配，标本入库",
};
