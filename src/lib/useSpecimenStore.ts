import { useCallback, useEffect, useState } from "react";
import type {
  HistoryEntry,
  IdenStatus,
  PressStatus,
  Specimen,
  SpecimenDraft,
} from "../types";
import {
  isCabinetTaken,
  missingConditions,
  normalizeCabinet,
  now,
  occupiedBy,
  uid,
} from "./utils";
import { STORAGE_KEY, loadSeed } from "./seed";

export interface OpResult {
  ok: boolean;
  error?: string;
}

function loadInitial(): Specimen[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Specimen[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // 存储损坏时回退到演示数据
  }
  return loadSeed();
}

function entry(action: string, detail?: string): HistoryEntry {
  return { id: uid(), time: now(), action, detail };
}

export function useSpecimenStore() {
  const [specimens, setSpecimens] = useState<Specimen[]>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(specimens));
    } catch {
      // 存储空间不足等异常时仅保留内存状态
    }
  }, [specimens]);

  const addSpecimen = useCallback(
    (draft: SpecimenDraft): OpResult => {
      const code = draft.code.trim();
      const species = draft.species.trim();
      if (!code) return { ok: false, error: "请填写采集号" };
      if (!species) return { ok: false, error: "请填写物种名称" };

      const dup = specimens.some((s) => s.code.trim() === code);
      if (dup) return { ok: false, error: `采集号 ${code} 已存在，不能重复登记` };

      const ts = now();
      const record: Specimen = {
        id: uid(),
        code,
        species,
        location: draft.location.trim(),
        elevation: draft.elevation.trim(),
        habitat: draft.habitat.trim(),
        collector: draft.collector.trim(),
        press: draft.press,
        iden: draft.iden,
        cabinet: null, // 柜位只能在上柜环节分配，登记时不入库
        createdAt: ts,
        updatedAt: ts,
        history: [
          entry(
            "登记入库队列",
            `压制：${draft.press === "pressed" ? "已压制" : "待压制"}；鉴定：${
              draft.iden === "passed"
                ? "鉴定通过"
                : draft.iden === "rejected"
                ? "鉴定未通过"
                : "待鉴定"
            }`
          ),
        ],
      };
      setSpecimens((prev) => [record, ...prev]);
      return { ok: true };
    },
    [specimens]
  );

  const patchSpecimen = useCallback(
    (id: string, patch: Partial<Specimen>, note: string, detail?: string) => {
      setSpecimens((prev) =>
        prev.map((s) =>
          s.id === id
            ? {
                ...s,
                ...patch,
                updatedAt: now(),
                history: [entry(note, detail), ...s.history],
              }
            : s
        )
      );
    },
    []
  );

  const editField = useCallback(
    (
      id: string,
      field: keyof Pick<
        Specimen,
        "code" | "species" | "location" | "elevation" | "habitat" | "collector"
      >,
      value: string
    ): OpResult => {
      const trimmed = value.trim();
      if ((field === "code" || field === "species") && !trimmed) {
        return { ok: false, error: field === "code" ? "采集号不能为空" : "物种名称不能为空" };
      }
      if (field === "code") {
        const dup = specimens.some(
          (s) => s.id !== id && s.code.trim() === trimmed
        );
        if (dup)
          return { ok: false, error: `采集号 ${trimmed} 已被其他记录占用` };
      }
      const current = specimens.find((s) => s.id === id);
      if (!current) return { ok: false, error: "记录不存在" };
      const labels: Record<string, string> = {
        code: "采集号",
        species: "物种名称",
        location: "采集地点",
        elevation: "海拔",
        habitat: "生境描述",
        collector: "采集人",
      };
      patchSpecimen(
        id,
        { [field]: trimmed } as Partial<Specimen>,
        `修改${labels[field]}`,
        `${current[field] || "（空）"} → ${trimmed || "（空）"}`
      );
      return { ok: true };
    },
    [specimens, patchSpecimen]
  );

  const setPress = useCallback(
    (id: string, press: PressStatus): OpResult => {
      const s = specimens.find((x) => x.id === id);
      if (!s) return { ok: false, error: "记录不存在" };
      if (s.press === press) return { ok: true };
      // 已入库标本不允许回退流程状态，避免“占着柜位却条件不满足”
      if (s.cabinet && press === "pending")
        return { ok: false, error: "标本已入库，不能将压制状态回退为待压制" };
      patchSpecimen(
        id,
        { press },
        press === "pressed" ? "压制完成" : "压制状态改回待压制"
      );
      return { ok: true };
    },
    [specimens, patchSpecimen]
  );

  const setIden = useCallback(
    (id: string, iden: IdenStatus): OpResult => {
      const s = specimens.find((x) => x.id === id);
      if (!s) return { ok: false, error: "记录不存在" };
      if (s.iden === iden) return { ok: true };
      if (s.cabinet && iden !== "passed")
        return {
          ok: false,
          error: "标本已入库占用柜位，不能将鉴定状态改为未通过或待鉴定",
        };
      const label =
        iden === "passed"
          ? "鉴定通过"
          : iden === "rejected"
          ? "鉴定未通过"
          : "鉴定状态改回待鉴定";
      patchSpecimen(id, { iden }, label);
      return { ok: true };
    },
    [specimens, patchSpecimen]
  );

  /** 分配 / 调整柜位：必须压制完成且鉴定通过，且柜位未被其他标本占用 */
  const assignCabinet = useCallback(
    (id: string, cabinet: string): OpResult => {
      const s = specimens.find((x) => x.id === id);
      if (!s) return { ok: false, error: "记录不存在" };
      const code = cabinet.trim();
      if (!code) return { ok: false, error: "请填写柜位编号" };

      const missing = missingConditions(s);
      if (missing.length > 0)
        return {
          ok: false,
          error: `暂不能分配柜位，缺项：${missing.join("、")}。记录保留待处理。`,
        };

      if (isCabinetTaken(specimens, code, id)) {
        const holder = occupiedBy(specimens, code, id);
        return {
          ok: false,
          error: `柜位 ${normalizeCabinet(code)} 已被 ${
            holder?.code ?? "其他标本"
          } 占用，不能重复分配`,
        };
      }

      const isStore = !s.cabinet;
      setSpecimens((prev) =>
        prev.map((x) => {
          if (x.id !== id) return x;
          const history = [
            ...(isStore
              ? [entry("标本入库")]
              : []),
            entry(
              isStore ? "分配柜位" : "调整柜位",
              isStore ? code : `${x.cabinet} → ${code}`
            ),
            ...x.history,
          ];
          return { ...x, cabinet: code, updatedAt: now(), history };
        })
      );
      return { ok: true };
    },
    [specimens]
  );

  const releaseCabinet = useCallback(
    (id: string): OpResult => {
      const s = specimens.find((x) => x.id === id);
      if (!s) return { ok: false, error: "记录不存在" };
      if (!s.cabinet) return { ok: false, error: "该标本尚未分配柜位" };
      const old = s.cabinet;
      setSpecimens((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                cabinet: null,
                updatedAt: now(),
                history: [
                  entry("撤出柜位", `释放柜位 ${old}，退回待上柜队列`),
                  ...x.history,
                ],
              }
            : x
        )
      );
      return { ok: true };
    },
    [specimens]
  );

  const removeSpecimen = useCallback(
    (id: string): OpResult => {
      const s = specimens.find((x) => x.id === id);
      if (!s) return { ok: false, error: "记录不存在" };
      setSpecimens((prev) => prev.filter((x) => x.id !== id));
      return { ok: true };
    },
    [specimens]
  );

  const resetAll = useCallback(() => {
    setSpecimens(loadSeed());
  }, []);

  return {
    specimens,
    addSpecimen,
    editField,
    setPress,
    setIden,
    assignCabinet,
    releaseCabinet,
    removeSpecimen,
    resetAll,
  };
}
