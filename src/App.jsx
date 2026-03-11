import { useState, useCallback, useEffect } from "react";

// --- 상수 및 설정 ---
const WEIGHT_COLOR = { "핵심": "#EF4444", "LEET특화": "#8B5CF6", "보조": "#6B7280", "전략": "#0EA5E9" };
const DIFF_LABEL = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];
const TYPE_COLOR = { "독해": "#2DD4BF", "추론": "#818CF8", "법적추론": "#8B5CF6", "형식논리": "#F59E0B", "TOEIC-RC": "#F472B6" };

const QUIZ_TABS = [
  { id: "lang", label: "📖 언어이해", color: "#2DD4BF" },
  { id: "reason", label: "⚖️ 추리논증", color: "#F59E0B" },
  { id: "toeic", label: "🇬🇧 TOEIC 950", color: "#F472B6" }, // 토익 탭 추가
];

// --- 승우님을 위한 '기출급' 프롬프트 엔진 ---
const PROMPTS = {
  lang: (d) => `당신은 LEET 언어이해 출제위원입니다. 난이도 ${d}/5 문제를 1개 생성하세요. 
    지문은 법철학 또는 헌법적 가치를 다루며, 다수설과 소수설의 논박이 포함되어야 합니다. 
    선지는 지문의 단어를 그대로 쓰지 말고 '반대 해석'을 통해 추론하게 하세요.
    반드시 마크다운 없이 JSON만 출력: {"type":"추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  
  reason: (d) => `당신은 LEET 추리논증 전문가입니다. 난이도 ${d}/5 법적 추론 문제를 생성하세요. 
    복잡한 법 조항 2~3개를 제시하고, 특정 사례(Fact)에 적용했을 때 결론을 도출하게 하세요. 
    '반드시 ~해야 한다'와 '~할 수 있다'의 차이를 함정으로 만드세요.
    반드시 마크다운 없이 JSON만 출력: {"type":"법적추론","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`,
  
  toeic: (d) => `당신은 토익 950점 이상 고득점자를 위한 출제자입니다. Part 7 다중 지문을 생성하세요. 
    난이도는 최상으로, 비즈니스 이메일과 공고문이 연계된 형태여야 합니다. 
    지문의 정보를 조합해야만 풀 수 있는 추론 문제를 내세요.
    반드시 마크다운 없이 JSON만 출력: {"type":"TOEIC-RC","difficulty":${d},"passage":"...","question":"...","options":["","","","",""],"answer":0,"explanation":"..."}`
};

// --- API 호출 로직 (코랩 프록시 주소 사용) ---
async function fetchAIQuestion(tab, difficulty) {
  // ⚠️ 주의: 코랩에서 실행 후 얻은 ngrok 주소를 여기에 넣으세요
  const PROXY_URL = "https://YOUR_NGROK_URL.ngrok.io/generate"; 
  
  try {
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: PROMPTS[tab](difficulty) })
    });
    
    if (!res.ok) throw new Error("방화벽 또는 서버 응답 오류");
    
    const data = await res.json();
    // 클로드 응답에서 JSON만 추출
    const match = data.text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("데이터 형식이 올바르지 않습니다.");
    
    const parsed = JSON.parse(match[0]);
    return { ...parsed, id: `ai_${Date.now()}`, isAI: true };
  } catch (err) {
    console.error(err);
    throw err;
  }
}

// --- 메인 컴포넌트 ---
export default function LEETUltimateApp() {
  const [view, setView] = useState("quiz"); // 업무 시간엔 퀴즈 뷰가 메인
  const [quizTab, setQuizTab] = useState("lang");
  const [questions, setQuestions] = useState({ lang: [], reason: [], toeic: [] });
  const [quizIdx, setQuizIdx] = useState({ lang: 0, reason: 0, toeic: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  const handleNewQuestion = async () => {
    setIsGenerating(true);
    try {
      const difficulty = Math.min(5, Math.max(3, Math.ceil(sessionStats.correct / 2) + 2));
      const newQ = await fetchAIQuestion(quizTab, difficulty);
      setQuestions(prev => ({
        ...prev,
        [quizTab]: [...prev[quizTab], newQ]
      }));
      setQuizIdx(prev => ({ ...prev, [quizTab]: questions[quizTab].length }));
    } catch (e) {
      alert("서버 연결 실패! 코랩이 켜져 있는지 확인하세요.");
    } finally {
      setIsGenerating(false);
    }
  };

  const currentQ = questions[quizTab][quizIdx[quizTab]];

  return (
    <div style={{ minHeight: "100vh", background: "#09090F", color: "#E2E8F0", padding: "20px" }}>
      {/* 상단 탭 - 업무 대시보드처럼 디자인 */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "30px", borderBottom: "1px solid #1E2030", paddingBottom: "15px" }}>
        {QUIZ_TABS.map(t => (
          <button 
            key={t.id} 
            onClick={() => setQuizTab(t.id)}
            style={{ 
              background: quizTab === t.id ? t.color + "22" : "transparent",
              color: quizTab === t.id ? t.color : "#64748B",
              border: `1px solid ${quizTab === t.id ? t.color : "#1E2030"}`,
              padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 퀴즈 영역 */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {currentQ ? (
          <div>
            <div style={{ background: "#12121F", padding: "20px", borderRadius: "12px", borderLeft: `4px solid ${QUIZ_TABS.find(t=>t.id===quizTab).color}`, marginBottom: "20px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>
              {currentQ.passage}
            </div>
            <h3 style={{ marginBottom: "20px" }}>Q. {currentQ.question}</h3>
            {/* 선지 및 버튼 로직... (기존 QuizCard 로직 적용) */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {currentQ.options.map((opt, i) => (
                <button key={i} style={{ textAlign: "left", padding: "12px", background: "#1E2030", border: "1px solid #334155", color: "#E2E8F0", borderRadius: "8px", cursor: "pointer" }}>
                  {i + 1}. {opt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", marginTop: "100px" }}>
            <p style={{ color: "#64748B" }}>데이터 로드 중이거나 문제가 없습니다.</p>
            <button 
              onClick={handleNewQuestion} 
              disabled={isGenerating}
              style={{ padding: "12px 24px", background: "linear-gradient(135deg, #2DD4BF, #0EA5E9)", border: "none", borderRadius: "8px", color: "white", fontWeight: "bold", cursor: "pointer" }}
            >
              {isGenerating ? "AI 분석 중..." : "첫 번째 문제 생성하기"}
            </button>
          </div>
        )}
      </div>

      {/* 하단 상태바 - 사생활 보호용 작게 표시 */}
      <div style={{ position: "fixed", bottom: 10, right: 20, fontSize: "10px", color: "#334155" }}>
        System Status: Running (AI_MODEL_CLAUDE_3.5_SONNET)
      </div>
    </div>
  );
}
