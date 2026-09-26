import { useState } from "react";
import type { IdentifyStatus, PressStatus, SpecimenInput } from "../types";

const EMPTY: SpecimenInput = {
  collectionNo: "",
  species: "",
  location: "",
  altitude: "",
  habitat: "",
  collector: "",
  press: "pending",
  identify: "unidentified",
};

interface Props {
  existingNos: string[];
  onCreate: (input: SpecimenInput) => void;
}

export default function EntryForm({ existingNos, onCreate }: Props) {
  const [form, setForm] = useState<SpecimenInput>(EMPTY);
  const [error, setError] = useState("");

  const set = <K extends keyof SpecimenInput>(key: K, value: SpecimenInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = () => {
    if (!form.collectionNo.trim()) return setError("请填写采集号");
    if (!form.species.trim()) return setError("请填写物种名称（可先填科属待定）");
    if (!form.location.trim()) return setError("请填写采集地点");
    if (!form.collector.trim()) return setError("请填写采集人");
    const dup = existingNos.some(
      (n) => n.trim().toUpperCase() === form.collectionNo.trim().toUpperCase(),
    );
    if (dup) return setError(`采集号 ${form.collectionNo} 已存在，不能重复登记`);
    onCreate({
      ...form,
      collectionNo: form.collectionNo.trim(),
      species: form.species.trim(),
      location: form.location.trim(),
      altitude: form.altitude.trim(),
      habitat: form.habitat.trim(),
      collector: form.collector.trim(),
    });
    setForm(EMPTY);
    setError("");
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>标本登记</p>
          <h2>新增压制标本</h2>
        </div>
      </div>

      <div className="field-grid">
        <label>
          <span>采集号 *</span>
          <input
            value={form.collectionNo}
            placeholder="如 HX-240618-05"
            onChange={(e) => set("collectionNo", e.target.value)}
          />
        </label>
        <label>
          <span>物种名称 *</span>
          <input
            value={form.species}
            placeholder="如 槭属待定 / 学名"
            onChange={(e) => set("species", e.target.value)}
          />
        </label>
        <label className="span-2">
          <span>采集地点 *</span>
          <input
            value={form.location}
            placeholder="省 / 市 / 县 / 小地名"
            onChange={(e) => set("location", e.target.value)}
          />
        </label>
        <label>
          <span>海拔</span>
          <input
            value={form.altitude}
            placeholder="如 1420 m"
            onChange={(e) => set("altitude", e.target.value)}
          />
        </label>
        <label>
          <span>采集人 *</span>
          <input
            value={form.collector}
            placeholder="姓名（多人用顿号分隔）"
            onChange={(e) => set("collector", e.target.value)}
          />
        </label>
        <label className="span-2">
          <span>生境描述</span>
          <input
            value={form.habitat}
            placeholder="如 落叶阔叶林下、阴湿沟谷"
            onChange={(e) => set("habitat", e.target.value)}
          />
        </label>
        <label>
          <span>压制状态</span>
          <select
            value={form.press}
            onChange={(e) => set("press", e.target.value as PressStatus)}
          >
            <option value="pending">未压制</option>
            <option value="done">压制完成</option>
          </select>
        </label>
        <label>
          <span>鉴定状态</span>
          <select
            value={form.identify}
            onChange={(e) => set("identify", e.target.value as IdentifyStatus)}
          >
            <option value="unidentified">待鉴定</option>
            <option value="passed">鉴定通过</option>
            <option value="failed">鉴定未通过</option>
          </select>
        </label>
      </div>

      {error && <p className="form-error">⚠ {error}</p>}
      <p className="form-hint">
        新记录一律先进入入库队列；仅当「压制完成 + 鉴定通过」后才能在详情中分配柜位、办理入库。
      </p>
      <div className="form-actions">
        <button className="primary" onClick={submit}>
          登记并入队
        </button>
      </div>
    </section>
  );
}
