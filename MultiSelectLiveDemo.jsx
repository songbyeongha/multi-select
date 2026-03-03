import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import _ from "lodash";

/* ══════════════════════════════════════
   Example Data Generator
   ══════════════════════════════════════ */
const TEAMS = ["개발팀","디자인팀","기획팀","마케팅팀","인사팀","재무팀","영업팀","QA팀","데이터팀","보안팀","인프라팀","CS팀"];
const RANKS = ["사원","대리","과장","차장","부장","이사"];
const LAST = ["김","이","박","최","정","강","조","윤","임","한","신","오","배","송","류","문","황","전","안","권","홍","서","양","장","노","엄","하","구","남","유"];
const FIRST = ["민수","서연","지훈","유진","현우","수빈","민재","하은","도현","채원","재혁","지민","수호","예린","태양","서윤","준영","다은","시우","나연","성민","유나","현석","미래","진우","소희","동윤","해린","기태","지안"];
const TECHS = ["React","TypeScript","Python","Go","Rust","Java","Kotlin","Swift","C++","Ruby","Next.js","Vue.js","Angular","Svelte","Django","FastAPI","Spring Boot","Express.js","NestJS","Flask","PostgreSQL","MongoDB","Redis","Elasticsearch","Docker","Kubernetes","Terraform","AWS","GCP","Azure","TensorFlow","PyTorch","LangChain","Spark","Kafka"];
const CATS = ["Frontend","Backend","Database","DevOps","AI/ML","Data","Mobile","Security","Cloud","Platform"];
const AREAS = ["서울 강남구","서울 서초구","서울 마포구","서울 용산구","서울 성동구","서울 종로구","서울 송파구","경기 성남시","경기 수원시","경기 고양시","경기 용인시","경기 화성시","부산 해운대구","부산 수영구","인천 연수구","인천 서구","대전 유성구","대구 수성구","광주 동구","제주 제주시"];
const STREETS = ["삼성동","방배동","상암동","이태원동","성수동","삼청동","잠실동","판교","영통구","일산","수지구","동탄","마린시티","광안리","송도","청라","대학로","범어동","충장로","연동"];

function generateData(count) {
  const data = [];
  for (let i = 0; i < count; i++) {
    const cat = i % 4;
    if (cat === 0) {
      const ln = LAST[i % LAST.length];
      const fn = FIRST[Math.floor(i / LAST.length) % FIRST.length];
      data.push({
        value: `item_${i}`,
        label: `${ln}${fn} — ${TEAMS[i % TEAMS.length]} ${RANKS[i % RANKS.length]}`,
      });
    } else if (cat === 1) {
      const prefix = ["차세대","AI","클라우드","모바일","데이터","보안","통합","자동화","실시간","블록체인"][i % 10];
      const suffix = ["플랫폼","서비스","시스템","파이프라인","인프라","앱","포털","엔진","프레임워크","모듈"][Math.floor(i/10) % 10];
      data.push({
        value: `item_${i}`,
        label: `${prefix} ${suffix} 프로젝트 v${(i % 5) + 1}.${i % 10} (${2024 + Math.floor(i/100)}-Q${(i%4)+1})`,
      });
    } else if (cat === 2) {
      data.push({
        value: `item_${i}`,
        label: `${TECHS[i % TECHS.length]} — ${CATS[i % CATS.length]}`,
      });
    } else {
      data.push({
        value: `item_${i}`,
        label: `${AREAS[i % AREAS.length]} ${STREETS[i % STREETS.length]}`,
      });
    }
  }
  return data;
}

/* ── Colors ── */
const C = {
  pri: "#3B82F6", priB: "#BFDBFE", priL: "#EFF6FF",
  bdr: "#D1D5DB", bg: "#fff", bgH: "#F3F4F6", bgS: "#EFF6FF",
  txt: "#111827", txtS: "#6B7280", txtP: "#9CA3AF",
  tagBg: "#E0E7FF", tagTxt: "#3730A3", tagX: "#818CF8",
  cntBg: "#3B82F6", cntTxt: "#fff", chk: "#3B82F6", div: "#F3F4F6",
  tipBg: "#1F2937", tipTxt: "#fff",
};

/* ── SVG Icons ── */
const Chevron = ({ open }) => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor"
    style={{ transition: "transform .2s", transform: open ? "rotate(180deg)" : "", color: C.txtS, flexShrink: 0 }}>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 20 20" fill={C.txtS}>
    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
  </svg>
);
const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill={C.chk}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

