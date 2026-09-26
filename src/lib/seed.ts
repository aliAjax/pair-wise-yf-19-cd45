import type { Specimen } from "../types";
import { uid } from "./utils";

// 首次打开时写入的演示数据，覆盖三种队列阶段
function buildSeed(): Specimen[] {
  const base = "2026-09-20T09:00:00.000Z";
  const make = (
    partial: Omit<
      Specimen,
      "id" | "history" | "createdAt" | "updatedAt"
    >,
    history: Specimen["history"],
    createdAt = base
  ): Specimen => ({
    id: uid(),
    createdAt,
    updatedAt: createdAt,
    ...partial,
    history,
  });

  return [
    make(
      {
        code: "HX-240615-01",
        species: "槭属待定（Acer sp.）",
        location: "湖北神农架 板仓乡 白沙沟",
        elevation: "1420 m",
        habitat: "落叶阔叶林下，阴湿沟边",
        collector: "李禾",
        press: "pressed",
        iden: "pending",
        cabinet: null,
      },
      [
        {
          id: uid(),
          time: base,
          action: "登记入库队列",
          detail: "压制完成，等待鉴定",
        },
      ]
    ),
    make(
      {
        code: "HX-240615-08",
        species: "蕨类（未定种）",
        location: "湖南壶瓶山 江坪河 阴坡",
        elevation: "980 m",
        habitat: "溪谷石缝，苔藓层厚",
        collector: "沈青",
        press: "pressed",
        iden: "passed",
        cabinet: null,
      },
      [
        { id: uid(), time: base, action: "登记入库队列" },
        {
          id: uid(),
          time: "2026-09-21T03:20:00.000Z",
          action: "鉴定通过",
          detail: "鉴定人：王鉴；可安排上柜",
        },
      ],
      "2026-09-19T08:10:00.000Z"
    ),
    make(
      {
        code: "HX-240616-03",
        species: "马兰 Aster indicus L.",
        location: "浙江天目山 禅源寺后山",
        elevation: "460 m",
        habitat: "路边荒坡，酸性砂壤",
        collector: "周远",
        press: "pressed",
        iden: "passed",
        cabinet: "B-12-04",
      },
      [
        { id: uid(), time: base, action: "登记入库队列" },
        {
          id: uid(),
          time: "2026-09-18T06:40:00.000Z",
          action: "鉴定通过",
          detail: "鉴定人：王鉴",
        },
        {
          id: uid(),
          time: "2026-09-22T02:15:00.000Z",
          action: "分配柜位",
          detail: "B-12-04",
        },
        { id: uid(), time: "2026-09-22T02:15:00.000Z", action: "标本入库" },
      ],
      "2026-09-17T07:30:00.000Z"
    ),
  ];
}

export const STORAGE_KEY = "herbarium-intake:v1";

export function loadSeed(): Specimen[] {
  return buildSeed();
}
