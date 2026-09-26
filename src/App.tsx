import { useMemo, useState } from "react";
import "./styles.css";
import type {
  IdentifyStatus,
  PressStatus,
  Specimen,
  SpecimenInput,
} from "./types";
import { createSpecimen, loadSpecimens, saveSpecimens } from "./storage";
import { nowEntry } from "./logic";
import EntryForm from "./components/EntryForm";
import Queue, { type FilterKey } from "./components/Queue";
import DetailModal from "./components/DetailModal";
import { IDENTIFY_LABEL, PRESS_LABEL } from "./types";

function App() {
  const [specimens, setSpecimens] = useState<Specimen[]>(() => loadSpecimens());
  const [filter, setFilter] = useState<FilterKey>("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const commit = (next: Specimen[]) => {
    setSpecimens(next);
    saveSpecimens(next);
  };

  const flash = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2600);
  };

  const patchOne = (id: string, fn: (s: Specimen) => Specimen) =>
    commit(specimens.map((s) => (s.id === id ? fn(s) : s)));

  const handleCreate = (input: SpecimenInput) => {
    const created = createSpecimen(input);
    commit([created, ...specimens]);
    flash(`已登记 ${created.collectionNo}，进入入库队列`);
  };

  const handleEditInfo = (id: string, patch: Partial<Specimen>) => {
    patchOne(id, (s) => {
      const changes = Object.entries(patch)
        .filter(([k, v]) => (s as unknown as Record<string, string>)[k] !== v)
        .map(
          ([k, v]) =>
            `${
              { species: "物种", location: "采集地点", altitude: "海拔", habitat: "生境", collector: "采集人" }[k] ?? k
            }改为「${v || "空"}」`,
        )
        .join("；");
      return {
        ...s,
        ...patch,
        updatedAt: new Date().toISOString(),
        history: changes
          ? [...s.history, nowEntry("修改信息", changes)]
          : s.history,
      };
    });
    flash("采集信息已更新并记入变更历史");
  };

  const handleSetPress = (id: string, press: PressStatus) => {
    patchOne(id, (s) => {
      if (s.press === press) return s;
      const detail =
        press === "done"
          ? "标本压制完成"
          : "压制状态回退为「未压制」";
      return {
        ...s,
        press,
        updatedAt: new Date().toISOString(),
        history: [...s.history, nowEntry("压制", detail)],
      };
    });
  };

  const handleSetIdentify = (id: string, identify: IdentifyStatus) => {
    patchOne(id, (s) => {
      if (s.identify === identify) return s;
      const detailMap: Record<IdentifyStatus, string> = {
        unidentified: "鉴定状态回退为「待鉴定」",
        passed: "鉴定通过",
        failed: "鉴定结果为「未通过」，需复检或重新鉴定",
      };
      return {
        ...s,
        identify,
        updatedAt: new Date().toISOString(),
        history: [...s.history, nowEntry("鉴定", detailMap[identify])],
      };
    });
  };

  const handleAssign = (id: string, code: string) => {
    patchOne(id, (s) => ({
      ...s,
      locationCode: code,
      stage: "stored",
      updatedAt: new Date().toISOString(),
      history: [
        ...s.history,
        nowEntry("上柜", `分配柜位 ${code}，办理入库`),
      ],
    }));
    flash(`已分配柜位 ${code}，标本办理入库`);
  };

  const handleRelease = (id: string) => {
    patchOne(id, (s) => ({
      ...s,
      locationCode: "",
      stage: "processing",
      updatedAt: new Date().toISOString(),
      history: [
        ...s.history,
        nowEntry("撤柜", `撤出柜位 ${s.locationCode}，退回待处理队列`),
      ],
    }));
    flash("已撤出柜位，退回待处理");
  };

  const stats = useMemo(() => {
    const stored = specimens.filter((s) => s.stage === "stored").length;
    const waitingIdentify = specimens.filter(
      (s) => s.stage === "processing" && s.identify === "unidentified",
    ).length;
    const ready = specimens.filter(
      (s) =>
        s.stage === "processing" &&
        s.press === "done" &&
        s.identify === "passed",
    ).length;
    const sites = new Set(
      specimens.map((s) => s.location.trim()).filter(Boolean),
    ).size;
    return {
      queue: specimens.filter((s) => s.stage === "processing").length,
      waitingIdentify,
      ready,
      stored,
      sites,
    };
  }, [specimens]);

  const cabinets = useMemo(
    () =>
      specimens
        .filter((s) => s.stage === "stored" && s.locationCode)
        .sort((a, b) => a.locationCode.localeCompare(b.locationCode)),
    [specimens],
  );

  const openSpecimen = specimens.find((s) => s.id === openId) ?? null;

  return (
    <main className="app">
      <section className="hero">
        <p>植物标本馆 · 压制标本入库工作台</p>
        <h1>压制标本入库</h1>
        <span>
          登记采集信息并入队；标本须压制完成且鉴定通过后才能分配柜位、办理入库。柜位唯一不重复，详情保留历次变更，数据仅保存在本机浏览器。
        </span>
      </section>

      <section className="metrics">
        <article>
          <small>入库队列（待处理）</small>
          <strong>{stats.queue}</strong>
        </article>
        <article>
          <small>待鉴定</small>
          <strong>{stats.waitingIdentify}</strong>
        </article>
        <article>
          <small>待上柜（条件齐备）</small>
          <strong>{stats.ready}</strong>
        </article>
        <article>
          <small>已上柜 / 采集点</small>
          <strong>
            {stats.stored}
            <em> / {stats.sites}</em>
          </strong>
        </article>
      </section>

      <section className="workspace">
        <aside className="panel side-panel">
          <h2>馆藏柜位记录</h2>
          <p className="side-hint">柜位与标本一一对应，已占用柜位不能再次分配。</p>
          {cabinets.length === 0 ? (
            <p className="empty">暂无已上柜标本。</p>
          ) : (
            <ul className="cabinet-list">
              {cabinets.map((s) => (
                <li key={s.id} onClick={() => setOpenId(s.id)}>
                  <b>{s.locationCode}</b>
                  <span>
                    {s.collectionNo} · {s.species}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <h2 className="side-gap">采集地点</h2>
          <ul className="site-list">
            {Object.values(
              specimens.reduce<
                Record<string, { name: string; count: number; sample: Specimen }>
              >((acc, s) => {
                const key = s.location.trim();
                if (!key) return acc;
                if (!acc[key]) acc[key] = { name: key, count: 0, sample: s };
                acc[key].count += 1;
                return acc;
              }, {}),
            )
              .sort((a, b) => b.count - a.count)
              .map((g) => (
                <li
                  key={g.name}
                  onClick={() => setOpenId(g.sample.id)}
                  className="site-card"
                >
                  <b>{g.name}</b>
                  <span>
                    {g.sample.altitude || "海拔未填"} · {g.count} 份
                    {g.sample.habitat ? ` · ${g.sample.habitat}` : ""}
                  </span>
                </li>
              ))}
          </ul>
        </aside>

        <div className="main-col">
          <EntryForm
            existingNos={specimens.map((s) => s.collectionNo)}
            onCreate={handleCreate}
          />
          <div className="queue-wrap">
            <Queue
              specimens={specimens}
              filter={filter}
              onFilterChange={setFilter}
              onOpen={setOpenId}
            />
          </div>
        </div>
      </section>

      <footer className="data-note">
        数据仅存储于当前浏览器 localStorage；清除浏览器数据将丢失全部记录。
        当前压制状态口径：{PRESS_LABEL.done}；鉴定口径：
        {IDENTIFY_LABEL.passed}。
      </footer>

      {openSpecimen && (
        <DetailModal
          specimen={openSpecimen}
          allSpecimens={specimens}
          onClose={() => setOpenId(null)}
          onEditInfo={handleEditInfo}
          onSetPress={handleSetPress}
          onSetIdentify={handleSetIdentify}
          onAssign={handleAssign}
          onRelease={handleRelease}
        />
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

export default App;
