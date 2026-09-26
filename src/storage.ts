import type { Specimen, SpecimenInput } from "./types";

const STORAGE_KEY = "herbarium-intake-v1";

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function iso(offsetMinutes = 0): string {
  return new Date(Date.now() + offsetMinutes * 60000).toISOString();
}

function makeSeed(
  no: string,
  species: string,
  location: string,
  altitude: string,
  habitat: string,
  collector: string,
  press: Specimen["press"],
  identify: Specimen["identify"],
  code: string,
  offset: number,
  actions: Array<[string, string]>,
): Specimen {
  const created = iso(offset);
  return {
    id: uid(),
    collectionNo: no,
    species,
    location,
    altitude,
    habitat,
    collector,
    press,
    identify,
    locationCode: code,
    stage: code ? "stored" : "processing",
    createdAt: created,
    updatedAt: iso(-2),
    history: actions.map(([action, detail], i) => ({
      id: uid(),
      at: iso(offset + i + 1),
      action,
      detail,
    })),
  };
}

export function seedSpecimens(): Specimen[] {
  return [
    makeSeed(
      "HX-240616-03",
      "蒲公英（Taraxacum mongolicum）",
      "北京市门头沟区东灵山北坡",
      "1280 m",
      "山坡路边草地，伴生蒿属植物",
      "王立群",
      "done",
      "passed",
      "B-12-04",
      -4200,
      [
        ["登记", "新建入库记录"],
        ["压制", "压制完成"],
        ["鉴定", "鉴定通过：蒲公英（Taraxacum mongolicum）"],
        ["上柜", "分配柜位 B-12-04，办理入库"],
      ],
    ),
    makeSeed(
      "HX-240615-01",
      "槭属待定（Acer sp.）",
      "河北省兴隆县雾灵山",
      "1420 m",
      "落叶阔叶林下，土壤湿润",
      "李闻璟",
      "done",
      "unidentified",
      "",
      -3000,
      [
        ["登记", "新建入库记录"],
        ["压制", "压制完成，等待鉴定"],
      ],
    ),
    makeSeed(
      "HX-240615-08",
      "蕨类（未定名）",
      "北京市怀柔区喇叭沟门阴湿沟谷",
      "860 m",
      "沟谷溪边，阴湿，腐殖质丰富",
      "陈默",
      "done",
      "passed",
      "",
      -1800,
      [
        ["登记", "新建入库记录"],
        ["压制", "压制完成"],
        ["鉴定", "鉴定通过（属种待补），可分配柜位"],
      ],
    ),
    makeSeed(
      "HX-240617-02",
      "未知草本",
      "天津市蓟州区八仙山",
      "610 m",
      "林缘",
      "赵一帆",
      "pending",
      "unidentified",
      "",
      -600,
      [["登记", "新建入库记录，标本尚在压制中"]],
    ),
  ];
}

export function loadSpecimens(): Specimen[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedSpecimens();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as Specimen[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveSpecimens(specimens: Specimen[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(specimens));
}

export function createSpecimen(input: SpecimenInput): Specimen {
  const now = new Date().toISOString();
  return {
    id: uid(),
    collectionNo: input.collectionNo,
    species: input.species,
    location: input.location,
    altitude: input.altitude,
    habitat: input.habitat,
    collector: input.collector,
    press: input.press,
    identify: input.identify,
    locationCode: "",
    stage: "processing",
    createdAt: now,
    updatedAt: now,
    history: [
      {
        id: uid(),
        at: now,
        action: "登记",
        detail: `新建入库记录；压制状态与鉴定状态按录入保存，等待办理入库`,
      },
    ],
  };
}
