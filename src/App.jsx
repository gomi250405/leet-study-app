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
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setSelected(null);
    setRevealed(false);
    
    try {
      const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
      if (!apiKey) throw new Error("API Key가 설정되지 않았습니다.");

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307", // 무료 티어용 하이크 모델
          max_tokens: 1500,
          messages: [{ role: "user", content: PROMPTS[quizTab](4) }]
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`API 에러: ${errData.error?.message || "알 수 없는 오류"}`);
      }

      const data = await response.json();
      const contentText = data.content?.[0]?.text;
      
      if (!contentText) throw new Error("AI 응답이 비어있습니다.");

      // JSON 추출 (정규식 에러 방지용 안전 로직)
      const start = contentText.indexOf('{');
      const end = contentText.lastIndexOf('}') + 1;
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
      {/* 상단 헤더 */}
      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1E2030", paddingBottom: "15px", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          {QUIZ_TABS.map(t => (
            <button key={t.id} onClick={() => { setQuizTab(t.id); setSelected(null); setRevealed(false); }}
              style={{ background: quizTab === t.id ? t.color + "22" : "transparent", color: quizTab === t.id ? t.color : "#64748B", border: `1px solid ${quizTab === t.id ? t.color : "#1E2030"}`, padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{ fontSize: "12px", color: "#34D399" }}>세션 정답률: {sessionStats.total > 0 ? Math.round((sessionStats.correct / sessionStats.total) * 100) : 0}%</div>
      </div>

      {/* 문제 영역 */}
      <div style={{ maxWidth: "700px", margin: "0 auto" }}>
        {currentQ ? (
          <div>
            <div style={{ background: "#12121F", borderLeft: `4px solid ${activeColor}`, padding: "18px", borderRadius: "0 12px 12px 0", marginBottom: "20px", fontSize: "14px", lineHeight: "1.8", color: "#CBD5E1", whiteSpace: "pre-wrap" }}>
              {currentQ.passage}
            </div>
            <div style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "20px" }}>Q. {currentQ.question}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {currentQ.options.map((opt, i) => (
                <button key={i} onClick={() => !revealed && setSelected(i)}
                  style={{ background: revealed && i === currentQ.answer ? "#0D2B1E" : revealed && i === selected ? "#2B0D0D" : selected === i ? activeColor + "22" : "#12121F", border: `1px solid ${revealed && i === currentQ.answer ? "#34D399" : selected === i ? activeColor : "#1E2030"}`, padding: "14px", borderRadius: "10px", color: "#E2E8F0", textAlign: "left", cursor: "pointer", display: "flex", gap: "12px" }}>
                  <span style={{ fontWeight: "bold", color: activeColor }}>{i + 1}</span> {opt}
                </button>
              ))}
            </div>
            {!revealed && selected !== null && (
              <button onClick={() => { setRevealed(true); setSessionStats(p => ({ total: p.total + 1, correct: p.correct + (selected === currentQ.answer ? 1 : 0) })); }}
                style={{ width: "100%", padding: "14px", background: activeColor, color: "#000", fontWeight: "bold", borderRadius: "10px", border: "none", cursor: "pointer" }}>
                정답 확인하기
              </button>
            )}
            {revealed && (
              <div style={{ marginTop: "15px", padding: "15px", background: "#0F0F1A", borderRadius: "10px", border: "1px solid #1E2030", fontSize: "13px", lineHeight: "1.6", color: "#94A3B8" }}>
                <strong style={{ color: "#E2E8F0" }}>해설:</strong> {currentQ.explanation}
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "100px 0", color: "#64748B" }}>
            "애매한 시간"을 활용해 문제를 생성해 보세요. <br/> (오른쪽 상단 정답률이 기록됩니다.)
          </div>
        )}
        <button onClick={handleGenerateAI} disabled={isGenerating}
          style={{ width: "100%", padding: "14px", marginTop: "20px", background: "transparent", color: isGenerating ? "#334155" : activeColor, border: `1px solid ${isGenerating ? "#1E2030" : activeColor}`, borderRadius: "10px", cursor: isGenerating ? "not-allowed" : "pointer", fontWeight: "bold" }}>
          {isGenerating ? "AI가 지문 구성 중..." : "✨ AI 새 문제 생성"}
        </button>
      </div>

      <div style={{ position: "fixed", bottom: 10, right: 20, fontSize: "10px", color: "#1E2030" }}>
        ID_RESEARCHER_SEUNGWOO_STABLE_BUILD
      </div>
    </div>
  );
}
