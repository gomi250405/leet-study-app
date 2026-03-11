import { useState, useCallback } from "react";

// --- 스타일 및 설정 상수 ---
const TYPE_COLOR = { 
  "독해": "#2DD4BF", "추론": "#818CF8", "법적추론": "#8B5CF6", 
  "형식논리": "#F59E0B", "TOEIC-RC": "#F472B6" 
};

const QUIZ_TABS = [
  { id: "lang", label: "📖 언어이해", color: "#2DD4BF" },
  { id: "reason", label: "⚖️ 추리논증", color: "#F59E0B" },
  { id: "toeic", label: "🇬🇧 TOEIC 950", color: "#F472B6" },
];

// --- 승우님을 위한 고난도 프롬프트 엔진 ---
const PROMPTS = {
  lang: (d) => `당신은 LEET 언어이해 전문가입니다. 난이도 ${d}/5 문제를 1개 생성하세요. 지문은 법철학 또는 헌법 판례를 다루며, 800자 내외로 작성하세요. 선지는 '반대 해석' 논리를 포함해야 합니다. 반드시 마크다운 없이 JSON만 출력하세요: {"type":"추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  reason: (d) => `당신은 LEET 추리논증 전문가입니다. 난이도 ${d}/5 문제를 생성하세요. 복잡한 법 규정을 제시하고 사실관계에 적용하는 문항이어야 합니다. 반드시 마크다운 없이 JSON만 출력하세요: {"type":"법적추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  toeic: (d) => `당신은 토익 950점 대비 출제자입니다. Part 7 다중 지문을 생성하세요. 비즈니스 이메일과 공고문 연계형이며, 정보를 조합해야 풀 수 있는 추론 문제입니다. 반드시 마크다운 없이 JSON만 출력하세요: {"type":"TOEIC-RC","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`
};

export default function LEETUltimateApp() {
  // --- 상태 관리 ---
  const [quizTab, setQuizTab] = useState("lang");
  const [questions, setQuestions] = useState({ lang: [], reason: [], toeic: [] });
  const [quizIdx, setQuizIdx] = useState({ lang: 0, reason: 0, toeic: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  // --- AI 문제 생성 로직 (Vercel 환경용) ---
  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setSelected(null);
    setRevealed(false);
    
    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Vercel Settings에서 API 키를 설정해주세요.");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307", // Vercel 타임아웃 방지를 위한 빠른 모델
          max_tokens: 1500,
          messages: [{ role: "user", content: PROMPTS[quizTab](4) }]
        })
      });

      if (!response.ok) throw new Error("API 호출 실패");

      const data = await response.json();
      const content = data.content[0].text;
      const match = content.match(/\{[\s\S
