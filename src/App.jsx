import { useState } from "react";

// --- 디자인 설정 ---
const TYPE_COLOR = { 
  "독해": "#2DD4BF", "추론": "#818CF8", "법적추론": "#8B5CF6", 
  "형식논리": "#F59E0B", "TOEIC-RC": "#F472B6" 
};

const QUIZ_TABS = [
  { id: "lang", label: "📖 언어이해", color: "#2DD4BF" },
  { id: "reason", label: "⚖️ 추리논증", color: "#F59E0B" },
  { id: "toeic", label: "🇬🇧 TOEIC 950", color: "#F472B6" },
];

// --- 고난도 지문 생성을 위한 프롬프트 ---
const PROMPTS = {
  lang: (d) => `당신은 LEET 언어이해 전문가입니다. 난이도 ${d}/5 문제를 1개 생성하세요. 법철학 지문 800자 내외와 5지선다형 문제, 해설을 포함하세요. 반드시 마크다운 없이 JSON만 출력: {"type":"추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  reason: (d) => `당신은 LEET 추리논증 전문가입니다. 난이도 ${d}/5 법적 추론 문제를 1개 생성하세요. 법 조항과 사실관계를 제시하세요. 반드시 마크다운 없이 JSON만 출력: {"type":"법적추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  toeic: (d) => `당신은 토익 950점 대비 출제자입니다. Part 7 다중 지문 연계 문제를 1개 생성하세요. 반드시 마크다운 없이 JSON만 출력: {"type":"TOEIC-RC","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`
};

export default function LEETUltimateApp() {
  const [quizTab, setQuizTab] = useState("lang");
  const [questions, setQuestions] = useState({ lang: [], reason: [], toeic: [] });
  const [quizIdx, setQuizIdx] = useState({ lang: 0, reason: 0, toeic: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total
