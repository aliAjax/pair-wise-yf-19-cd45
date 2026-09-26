export type PressStatus = "pending" | "done";
export type IdentifyStatus = "unidentified" | "passed" | "failed";
export type Stage = "processing" | "stored";

export interface HistoryEntry {
  id: string;
  at: string;
  action: string;
  detail: string;
}

export interface Specimen {
  id: string;
  collectionNo: string;
  species: string;
  location: string;
  altitude: string;
  habitat: string;
  collector: string;
  press: PressStatus;
  identify: IdentifyStatus;
  /** 柜位编号；未分配时为 "" */
  locationCode: string;
  stage: Stage;
  createdAt: string;
  updatedAt: string;
  history: HistoryEntry[];
}

export interface SpecimenInput {
  collectionNo: string;
  species: string;
  location: string;
  altitude: string;
  habitat: string;
  collector: string;
  press: PressStatus;
  identify: IdentifyStatus;
}

export const PRESS_LABEL: Record<PressStatus, string> = {
  pending: "未压制",
  done: "压制完成",
};

export const IDENTIFY_LABEL: Record<IdentifyStatus, string> = {
  unidentified: "待鉴定",
  passed: "鉴定通过",
  failed: "鉴定未通过",
};

export const STAGE_LABEL: Record<Stage, string> = {
  processing: "待处理",
  stored: "已入库",
};
