import { useState } from "react";
import type { IdenStatus, PressStatus, SpecimenDraft } from "../types";
import type { OpResult } from "../lib/useSpecimenStore";
import { Segmented } from "./StatusUI";

const EMPTY: SpecimenDraft = {
  code: "",
  species: "",
  location: "",
  elevation: "",
  habitat: "",
  collector: "",
  press: "pending",
  iden: "pending",
};

export function IntakeForm({
  onSubmit,
}: {
  onSubmit: (draft: SpecimenDraft) => OpResult;
}) {
  const [form, setForm] = useState<SpecimenDraft>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof SpecimenDraft>(
    key: K,
    value: SpecimenDraft[K]
  ) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (error) setError(null);
  };

  const handleSubmit = () => {
    const result = onSubmit(form);
    if (!result.ok) {
      setError(result.error ?? "保存失败");
      return;
    }
    setForm(EMPTY);
    setError(null);
  };

  return (
    <section className="panel form-panel">
      <div className="heading">
        <div>
          <p>标本登记</p>
          <h2>录入采集信息</h2>
        </div>
      </div>

      <div className="field-grid">
        <label className="required">
          <span>采集号</span>
          <input
            value={form.code}
            placeholder="如 HX-260926-01"
            onChange={(e) => set("code", e.target.value)}
          />
        </label>
        <label className="required">
          <span>物种名称</span>
          <input
            value={form.species}
            placeholder="中文名 / 拉丁名 / 待定类群"
            onChange={(e) => set("species", e.target.value)}
          />
        </label>
        <label className="wide">
          <span>采集地点</span>
          <input
            value={form.location}
            placeholder="省 / 保护区 / 小地点"
            onChange={(e) => set("location", e.target.value)}
          />
        </label>
        <label>
          <span>海拔</span>
          <input
            value={form.elevation}
            placeholder="如 1420 m"
            onChange={(e) => set("elevation", e.target.value)}
          />
        </label>
        <label>
          <span>采集人</span>
          <input
            value={form.collector}
            placeholder="采集人姓名"
            onChange={(e) => set("collector", e.target.value)}
          />
        </label>
        <label className="wide">
          <span>生境描述</span>
          <input
            value={form.habitat}
            placeholder="植被、坡向、土壤等"
            onChange={(e) => set("habitat", e.target.value)}
          />
        </label>

        <label>
          <span>压制状态</span>
          <Segmented<PressStatus>
            ariaLabel="压制状态"
            value={form.press}
            onChange={(v) => set("press", v)}
            options={[
              { value: "pending", label: "待压制" },
              { value: "pressed", label: "已压制" },
            ]}
          />
        </label>
        <label>
          <span>鉴定状态</span>
          <Segmented<IdenStatus>
            ariaLabel="鉴定状态"
            value={form.iden}
            onChange={(v) => set("iden", v)}
            options={[
              { value: "pending", label: "待鉴定" },
              { value: "passed", label: "鉴定通过" },
              { value: "rejected", label: "鉴定未通过" },
            ]}
          />
        </label>
      </div>

      <div className="cabinet-note">
        馆藏柜位不在登记环节填写：压制完成且鉴定通过后，在标本详情中办理上柜分配。
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="form-actions">
        <button className="primary" type="button" onClick={handleSubmit}>
          加入入库队列
        </button>
        <button
          type="button"
          onClick={() => {
            setForm(EMPTY);
            setError(null);
          }}
        >
          清空
        </button>
      </div>
    </section>
  );
}
