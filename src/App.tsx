import { useMemo, useState } from "react";
import "./styles.css";
import { useSpecimenStore } from "./lib/useSpecimenStore";
import { stageOf } from "./lib/utils";
import { IntakeForm } from "./components/IntakeForm";
import { Queue } from "./components/Queue";
import { CabinetRecords, LocationCard } from "./components/CabinetRecords";
import { SpecimenDetail } from "./components/SpecimenDetail";

interface Toast {
  id: number;
  msg: string;
  type: "ok" | "err";
}

function App() {
  const store = useSpecimenStore();
  const { specimens } = store;
  const [openId, setOpenId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = (msg: string, type: "ok" | "err" = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, type }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 3200);
  };

  const metrics = useMemo(() => {
    let waiting = 0;
    let ready = 0;
    let stored = 0;
    for (const s of specimens) {
      const stage = stageOf(s);
      if (stage === "waiting") waiting += 1;
      else if (stage === "ready") ready += 1;
      else stored += 1;
    }
    const sites = new Set(
      specimens.map((s) => s.location.trim()).filter(Boolean)
    ).size;
    return [
      { label: "入库队列", value: specimens.length },
      { label: "待处理（缺压制/鉴定）", value: waiting },
      { label: "待上柜（可分配柜位）", value: ready },
      { label: "已入库", value: stored },
      { label: "采集点", value: sites },
    ];
  }, [specimens]);

  const openSpecimen = openId
    ? specimens.find((s) => s.id === openId) ?? null
    : null;

  const readyCount = metrics[2].value;

  return (
    <main className="app">
      <section className="hero">
        <p>植物标本馆 · 压制标本入库工作台</p>
        <h1>标本入库办理台</h1>
        <span>
          录入采集号、物种、地点、海拔、生境、采集人与压制 / 鉴定状态；
          <strong>压制完成且鉴定通过</strong>后才能分配柜位。
          柜位占用互斥，未满足条件的记录保留在待处理队列并标明缺项，详情页保留历次变更。全部数据仅保存在本浏览器（localStorage）。
        </span>
      </section>

      <section className="metrics">
        {metrics.map((m) => (
          <article key={m.label}>
            <small>{m.label}</small>
            <strong>{m.value}</strong>
          </article>
        ))}
      </section>

      <div className="workspace">
        <div className="workspace-main">
          <Queue specimens={specimens} onOpen={setOpenId} />
        </div>
        <div className="workspace-side">
          <IntakeForm onSubmit={store.addSpecimen} />
        </div>
      </div>

      {readyCount > 0 && (
        <p className="global-hint">
          有 {readyCount} 份标本已满足上柜条件，请在队列中打开详情分配柜位。
        </p>
      )}

      <div className="lower-grid">
        <CabinetRecords specimens={specimens} onOpen={setOpenId} />
        <LocationCard specimens={specimens} />
      </div>

      <footer className="page-foot">
        <span>数据存储：浏览器 localStorage（键 herbarium-intake:v1），不上传服务器</span>
        <button
          onClick={() => {
            if (window.confirm("确定清空当前数据并恢复演示记录？此操作不可撤销。")) {
              store.resetAll();
              notify("已恢复演示数据", "ok");
            }
          }}
        >
          重置为演示数据
        </button>
      </footer>

      {openSpecimen && (
        <SpecimenDetail
          specimen={openSpecimen}
          all={specimens}
          actions={{
            editField: store.editField,
            setPress: store.setPress,
            setIden: store.setIden,
            assignCabinet: store.assignCabinet,
            releaseCabinet: store.releaseCabinet,
            removeSpecimen: store.removeSpecimen,
          }}
          onClose={() => setOpenId(null)}
          onDeleted={() => setOpenId(null)}
          notify={notify}
        />
      )}

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.msg}
          </div>
        ))}
      </div>
    </main>
  );
}

export default App;
