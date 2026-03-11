import React, { useState } from "react";

const TYPE_COLOR = { "독해": "#2DD4BF", "추론": "#818CF8", "법적추론": "#8B5CF6", "형식논리": "#F59E0B", "TOEIC-RC": "#F472B6" };
const QUIZ_TABS = [
  { id: "lang", label: "📖 언어이해", color: "#2DD4BF" },
  { id: "reason", label: "⚖️ 추리논증", color: "#F59E0B" },
  { id: "toeic", label: "🇬🇧 TOEIC 950", color: "#F472B6" },
];

const PROMPTS = {
  lang: (d) => `LEET 언어이해 문제 1개 생성. 법철학 지문 800자. JSON만 출력: {"type":"추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  reason: (d) => `LEET 추리논증 법적추론 문제 1개 생성. JSON만 출력: {"type":"법적추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  toeic: (d) => `TOEIC Part 7 고난도 문제 1개 생성. JSON만 출력: {"type":"TOEIC-RC","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`
};

export default function LEETUltimateApp() {
  const [quizTab, setQuizTab] = useState("lang");
  const [questions, setQuestions] = useState({ lang: [], reason: [], toeic: [] });
  const [quizIdx, setQuizIdx] = useState({ lang: 0, reason: 0, toeic: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  // --- 모델 리스트 (에러 나면 순차적으로 시도) ---
  const MODEL_LIST = [
    "claude-3-haiku-20240307",
    "claude-3-5-sonnet-20240620",
    "claude-3-5-haiku-latest"
  ];

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setSelected(null);
    setRevealed(false);
    
    let lastError = "";

    // 모델 리스트를 순회하며 하나라도 걸리게 만듦
    for (const modelName of MODEL_LIST) {
      try {
        const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
          },
          body: JSON.stringify({
            model: modelName,
            max_tokens: 1500,
            messages: [{ role: "user", content: PROMPTS[quizTab](4) }]
          })
        });

        if (!response.ok) {
          const errBody = await response.json();
          lastError = errBody.error?.message || "Fail";
          continue; // 다음 모델로 시도
        }

        const data = await response.json();
        const contentText = data?.content?.[0]?.text;
        const start = contentText.indexOf('{');
        const end = contentText.lastIndexOf('}') + 1;
        const parsed = JSON.parse(contentText.substring(start, end));

        setQuestions(prev => {
          const updated = [...prev[quizTab], { ...parsed, id: Date.now() }];
          setQuizIdx(p => ({ ...p, [quizTab]: updated.length - 1 }));
          return { ...prev, [quizTab]: updated };
        });
        
        setIsGenerating(false);
        return; // 성공 시 함수 종료

      } catch (err) {
        lastError = err.message;
        continue;
      }
    }

    alert(`모든 모델 호출 실패. 마지막 에러: ${lastError}\n\nTIP: Anthropic Workbench에서 사용 가능한 모델명을 확인해보세요.`);
    setIsGenerating(false);
  };

  const currentQ = questions[quizTab][quizIdx[quizTab]];
  const activeColor = QUIZ_TABS.find(t => t.id === quizTab).color;

  return (
    <div style={{ minHeight: "100vh", background: "#09090F", color: "#E2E8F0", padding: "20px", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1E2030", paddingBottom: "15px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          {QUIZ_TABS.map(t => (
            <button key={t.id} onClick={() => { setQuizTab(t.id); setSelected(null); setRevealed(false); }}
              style={{ background: quizTab === t.id ? t.color + "22" : "transparent", color: quizTab === t.id ? t.color : "#64748B", border: `1px solid ${quizTab === t.id ? t.color : "#1E2030"}`, padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "#34D399" }}>SCORE: {sessionStats.correct} / {sessionStats.total}</div>
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {currentQ ? (
          <div>
            <div style={{ background: "#12121F", borderLeft: `4px solid ${activeColor}`, padding: "18px", borderRadius: "0 12px 12px 0", marginBottom: "20px", fontSize: "14px", lineHeight: "1.8", color: "#CBD5E1", whiteSpace: "pre-wrap" }}>{currentQ.passage}</div>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>Q. {currentQ.question}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {currentQ.options.map((opt, i) => (
                <button key={i} onClick={() => !revealed && setSelected(i)}
                  style={{ background: revealed ? (i === currentQ.answer ? "#0D2B1E" : (i === selected ? "#2B0D0D" : "#12121F")) : (selected === i ? activeColor + "22" : "#12121F"), border: `1px solid ${revealed && i === currentQ.answer ? "#34D399" : (selected === i ? activeColor : "#1E2030")}`, padding: "14px", borderRadius: "10px", color: "#E2E8F0", textAlign: "left", cursor: "pointer" }}>
                  <span style={{ color: activeColor, fontWeight: "bold", marginRight: "10px" }}>{i + 1}</span>{opt}
                </button>
              ))}
            </div>
            {!revealed && selected !== null && (
              <button onClick={() => { setRevealed(true); setSessionStats(p => ({ total: p.total + 1, correct: p.correct + (selected === currentQ.answer ? 1 : 0) })); }}
                style={{ width: "100%", padding: "14px", background: activeColor, color: "#000", fontWeight: "bold", borderRadius: "10px", border: "none", cursor: "pointer" }}>정답 확인</button>
            )}
            {revealed && <div style={{ background: "#0F0F1A", padding: "15px", borderRadius: "10px", marginTop: "15px", fontSize: "13px", color: "#94A3B8" }}>{currentQ.explanation}</div>}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>문제를 생성해 보세요.</div>
        )}
        <button onClick={handleGenerateAI} disabled={isGenerating}
          style={{ width: "100%", padding: "14px", marginTop: "20px", background: "transparent", color: isGenerating ? "#334155" : activeColor, border: `1px solid ${activeColor}`, borderRadius: "10px", cursor: "pointer", fontWeight: "bold" }}>
          {isGenerating ? "모델 순차 시도 중..." : "✨ AI 새 문제 생성"}
        </button>
      </div>
    </div>
  );
}
