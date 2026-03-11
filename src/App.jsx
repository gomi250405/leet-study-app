import React, { useState } from "react";

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

// --- 승우님을 위한 고난도 지문 프롬프트 ---
const PROMPTS = {
  lang: (d) => `당신은 LEET 언어이해 출제위원입니다. 난이도 ${d}/5 문제를 1개 생성하세요. 지문은 법철학 또는 헌법적 가치를 다루며 800자 내외로 작성하세요. 선지는 '반대 해석' 논리를 포함해야 합니다. 반드시 마크다운 없이 JSON만 출력하세요: {"type":"추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  reason: (d) => `당신은 LEET 추리논증 전문가입니다. 난이도 ${d}/5 법적 추론 문제를 1개 생성하세요. 복잡한 법 규정을 제시하고 사실관계에 적용하는 문항이어야 합니다. 반드시 마크다운 없이 JSON만 출력하세요: {"type":"법적추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  toeic: (d) => `당신은 토익 950점 대비 출제자입니다. Part 7 고난도 다중 지문 문제를 1개 생성하세요. 정보를 조합해야 풀 수 있는 추론 문제입니다. 반드시 마크다운 없이 JSON만 출력하세요: {"type":"TOEIC-RC","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`
};

export default function LEETUltimateApp() {
  const [quizTab, setQuizTab] = useState("lang");
  const [questions, setQuestions] = useState({ lang: [], reason: [], toeic: [] });
  const [quizIdx, setQuizIdx] = useState({ lang: 0, reason: 0, toeic: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setSelected(null);
    setRevealed(false);
    
    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("Vercel 환경변수에 API Key가 없습니다.");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          // ⚠️ 무료 티어에서 가장 최신/안정적인 하이크 모델명으로 교체
          model: "claude-3-5-haiku-20241022", 
          max_tokens: 1500,
          messages: [{ role: "user", content: PROMPTS[quizTab](4) }]
        })
      });

      if (!response.ok) {
        const errBody = await response.json();
        throw new Error(`API 에러: ${errBody.error?.message || "응답 실패"}`);
      }

      const data = await response.json();
      const contentText = data?.content?.[0]?.text;
      
      if (!contentText) throw new Error("AI 응답 내용이 없습니다.");

      // JSON 추출 안전 로직
      const start = contentText.indexOf('{');
      const end = contentText.lastIndexOf('}') + 1;
      if (start === -1) throw new Error("JSON 형식을 찾을 수 없습니다.");
      
      const jsonStr = contentText.substring(start, end);
      const parsed = JSON.parse(jsonStr);

      setQuestions(prev => {
        const updated = [...prev[quizTab], { ...parsed, id: Date.now() }];
        setQuizIdx(p => ({ ...p, [quizTab]: updated.length - 1 }));
        return { ...prev, [quizTab]: updated };
      });
    } catch (err) {
      alert("생성 실패: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = questions[quizTab][quizIdx[quizTab]];
  const activeColor = QUIZ_TABS.find(t => t.id === quizTab).color;

  return (
    <div style={{ minHeight: "100vh", background: "#09090F", color: "#E2E8F0", padding: "20px", fontFamily: "sans-serif" }}>
      {/* 업무 시스템 스타일 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1E2030", paddingBottom: "15px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          {QUIZ_TABS.map(t => (
            <button key={t.id} onClick={() => { setQuizTab(t.id); setSelected(null); setRevealed(false); }}
              style={{ background: quizTab === t.id ? t.color + "22" : "transparent", color: quizTab === t.id ? t.color : "#64748B", border: `1px solid ${quizTab === t.id ? t.color : "#1E2030"}`, padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "#34D399", fontWeight: "bold" }}>
          SCORE: {sessionStats.correct} / {sessionStats.total}
        </div>
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {currentQ ? (
          <div>
            {/* 지문 영역 */}
            <div style={{ background: "#12121F", borderLeft: `4px solid ${activeColor}`, padding: "18px", borderRadius: "0 12px 12px 0", marginBottom: "20px", fontSize: "14px", lineHeight: "1.8", color: "#CBD5E1", whiteSpace: "pre-wrap" }}>
              {currentQ.passage}
            </div>
            
            {/* 질문 영역 */}
            <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px", lineHeight: "1.5" }}>Q. {currentQ.question}</div>

            {/* 선지 영역 */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {currentQ.options.map((opt, i) => {
                let btnBg = "#12121F";
                let btnBorder = "#1E2030";
                if (revealed) {
                  if (i === currentQ.answer) { btnBg = "#0D2B1E"; btnBorder = "#34D399"; }
                  else if (i === selected) { btnBg = "#2B0D0D"; btnBorder = "#EF4444"; }
                } else if (selected === i) { btnBg = activeColor + "22"; btnBorder = activeColor; }

                return (
                  <button key={i} onClick={() => !revealed && setSelected(i)}
                    style={{ background: btnBg, border: `1px solid ${btnBorder}`, padding: "14px", borderRadius: "10px", color: "#E2E8F0", textAlign: "left", cursor: revealed ? "default" : "pointer", display: "flex", gap: "12px" }}>
                    <span style={{ color: activeColor, fontWeight: "bold" }}>{i + 1}</span> {opt}
                  </button>
                );
              })}
            </div>

            {/* 정답 확인 버튼 */}
            {!revealed && selected !== null && (
              <button onClick={() => { setRevealed(true); setSessionStats(p => ({ total: p.total + 1, correct: p.correct + (selected === currentQ.answer ? 1 : 0) })); }}
                style={{ width: "100%", padding: "14px", background: activeColor, color: "#000", fontWeight: "bold", borderRadius: "10px", border: "none", cursor: "pointer", marginBottom: "20px" }}>
                정답 확인
              </button>
            )}

            {/* 해설 영역 */}
            {revealed && (
              <div style={{ background: "#0F0F1A", padding: "15px", borderRadius: "10px", border: "1px solid #1E2030", marginBottom: "20px", fontSize: "13px", color: "#94A3B8", lineHeight: "1.6" }}>
                <strong style={{ color: "#E2E8F0" }}>[해설]</strong> {currentQ.explanation}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#475569" }}>
            <p>"애매한 시간"을 활용해 리트/토익 문제를 생성해 보세요.</p>
          </div>
        )}

        {/* 생성 버튼 */}
        <button onClick={handleGenerateAI} disabled={isGenerating}
          style={{ width: "100%", padding: "14px", background: isGenerating ? "#1E1E26" : "transparent", color: isGenerating ? "#475569" : activeColor, border: `1px solid ${isGenerating ? "#1E1E26" : activeColor}`, borderRadius: "10px", cursor: isGenerating ? "not-allowed" : "pointer", fontWeight: "bold", fontSize: "14px" }}>
          {isGenerating ? "AI 분석 엔진 가동 중..." : "✨ AI 새 문제 생성"}
        </button>
      </div>

      {/* 사생활 보호용 하단 텍스트 */}
      <div style={{ position: "fixed", bottom: 10, right: 20, fontSize: "10px", color: "#161625" }}>
        SYSTEM_USER_SEUNGWOO_READY
      </div>
    </div>
  );
}
