import React, { useEffect, useMemo, useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import "./index.css";

// ===== 활동 항목 =====
const PHYSICAL = ["줄넘기", "수영", "무용", "원반던지기", "달리기"] as const;
const MIND = ["훈독", "명상/기도", "선행", "화내지 않기", "마음을 표현하기(말/행동)", "사랑을 표현하기(말/행동)"] as const;
const HEAD = ["일기 쓰기", "줄글 책 읽고 독서록 쓰기", "연습노트 쓰기", "수학 공부", "장기 두기", "사업아이디어 만들기"] as const;

type BoolMap = Record<string, boolean>;
type Scores = { physical: number; mind: number; head: number };
type Counts = { physical: number; mind: number; head: number };

type DayRecord = {
  date: string;
  physical: BoolMap;
  mind: BoolMap;
  head: BoolMap;
  counts: Counts;
  scores: Scores;
};

// ===== 점수 규칙 =====
// 신체: 2개 이상 100 / 1개 90 / 0개 80
function scorePhysical(n: number) {
  if (n >= 2) return 100;
  if (n === 1) return 90;
  return 80;
}
// 마음: 전부 수행 100, 빠질 때마다 -10 (최저 0)
function scoreMind(n: number) {
  const missing = MIND.length - n;
  return Math.max(0, 100 - missing * 10);
}
// 머리: 3개 이상 100 / 2개 90 / 1개 80 / 0개 70
function scoreHead(n: number) {
  if (n >= 3) return 100;
  if (n === 2) return 90;
  if (n === 1) return 80;
  return 70;
}

function ymd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

const STORAGE_KEY = "self-growth-history";

export default function App() {
  const [date, setDate] = useState<string>(ymd());
  const [physical, setPhysical] = useState<BoolMap>({});
  const [mind, setMind] = useState<BoolMap>({});
  const [head, setHead] = useState<BoolMap>({});
  const [history, setHistory] = useState<Record<string, DayRecord>>({});

  // 로드
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    setHistory(raw ? JSON.parse(raw) : {});
  }, []);

  // 날짜 바뀌면 해당 데이터 로드
  useEffect(() => {
    const rec = history[date];
    if (rec) {
      setPhysical(rec.physical || {});
      setMind(rec.mind || {});
      setHead(rec.head || {});
    } else {
      setPhysical({});
      setMind({});
      setHead({});
    }
  }, [date, history]);

  // 개수/점수
  const counts: Counts = useMemo(() => ({
    physical: Object.values(physical).filter(Boolean).length,
    mind: Object.values(mind).filter(Boolean).length,
    head: Object.values(head).filter(Boolean).length
  }), [physical, mind, head]);

  const scores: Scores = useMemo(() => ({
    physical: scorePhysical(counts.physical),
    mind: scoreMind(counts.mind),
    head: scoreHead(counts.head)
  }), [counts]);

  const avg = useMemo(() => Math.round((scores.physical + scores.mind + scores.head) / 3), [scores]);

  const radarData = useMemo(() => ([
    { category: "신체 활동", score: scores.physical },
    { category: "마음 활동", score: scores.mind },
    { category: "머리 활동", score: scores.head }
  ]), [scores]);

  // 저장
  function save() {
    const next: Record<string, DayRecord> = {
      ...history,
      [date]: { date, physical, mind, head, counts, scores }
    };
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    alert("저장되었습니다.");
  }

  // 삭제
  function removeDay() {
    if (!history[date]) return;
    const { [date]: _, ...rest } = history;
    setHistory(rest);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
    setPhysical({}); setMind({}); setHead({});
    alert("삭제되었습니다.");
  }

  // CSV
  function downloadCSV() {
    const rows: string[][] = [
      ["날짜", ...PHYSICAL.map(p=>`신체:${p}`), ...MIND.map(m=>`마음:${m}`), ...HEAD.map(h=>`머리:${h}`), "신체 점수","마음 점수","머리 점수","평균"]
    ];
    Object.keys(history).sort().forEach(d => {
      const r = history[d];
      const p = PHYSICAL.map(i => r?.physical?.[i] ? 1 : 0);
      const m = MIND.map(i => r?.mind?.[i] ? 1 : 0);
      const h = HEAD.map(i => r?.head?.[i] ? 1 : 0);
      const avg = Math.round((r.scores.physical + r.scores.mind + r.scores.head)/3);
      rows.push([d, ...p, ...m, ...h, String(r.scores.physical), String(r.scores.mind), String(r.scores.head), String(avg)]);
    });
    const csv = rows.map(r => r.map(c => `"${String(c).replaceAll(`"`,`""`)}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "self-growth.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // 유틸: 체크 토글
  function toggle(setter: React.Dispatch<React.SetStateAction<BoolMap>>, key: string, on: boolean) {
    setter(prev => ({ ...prev, [key]: on }));
  }

  return (
    <div className="container">
      <h1>자기성장 기록 앱</h1>

      <div className="toolbar">
        <label>
          날짜:&nbsp;
          <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
        </label>
        <button onClick={save}>저장</button>
        <button onClick={removeDay} className="danger">삭제</button>
        <button onClick={downloadCSV}>CSV 다운로드</button>
      </div>

      <div className="grid">
        <fieldset>
          <legend>신체 활동</legend>
          {PHYSICAL.map(item => (
            <label key={item} className="row">
              <input type="checkbox" checked={!!physical[item]} onChange={e=>toggle(setPhysical, item, e.target.checked)} />
              <span>{item}</span>
            </label>
          ))}
          <div className="hint">선택 {counts.physical}개 → 점수 {scores.physical} (2개 이상 100 / 1개 90 / 0개 80)</div>
        </fieldset>

        <fieldset>
          <legend>마음 활동</legend>
          {MIND.map(item => (
            <label key={item} className="row">
              <input type="checkbox" checked={!!mind[item]} onChange={e=>toggle(setMind, item, e.target.checked)} />
              <span>{item}</span>
            </label>
          ))}
          <div className="hint">선택 {counts.mind}개 → 점수 {scores.mind} (전부 수행 100, 빠질 때마다 -10)</div>
        </fieldset>

        <fieldset>
          <legend>머리 활동</legend>
          {HEAD.map(item => (
            <label key={item} className="row">
              <input type="checkbox" checked={!!head[item]} onChange={e=>toggle(setHead, item, e.target.checked)} />
              <span>{item}</span>
            </label>
          ))}
          <div className="hint">선택 {counts.head}개 → 점수 {scores.head} (3개 이상 100 / 2개 90 / 1개 80 / 0개 70)</div>
        </fieldset>

        <div className="chartCard">
          <h3>오늘의 레이더(삼각) 차트</h3>
          <div className="chartWrap">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="80%">
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tickCount={6} />
                <Radar name="점수" dataKey="score" stroke="#1f2937" fill="#60a5fa" fillOpacity={0.55} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="avg">평균 점수: <b>{avg}</b></div>
        </div>
      </div>

      <h3 style={{marginTop: 24}}>기록(History)</h3>
      <div className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>날짜</th><th>신체</th><th>마음</th><th>머리</th><th>평균</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(history).sort().map(d => {
              const r = history[d];
              const avgRow = Math.round((r.scores.physical + r.scores.mind + r.scores.head)/3);
              return (
                <tr key={d}>
                  <td>{d}</td>
                  <td>{r.scores.physical}</td>
                  <td>{r.scores.mind}</td>
                  <td>{r.scores.head}</td>
                  <td><b>{avgRow}</b></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="foot">데이터는 브라우저(LocalStorage)에 저장됩니다.</p>
    </div>
  );
}