/* ══════════════════════════════════════
   useVirtualScroll Hook
   ══════════════════════════════════════ */
function useVirtualScroll({ totalCount, itemHeight, containerHeight, overscan, scrollTop }) {
  return useMemo(() => {
    if (totalCount === 0) return { startIndex: 0, endIndex: 0, totalHeight: 0, offsetY: 0 };
    const totalHeight = totalCount * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    let startIndex = Math.floor(scrollTop / itemHeight) - overscan;
    startIndex = Math.max(0, startIndex);
    let endIndex = startIndex + visibleCount + overscan * 2;
    endIndex = Math.min(totalCount, endIndex);
    const offsetY = startIndex * itemHeight;
    return { startIndex, endIndex, totalHeight, offsetY };
  }, [totalCount, itemHeight, containerHeight, overscan, scrollTop]);
}

/* ══════════════════════════════════════
   MultiSelect (with Virtual Scroll)
   ══════════════════════════════════════ */
function MultiSelect({
  width = 360, placeholder = "선택하세요", fetchItems, pageSize = 20,
  value: ctrlVal, onChange, disabled = false,
  itemHeight = 36, listHeight = 260, overscan = 5,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [allLoaded, setAllLoaded] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hIdx, setHIdx] = useState(-1);
  const [intVal, setIntVal] = useState([]);
  const sel = ctrlVal !== undefined ? ctrlVal : intVal;
  const [tip, setTip] = useState({ t: "", r: null, sticky: false });
  const [measuredCount, setMeasuredCount] = useState(null);
  const [scrollTop, setScrollTop] = useState(0);

  const offRef = useRef(0);
  const wrapRef = useRef(null);
  const listRef = useRef(null);
  const searchRef = useRef(null);
  const tipTimer = useRef(null);
  const tipHideTimer = useRef(null);
  const initRef = useRef(false);
  const loadingRef = useRef(false);
  const boxRef = useRef(null);
  const measureRef = useRef(null);

  const upd = useCallback(n => { if (ctrlVal === undefined) setIntVal(n); if (onChange) onChange(n); }, [ctrlVal, onChange]);

  // Virtual Scroll
  const { startIndex, endIndex, totalHeight, offsetY } = useVirtualScroll({
    totalCount: items.length, itemHeight, containerHeight: listHeight, overscan, scrollTop,
  });
  const visibleItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex]);

  // Data loading
  const load = useCallback(async (off, s, reset) => {
    if (loadingRef.current || !fetchItems) return;
    loadingRef.current = true; setLoading(true);
    try {
      const res = await fetchItems(off, pageSize, s);
      const ni = res.items || [];
      setItems(p => reset ? ni : [...p, ...ni]);
      setHasMore(res.hasMore !== false && ni.length >= pageSize);
      offRef.current = reset ? ni.length : off + ni.length;
      setAllLoaded(p => { const m = new Map(p.map(i => [i.value, i])); ni.forEach(i => m.set(i.value, i)); return Array.from(m.values()); });
    } catch (e) { console.error(e); }
    finally { setLoading(false); loadingRef.current = false; }
  }, [fetchItems, pageSize]);

  useEffect(() => { if (!initRef.current && fetchItems) { initRef.current = true; load(0, "", true); } }, [fetchItems]);

  const dbSearch = useMemo(() => _.debounce(t => {
    offRef.current = 0; setHasMore(true); setScrollTop(0);
    if (listRef.current) listRef.current.scrollTop = 0;
    load(0, t, true);
  }, 300), [load]);
  useEffect(() => () => dbSearch.cancel(), [dbSearch]);
  const onSearch = e => { setSearch(e.target.value); dbSearch(e.target.value); };

  const toggle = () => {
    if (disabled) return;
    setIsOpen(p => {
      if (!p) { setSearch(""); setScrollTop(0); offRef.current = 0; setHasMore(true); load(0, "", true); setTimeout(() => searchRef.current?.focus(), 60); }
      return !p;
    });
  };

  useEffect(() => {
    const h = e => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleScroll = useCallback(e => {
    const el = e.target;
    setScrollTop(el.scrollTop);
    if (!loadingRef.current && hasMore && el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
      load(offRef.current, search, false);
    }
  }, [hasMore, load, search]);

  const toggleItem = v => upd(sel.includes(v) ? sel.filter(x => x !== v) : [...sel, v]);
  const selAll = () => upd(_.uniq([...sel, ...items.map(i => i.value)]));
  const deselAll = () => { const cur = new Set(items.map(i => i.value)); upd(sel.filter(v => !cur.has(v))); };

  const labelMap = useMemo(() => { const m = new Map(); allLoaded.forEach(i => m.set(i.value, i)); return m; }, [allLoaded]);
  const getL = v => labelMap.get(v)?.label || String(v);

  const showTip = (t, e, sticky = false) => {
    const r = e.currentTarget.getBoundingClientRect();
    clearTimeout(tipTimer.current);
    clearTimeout(tipHideTimer.current);
    tipTimer.current = setTimeout(() => setTip({ t, r, sticky }), 800);
  };
  const hideTip = () => {
    clearTimeout(tipTimer.current);
    clearTimeout(tipHideTimer.current);
    tipHideTimer.current = setTimeout(() => {
      setTip({ t: "", r: null, sticky: false });
    }, 200);
  };
  const hideTipNow = () => {
    clearTimeout(tipTimer.current);
    clearTimeout(tipHideTimer.current);
    setTip({ t: "", r: null, sticky: false });
  };
  const onTipEnter = () => {
    clearTimeout(tipTimer.current);
    clearTimeout(tipHideTimer.current);
  };
  const onTipLeave = () => {
    clearTimeout(tipHideTimer.current);
    tipHideTimer.current = setTimeout(() => {
      setTip({ t: "", r: null, sticky: false });
    }, 150);
  };

  // +N 태그 전용 툴팁: 스타일된 리스트 JSX
  const getHiddenTip = () => {
    const hiddenItems = sel.slice(visCount);
    const MAX_SHOW = 15;
    const showItems = hiddenItems.slice(0, MAX_SHOW);
    const moreCount = hiddenItems.length - MAX_SHOW;
    return (
      <div style={{ minWidth: 160, maxWidth: 280 }}>
        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6, paddingBottom: 5, borderBottom: "1px solid #334155", fontWeight: 600 }}>
          선택된 항목 +{hiddenItems.length}
        </div>
        <div style={{ maxHeight: 200, overflowY: "auto" }}>
          {showItems.map((v, i) => (
            <div key={v} style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0", fontSize: 12, lineHeight: 1.4 }}>
              <span style={{ color: "#64748B", fontSize: 10, minWidth: 18, textAlign: "right", flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getL(v)}</span>
            </div>
          ))}
        </div>
        {moreCount > 0 && (
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 5, paddingTop: 5, borderTop: "1px solid #334155" }}>
            외 {moreCount}개 더...
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    if (sel.length === 0) { setMeasuredCount(null); return; }
    const raf = requestAnimationFrame(() => {
      const container = measureRef.current;
      const boxEl = boxRef.current;
      if (!container || !boxEl) return;
      const boxWidth = boxEl.clientWidth - 26;
      const children = container.children;
      const gap = 4;
      const counterW = 38;
      const minTagW = 70;

      const naturalWidths = [];
      for (let i = 0; i < children.length; i++) {
        naturalWidths.push(children[i].offsetWidth);
      }

      let bestCount = 0;
      for (let n = 1; n <= naturalWidths.length; n++) {
        const remaining = sel.length - n;
        const needCounter = remaining > 0;
        const reserved = (needCounter ? counterW + gap : 0) + (n - 1) * gap;
        const availForTags = boxWidth - reserved;
        if (availForTags <= 0) break;
        const totalMin = n * minTagW;
        if (totalMin > availForTags) break;
        bestCount = n;
      }

      setMeasuredCount(Math.max(bestCount, 1));
    });
    return () => cancelAnimationFrame(raf);
  }, [sel, width]);

  const visCount = measuredCount !== null ? measuredCount : sel.length;
  const visTags = sel.slice(0, visCount);
  const hiddenN = sel.length - visTags.length;
  const rW = typeof width === "number" ? `${width}px` : width;
  const removeTag = (v, e) => { e.stopPropagation(); upd(sel.filter(x => x !== v)); };
  const loaderH = loading ? 36 : 0;

  return (
    <div ref={wrapRef} style={{ position: "relative", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize: 14, width: rW }}>
      <style>{`
        @keyframes msddi{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes msbn{0%,80%,100%{transform:scale(0)}40%{transform:scale(1)}}
        .ms-vs::-webkit-scrollbar{width:6px}
        .ms-vs::-webkit-scrollbar-track{background:#f9fafb}
        .ms-vs::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:3px}
        .ms-vs::-webkit-scrollbar-thumb:hover{background:#9ca3af}
      `}</style>

      {sel.length > 0 && (
        <div ref={measureRef} aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, visibility: "hidden", pointerEvents: "none", display: "flex", flexWrap: "nowrap", gap: 4, height: 0, overflow: "hidden" }}>
          {sel.map(v => (
            <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 4px 2px 8px", borderRadius: 0, background: C.tagBg, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap" }}>
              <span>{getL(v)}</span><span style={{ width: 18 }}>×</span>
            </span>
          ))}
        </div>
      )}

      {/* Select Box */}
      <div ref={boxRef} role="combobox" tabIndex={disabled ? -1 : 0} onClick={toggle}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } if (e.key === "Escape") setIsOpen(false); }}
        style={{
          display: "flex", alignItems: "center", gap: 4, minHeight: 40, padding: "5px 8px 5px 6px",
          border: `1.5px solid ${isOpen ? C.pri : C.bdr}`, borderRadius: 0,
          background: disabled ? "#F9FAFB" : C.bg, cursor: disabled ? "not-allowed" : "pointer",
          transition: "all .2s", boxShadow: isOpen ? `0 0 0 3px ${C.priB}` : "none",
          opacity: disabled ? 0.55 : 1, outline: "none", userSelect: "none", overflow: "hidden",
        }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 4, overflow: "hidden", minWidth: 0 }}>
          {sel.length === 0 && <span style={{ color: C.txtP, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{placeholder}</span>}
          {sel.length > 0 && visTags.map(v => (
            <span key={v} style={{ display: "inline-flex", alignItems: "center", gap: 3, padding: "2px 4px 2px 8px", borderRadius: 0, background: C.tagBg, color: C.tagTxt, fontSize: 12, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", flex: "0 1 auto", minWidth: 0 }}
              onMouseEnter={e => showTip(getL(v), e)} onMouseLeave={hideTip}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>{getL(v)}</span>
              <button onClick={e => removeTag(v, e)}
                style={{ border: "none", background: "transparent", color: C.tagX, cursor: "pointer", padding: 0, fontSize: 14, lineHeight: 1, width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 0, flexShrink: 0 }}
                aria-label="remove">×</button>
            </span>
          ))}
          {hiddenN > 0 && (
            <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 0, background: C.cntBg, color: C.cntTxt, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap", flexShrink: 0 }}
              onMouseEnter={e => showTip(getHiddenTip(), e, true)} onMouseLeave={() => hideTip()}>+{hiddenN}</span>
          )}
        </div>
        <Chevron open={isOpen} />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: C.bg, border: `1px solid ${C.bdr}`, borderRadius: 0, boxShadow: "0 8px 32px rgba(0,0,0,.12)", zIndex: 1000, overflow: "hidden", animation: "msddi .18s ease-out" }}>
          <div style={{ padding: "10px 12px", borderBottom: `1px solid ${C.div}`, position: "relative" }}>
            <span style={{ position: "absolute", left: 22, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}><SearchIcon /></span>
            <input ref={searchRef} type="text" value={search} onChange={onSearch} placeholder="검색어를 입력하세요..."
              style={{ width: "100%", padding: "8px 12px 8px 34px", border: `1.5px solid ${C.bdr}`, borderRadius: 0, fontSize: 13, outline: "none", background: C.bg, color: C.txt, boxSizing: "border-box", transition: "border-color .2s" }}
              onFocus={e => { e.target.style.borderColor = C.pri; }} onBlur={e => { e.target.style.borderColor = C.bdr; }} />
          </div>
          <div style={{ display: "flex", padding: "4px 8px", borderBottom: `1px solid ${C.div}` }}>
            {[["전체 선택", selAll], ["전체 해제", deselAll]].map(([label, fn]) => (
              <button key={label} onClick={fn}
                onMouseEnter={e => { e.currentTarget.style.background = C.priL; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                style={{ flex: 1, padding: "7px 0", border: "none", background: "transparent", color: C.pri, fontSize: 12, fontWeight: 600, cursor: "pointer", borderRadius: 0, textAlign: "center", transition: "background .15s" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Virtual Scroll List */}
          <div ref={listRef} className="ms-vs" onScroll={handleScroll}
            style={{ height: Math.min(listHeight, totalHeight + loaderH) || listHeight, maxHeight: listHeight, overflowY: "auto", overflowX: "hidden", position: "relative" }}
            role="listbox">
            {items.length === 0 && !loading && (
              <div style={{ padding: "24px 12px", textAlign: "center", color: C.txtS, fontSize: 13 }}>
                {search ? `"${search}" 검색 결과가 없습니다` : "데이터가 없습니다"}
              </div>
            )}
            {items.length > 0 && (
              <div style={{ height: totalHeight + loaderH, position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, transform: `translateY(${offsetY}px)` }}>
                  {visibleItems.map((item, vIdx) => {
                    const realIdx = startIndex + vIdx;
                    const isSel = sel.includes(item.value);
                    return (
                      <div key={item.value} role="option" aria-selected={isSel}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          height: itemHeight, padding: "0 12px", cursor: "pointer",
                          background: isSel ? C.bgS : hIdx === realIdx ? C.bgH : "transparent",
                          transition: "background .1s", boxSizing: "border-box",
                        }}
                        onClick={() => toggleItem(item.value)}
                        onMouseEnter={e => { setHIdx(realIdx); showTip(item.label, e); }}
                        onMouseLeave={() => { setHIdx(-1); hideTip(); }}>
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: isSel ? C.pri : C.txt, fontSize: 13, fontWeight: isSel ? 500 : 400, marginRight: 8 }}>
                          {item.label}
                        </span>
                        {isSel && <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}><CheckIcon /></span>}
                      </div>
                    );
                  })}
                </div>
                {loading && (
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", height: 36, gap: 6 }}>
                    {[0, .15, .3].map((d, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.pri, animation: `msbn 1.2s ${d}s infinite ease-in-out` }} />)}
                  </div>
                )}
              </div>
            )}
            {items.length === 0 && loading && (
              <div style={{ display: "flex", justifyContent: "center", padding: "20px 0", gap: 6 }}>
                {[0, .15, .3].map((d, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: C.pri, animation: `msbn 1.2s ${d}s infinite ease-in-out` }} />)}
              </div>
            )}
          </div>

          <div style={{ padding: "6px 12px", borderTop: `1px solid ${C.div}`, fontSize: 11, color: C.txtP, display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: C.txtS, fontWeight: 500 }}>DOM: {visibleItems.length} / 전체: {items.length}</span>
            <span>{sel.length > 0 && `${sel.length}개 선택`}{hasMore && " · 스크롤 ↓"}</span>
          </div>
        </div>
      )}

      {tip.r && (
        <div
          onMouseEnter={tip.sticky ? onTipEnter : undefined}
          onMouseLeave={tip.sticky ? onTipLeave : undefined}
          style={{
            position: "fixed", top: tip.r.top - 6,
            left: tip.r.left + tip.r.width / 2,
            transform: "translate(-50%,-100%)",
            padding: tip.sticky ? "10px 14px" : "7px 12px",
            background: C.tipBg, color: C.tipTxt, fontSize: 12,
            borderRadius: 6, zIndex: 9999,
            pointerEvents: tip.sticky ? "auto" : "none",
            maxWidth: tip.sticky ? 300 : 340,
            whiteSpace: tip.sticky ? "normal" : "nowrap",
            wordBreak: "break-all",
            boxShadow: "0 4px 12px rgba(0,0,0,.25)", lineHeight: 1.5,
            cursor: tip.sticky ? "default" : "none",
          }}>
          {tip.t}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════
   Demo App
   ══════════════════════════════════════ */
export default function App() {
  const [dataSize, setDataSize] = useState(10000);
  const [sel1, setSel1] = useState([]);
  const [sel2, setSel2] = useState([]);
  const [pw, setPw] = useState(440);
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;

  // 데이터셋 생성 (memoized)
  const dataset = useMemo(() => generateData(dataSize), [dataSize]);

  // Mock API — offset/limit/search
  const createFetchFn = useCallback((data) => {
    return (offset, limit, search) => new Promise(resolve => {
      setTimeout(() => {
        let filtered = data;
        if (search) {
          const kw = search.toLowerCase();
          filtered = data.filter(item => item.label.toLowerCase().includes(kw));
        }
        const sliced = filtered.slice(offset, offset + limit);
        resolve({ items: sliced, hasMore: offset + limit < filtered.length });
      }, 150);
    });
  }, []);

  const fetchLarge = useMemo(() => createFetchFn(dataset), [dataset, createFetchFn]);
  const fetchSmall = useMemo(() => createFetchFn(generateData(200)), [createFetchFn]);

  const hd = { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 };
  const cd = { background: "#fff", borderRadius: 12, padding: "20px 24px", marginBottom: 20, border: "1px solid #E5E7EB", boxShadow: "0 1px 3px rgba(0,0,0,.04)" };
  const badge = (bg, color) => ({ background: bg, color, padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 });

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#F0F4FF 0%,#F9FAFB 50%,#FFF5F5 100%)", padding: "32px 20px", fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif' }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", margin: "0 0 4px" }}>🎛️ MultiSelect + Virtual Scroll</h1>
          <p style={{ color: "#6B7280", fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            Virtual Scroll로 수만 건 데이터도 DOM 최소화 렌더링 · 하단 footer에서 <b>DOM 노드 수 vs 전체 아이템 수</b> 확인
          </p>
        </div>

        {/* Performance Stats */}
        <div style={{ ...cd, background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)", color: "#fff", display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>총 데이터</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{dataSize.toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>Virtual Scroll</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#4ADE80" }}>ON</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 2 }}>React Renders</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#FBBF24" }}>{renderCountRef.current}</div>
          </div>
          <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 200 }}>
            <span style={{ fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap" }}>데이터 수:</span>
            {[200, 1000, 5000, 10000, 50000].map(n => (
              <button key={n} onClick={() => { setDataSize(n); setSel1([]); setSel2([]); }}
                style={{
                  padding: "4px 8px", borderRadius: 4, border: "none", fontSize: 11, fontWeight: 600, cursor: "pointer",
                  background: dataSize === n ? "#3B82F6" : "#475569", color: dataSize === n ? "#fff" : "#CBD5E1",
                  transition: "all .15s",
                }}>
                {n >= 1000 ? `${n / 1000}K` : n}
              </button>
            ))}
          </div>
        </div>

        {/* Demo 1 — Large dataset */}
        <div style={cd}>
          <div style={hd}>
            <span style={badge("#FEE2E2", "#991B1B")}>LARGE</span>
            {dataSize.toLocaleString()}개 데이터 — Virtual Scroll ({pw}px)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 12, color: "#6B7280", whiteSpace: "nowrap" }}>Width:</span>
            <input type="range" min={240} max={640} value={pw} onChange={e => setPw(Number(e.target.value))} style={{ flex: 1, accentColor: C.pri }} />
            <span style={{ fontSize: 12, color: "#374151", fontWeight: 600, minWidth: 45, textAlign: "right" }}>{pw}px</span>
          </div>
          <MultiSelect
            width={pw}
            placeholder="수만 건에서 검색해보세요..."
            fetchItems={fetchLarge}
            pageSize={100}
            itemHeight={36}
            listHeight={300}
            overscan={8}
            value={sel1}
            onChange={setSel1}
          />
          <div style={{ marginTop: 10, fontSize: 11, color: "#9CA3AF" }}>
            선택: {sel1.length}개{sel1.length > 0 && <> — [{sel1.slice(0, 3).join(", ")}{sel1.length > 3 ? `, ...+${sel1.length - 3}` : ""}]</>}
          </div>
        </div>

        {/* Demo 2 — Small */}
        <div style={cd}>
          <div style={hd}><span style={badge("#DBEAFE", "#1D4ED8")}>SMALL</span> 200개 데이터 (비교용)</div>
          <MultiSelect
            width="100%"
            placeholder="200개 기본 데이터"
            fetchItems={fetchSmall}
            pageSize={20}
            itemHeight={36}
            listHeight={260}
            value={sel2}
            onChange={setSel2}
          />
        </div>

        {/* Demo 3 — Disabled */}
        <div style={cd}>
          <div style={hd}><span style={badge("#F3F4F6", "#6B7280")}>DISABLED</span> 비활성화</div>
          <MultiSelect width={360} placeholder="선택 불가" fetchItems={fetchSmall} disabled />
        </div>

        {/* Architecture Note */}
        <div style={{ ...cd, background: "#FFFBEB", borderColor: "#FDE68A" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#92400E", marginBottom: 8 }}>📐 Virtual Scroll 구조</div>
          <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.8 }}>
            <b>useVirtualScroll</b> 훅이 scrollTop 기반으로 startIndex / endIndex를 계산합니다.<br />
            전체 높이(totalHeight)를 가진 spacer div 안에, 실제 보이는 아이템만 <b>translateY</b>로 위치를 보정하여 렌더링합니다.<br />
            <b>overscan</b> 값만큼 뷰포트 위아래 여분 행을 추가로 렌더링하여 빠른 스크롤 시 깜빡임을 방지합니다.<br />
            무한 스크롤은 동일하게 동작 — 스크롤 하단 근접 시 <b>fetchItems(offset, limit, search)</b>를 호출합니다.
          </div>
        </div>
      </div>
    </div>
  );
}
