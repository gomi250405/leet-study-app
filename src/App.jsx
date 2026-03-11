import { useState, useCallback, useEffect } from "react";

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────
const WEIGHT_COLOR = { "핵심": "#EF4444", "LEET특화": "#8B5CF6", "보조": "#6B7280", "전략": "#0EA5E9" };
const DIFF_LABEL = ["", "★", "★★", "★★★", "★★★★", "★★★★★"];
const TYPE_COLOR = { "독해": "#2DD4BF", "추론": "#818CF8", "어휘": "#34D399", "빈칸추론": "#F472B6", "형식논리": "#F59E0B", "논증강화": "#EF4444", "법적추론": "#8B5CF6", "퍼즐추리": "#FB923C", "시간전략": "#818CF8", "오답분석": "#F472B6", "기출분석": "#34D399", "모의고사": "#FB923C" };

const QUIZ_TABS = [
  { id: "lang",     label: "📖 언어이해",  color: "#2DD4BF" },
  { id: "reason",   label: "⚖️ 추리논증",  color: "#F59E0B" },
  { id: "strategy", label: "🎯 전략 퀴즈", color: "#818CF8" },
];

// ─────────────────────────────────────────────
// LEET DATA
// ─────────────────────────────────────────────
const LEET_DATA = {
  sections: [
    {
      id: "lang", title: "언어이해", color: "#2DD4BF", bg: "#0D2B29", icon: "📖",
      description: "독해력·추론·비판적 이해",
      topics: [
        { id: "l1", title: "독해 기반 스킬", weight: "핵심", subtopics: ["주제·요지 파악","구조 분석","세부 정보 확인","문단 간 관계"], tips: "지문 첫 문장과 마지막 문장을 먼저 읽어 구조 파악. 핵심어에 밑줄 치는 습관.", time: "30~40%", linked: ["l2","l3"], difficulty: 3 },
        { id: "l2", title: "추론·응용", weight: "핵심", subtopics: ["함의 추론","빈칸 추론","적용·사례","강화·약화"], tips: "선지를 먼저 읽고 무엇을 물어보는지 파악 후 지문 독해. 함정 선지 패턴 암기.", time: "35~45%", linked: ["l1","l3","r2"], difficulty: 4 },
        { id: "l3", title: "어휘·문법·표현", weight: "보조", subtopics: ["한자어·어휘 의미","문맥 속 어휘","표현 방식","수사법"], tips: "고빈도 한자어 500개 암기. 문맥 없이 단어만으론 판단 금지.", time: "15~25%", linked: ["l1"], difficulty: 2 },
        { id: "l4", title: "지문 유형별 전략", weight: "전략", subtopics: ["인문·철학 지문","사회·법학 지문","과학·기술 지문","예술·문화 지문"], tips: "각 분야 배경지식 확장. 특히 법학 지문은 LEET 특화—판례·원칙 흐름 익히기.", time: "배경지식", linked: ["l1","l2"], difficulty: 3 },
      ]
    },
    {
      id: "reason", title: "추리논증", color: "#F59E0B", bg: "#2B1D09", icon: "⚖️",
      description: "논리·법적 추론·논증 평가",
      topics: [
        { id: "r1", title: "형식논리", weight: "핵심", subtopics: ["명제·삼단논법","대우·역·이","조건문 추론","벤다이어그램"], tips: "대우 변환 즉각 반사 훈련. P→Q일 때 ~Q→~P 반드시 암기.", time: "25~35%", linked: ["r2","r3"], difficulty: 4 },
        { id: "r2", title: "논증 분석·평가", weight: "핵심", subtopics: ["전제·결론 파악","논증 강화·약화","가정 찾기","오류 유형"], tips: "결론을 먼저 찾고, 전제가 결론을 어떻게 지지하는지 역방향 분석.", time: "30~40%", linked: ["r1","r3","l2"], difficulty: 5 },
        { id: "r3", title: "법적 추론", weight: "LEET특화", subtopics: ["법 원칙 적용","사례 분석","규범 해석","법적 삼단논법"], tips: "대전제(법 규정)→소전제(사실관계)→결론 구조 훈련. 판례 논리 패턴 분석.", time: "20~30%", linked: ["r2","r4"], difficulty: 5 },
        { id: "r4", title: "퍼즐·배열 추리", weight: "보조", subtopics: ["조건 배열","참·거짓 추리","수·도형 패턴","집합 관계"], tips: "표나 도표 그리며 풀기. 시간 배분 주의—어려운 문제는 과감히 스킵.", time: "10~20%", linked: ["r1"], difficulty: 3 },
      ]
    }
  ],
  strategies: [
    { id: "s1", title: "시간 관리", icon: "⏱", desc: "언어이해 30문항 70분 / 추리논증 40문항 125분. 언어이해 문항당 약 2분 20초, 추리논증 문항당 약 3분 8초.", color: "#818CF8" },
    { id: "s2", title: "오답 노트", icon: "📝", desc: "틀린 이유 분류: 독해 실수 / 논리 오류 / 시간 부족. 패턴 파악이 핵심.", color: "#F472B6" },
    { id: "s3", title: "기출 분석", icon: "🎯", desc: "최근 5개년 기출 반복. 출제 패턴·난이도 트렌드 파악 필수.", color: "#34D399" },
    { id: "s4", title: "모의고사", icon: "📊", desc: "실전처럼 시간 재고 풀기. 월 2회 이상. 점수보다 분석에 집중.", color: "#FB923C" },
  ]
};

// ─────────────────────────────────────────────
// SEED QUESTIONS (built-in, shown before AI)
// ─────────────────────────────────────────────
const SEED_QUESTIONS = {
  lang: [
    { id: "lq1", type: "독해", difficulty: 2, passage: `계약은 청약과 승낙의 의사 합치로 성립한다. 청약은 특정 조건으로 계약을 체결하자는 의사 표시이며, 승낙은 청약 내용 전부에 동의하는 것이다.`, question: "위 지문의 핵심 내용으로 가장 적절한 것은?", options: ["청약은 취소할 수 없다.","계약은 청약과 승낙의 합치로 성립한다.","승낙은 조건을 붙일 수 있다.","청약자는 계약 성립을 거부할 수 있다.","계약은 반드시 서면으로 체결해야 한다."], answer: 1, explanation: "지문은 계약 성립 요건으로 청약과 승낙의 의사 합치를 명시하므로 ②가 핵심 내용입니다." },
    { id: "lq2", type: "추론", difficulty: 3, passage: `형사소송에서 무죄 추정의 원칙은 피고인이 유죄 확정 전까지 무죄로 추정된다는 원칙이다. 검사에게 유죄 입증 책임을 부과하며, 입증이 불충분하면 피고인에게 유리한 판단을 내려야 한다.`, question: "위 지문에서 추론할 수 있는 것은?", options: ["피고인이 무죄를 직접 입증해야 한다.","검사 증거가 불충분하면 피고인에게 유리한 판결이 가능하다.","무죄 추정은 민사소송에도 동일 적용된다.","판사가 유죄 입증 책임을 진다.","증거 충분성 판단은 피고인이 한다."], answer: 1, explanation: "입증이 불충분하면 피고인에게 유리한 판단을 내린다고 명시되어 있어 ②가 추론 가능합니다." },
    { id: "lq3", type: "빈칸추론", difficulty: 4, passage: `계약 당사자가 일방적으로 계약 내용을 변경하려 하면 상대방의 동의가 필요하다. 일방이 동의 없이 내용을 변경하면 이는 계약 위반이며, 상대방은 ( ㉠ )을(를) 청구할 수 있다.`, question: "㉠에 들어갈 가장 적절한 말은?", options: ["청약 철회","손해배상","묵시적 승인","계약 갱신","법률 해석"], answer: 1, explanation: "계약 위반 시 피해 당사자는 손해배상을 청구할 수 있습니다. ②가 정답입니다." },
    { id: "lq4", type: "강화·약화", difficulty: 5, passage: `[주장] 법관은 판결 시 성문법 조항만을 근거로 해야 한다.\n[근거] 법적 안정성과 예측 가능성을 확보하기 위해서는 판사의 자의적 해석을 배제해야 한다.`, question: "위 주장을 가장 약화하는 것은?", options: ["성문법은 모든 사회 현상을 규율하기에 충분하다.","법적 안정성은 사법부 신뢰의 핵심이다.","성문법의 흠결이 발생하면 판사의 법 해석이 불가피하다.","법관의 자의적 해석은 법치주의를 훼손한다.","성문법 체계는 지속적으로 개정·보완된다."], answer: 2, explanation: "성문법의 흠결(빈 공간)이 있을 때 판사 해석이 필요하다는 ③은 '성문법만 근거로' 해야 한다는 주장을 직접 약화합니다." },
  ],
  reason: [
    { id: "rq1", type: "형식논리", difficulty: 2, passage: `• 모든 변호사는 법학대학원을 졸업했다.\n• 갑은 변호사이다.`, question: "반드시 참인 결론은?", options: ["갑은 판사이다.","갑은 법학대학원을 졸업했다.","법학대학원 졸업생은 모두 변호사이다.","갑은 검사가 아니다.","모든 법학대학원 졸업생은 변호사이다."], answer: 1, explanation: "전건 긍정(모든 변호사→법대 졸업 + 갑은 변호사)으로 갑은 법대를 졸업했습니다. ②" },
    { id: "rq2", type: "논증강화", difficulty: 3, passage: `[주장] 영장 없는 체포는 허용되어선 안 된다.\n[근거] 신체의 자유는 헌법이 보장하는 기본권으로, 법적 절차 없이 제한될 수 없다.`, question: "이 논증을 가장 강화하는 것은?", options: ["긴급 상황에선 영장 없이도 체포가 허용된다.","헌법재판소가 영장주의를 핵심 기본권 보장 원칙으로 확인했다.","체포 절차가 복잡하면 범인 검거율이 낮아진다.","일부 국가는 영장 없는 체포를 광범위하게 허용한다.","피의자가 증거를 인멸할 가능성이 있다."], answer: 1, explanation: "헌법재판소 판결로 영장주의가 기본권 원칙임이 확인되면 논증의 근거를 직접 강화합니다. ②" },
    { id: "rq3", type: "법적추론", difficulty: 4, passage: `[법 규정] 타인의 재물을 그 의사에 반하여 취득하면 절도죄가 성립한다.\n[사실관계] 갑은 을의 동의 없이 을의 지갑에서 돈을 꺼냈다.`, question: "법적 삼단논법에 따른 결론은?", options: ["갑에게 절도 고의가 없으면 절도죄가 성립하지 않는다.","갑은 을의 의사에 반하여 재물을 취득했으므로 절도죄가 성립한다.","소액이면 절도죄가 아닌 경범죄가 적용된다.","을이 사후에 용서하면 절도죄가 소멸된다.","갑이 돌려줄 의사가 있었으므로 절도죄가 성립하지 않는다."], answer: 1, explanation: "대전제(의사에 반한 취득→절도죄) + 소전제(갑은 동의 없이 취득) → 결론: 절도죄 성립. ②" },
    { id: "rq4", type: "퍼즐추리", difficulty: 5, passage: `A, B, C, D, E 다섯 명이 원형 테이블에 앉는다.\n• A의 바로 오른쪽은 B이다.\n• C와 D는 인접하지 않는다.\n• E는 A와 마주 보지 않는다.\n• B의 바로 오른쪽은 C가 아니다.`, question: "가능한 배치는? (시계 방향 순서)", options: ["A-B-D-E-C","A-B-E-C-D","A-B-C-D-E","A-B-D-C-E","A-B-E-D-C"], answer: 0, explanation: "A-B 고정(조건1). B 오른쪽은 C 불가(조건4)→D 또는 E. C와 D 비인접(조건3). A-B-D-E-C: C-D 비인접✓, E-A 인접(마주보기 아님)✓ → ①이 유일하게 모든 조건 충족." },
  ],
  strategy: [
    { id: "sq1", type: "시간전략", difficulty: 1, passage: null, question: "언어이해 30문항 70분일 때 문항당 평균 허용 시간은?", options: ["약 1분 30초","약 2분 20초","약 3분","약 2분 50초","약 1분 50초"], answer: 1, explanation: "70분 ÷ 30문항 ≈ 2.33분 = 약 2분 20초입니다. 추리논증은 125분 ÷ 40문항 = 약 3분 8초예요." },
    { id: "sq2", type: "오답분석", difficulty: 2, passage: null, question: "오답 노트 활용법으로 가장 적절한 것은?", options: ["틀린 문제를 그대로 베껴 쓴다.","틀린 이유를 독해 실수/논리 오류/시간 부족으로 분류해 패턴을 찾는다.","정답만 표시하고 해설은 읽지 않는다.","오답은 다시 풀지 않는다.","틀린 수만 날짜별로 기록한다."], answer: 1, explanation: "이유 분류와 패턴 파악이 핵심입니다. ②" },
    { id: "sq3", type: "기출분석", difficulty: 3, passage: null, question: "기출 분석 시 가장 먼저 해야 할 것은?", options: ["가장 어려운 문제만 반복 풀기","최근 5개년 출제 패턴·난이도 트렌드 파악","시간 재지 않고 처음부터 끝까지 풀기","정답률 높은 쉬운 문제만 풀기","해설서를 처음부터 읽기"], answer: 1, explanation: "출제 트렌드 파악이 학습 방향 설정의 첫 단계입니다. ②" },
    { id: "sq4", type: "모의고사", difficulty: 4, passage: null, question: "다음 중 LEET 고득점자들의 공통 학습 전략으로 가장 거리가 먼 것은?", options: ["오답 원인을 유형별로 분류하여 약점을 체계적으로 보완한다.","실전과 동일한 환경에서 시간을 재고 모의고사를 푼다.","점수가 낮게 나온 회차는 분석 없이 넘어가고 새 문제에 집중한다.","기출 지문을 반복 독해하여 출제자의 의도와 문항 구조를 파악한다.","틀린 문제를 2주 뒤 다시 풀어 장기 기억으로 전환한다."], answer: 2, explanation: "점수가 낮을수록 분석이 더 중요합니다. ③처럼 분석 없이 넘어가는 것은 고득점 전략과 정반대입니다." },
  ]
};

// ─────────────────────────────────────────────
// AI QUESTION GENERATOR
// ─────────────────────────────────────────────
const PROMPTS = {
  lang: (difficulty) => `당신은 LEET(법학적성시험) 언어이해 문제 출제 전문가입니다.
난이도 ${difficulty}/5짜리 언어이해 문제를 1개 만들어주세요.
난이도가 높을수록: 지문이 길고 복잡한 법철학·법이론 내용, 함정 선지가 많고 정교함, 추론 단계가 복잡함.

반드시 아래 JSON 형식만 출력하세요 (다른 텍스트 없이):
{
  "type": "독해|추론|빈칸추론|강화·약화 중 하나",
  "difficulty": ${difficulty},
  "passage": "지문 (3~6문장, 법철학·계약법·형사법·헌법 관련)",
  "question": "질문",
  "options": ["①선지","②선지","③선지","④선지","⑤선지"],
  "answer": 정답인덱스(0~4),
  "explanation": "해설 (왜 정답인지, 왜 오답이 틀렸는지 명확히)"
}`,

  reason: (difficulty) => `당신은 LEET(법학적성시험) 추리논증 문제 출제 전문가입니다.
난이도 ${difficulty}/5짜리 추리논증 문제를 1개 만들어주세요.
유형: 형식논리, 논증강화·약화, 법적추론, 퍼즐배열 중 하나.
난이도가 높을수록: 전제가 복잡하고, 함정이 교묘하며, 다단계 추론 필요.

반드시 아래 JSON 형식만 출력하세요:
{
  "type": "형식논리|논증강화|법적추론|퍼즐추리 중 하나",
  "difficulty": ${difficulty},
  "passage": "조건/지문 (법적 맥락 포함)",
  "question": "질문",
  "options": ["①선지","②선지","③선지","④선지","⑤선지"],
  "answer": 정답인덱스(0~4),
  "explanation": "단계별 명확한 해설"
}`,

  strategy: (difficulty) => `당신은 LEET(법학적성시험) 학습 전략 전문가입니다.
난이도 ${difficulty}/5짜리 LEET 학습 전략 퀴즈를 1개 만들어주세요.
주제: 시간 관리, 오답 분석, 기출 활용, 학습 계획, 멘탈 관리 중 하나.
난이도가 높을수록: 미묘한 차이를 구별해야 하고, 전문적인 전략 지식 필요.

반드시 아래 JSON 형식만 출력하세요:
{
  "type": "시간전략|오답분석|기출분석|모의고사 중 하나",
  "difficulty": ${difficulty},
  "passage": null,
  "question": "질문",
  "options": ["①선지","②선지","③선지","④선지","⑤선지"],
  "answer": 정답인덱스(0~4),
  "explanation": "해설"
}`
};

async function generateQuestion(tab, difficulty) {
  const apiKey = process.env.REACT_APP_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("API 키가 없습니다.");
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: PROMPTS[tab](difficulty) }]
    })
  });
  const data = await response.json();
  const text = data.content?.map(b => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);
  return { ...parsed, id: `ai_${Date.now()}`, isAI: true };
}

// ─────────────────────────────────────────────
// QUIZ CARD
// ─────────────────────────────────────────────
function QuizCard({ q, idx, total, color, onNext, onPrev, onNewAI, isGenerating, sessionStats }) {
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const correct = selected === q.answer;

  const handleNext = () => { setSelected(null); setRevealed(false); onNext(); };
  const handlePrev = () => { setSelected(null); setRevealed(false); onPrev(); };
  const handleReset = () => { setSelected(null); setRevealed(false); };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      {/* Stats bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18, padding: "10px 16px", background: "#0F0F1A", borderRadius: 12, border: "1px solid #1E2030" }}>
        <div style={{ fontSize: 11, color: "#475569" }}>세션</div>
        <div style={{ display: "flex", gap: 10 }}>
          <span style={{ fontSize: 12, color: "#34D399", fontWeight: 700 }}>✓ {sessionStats.correct}</span>
          <span style={{ fontSize: 12, color: "#EF4444", fontWeight: 700 }}>✗ {sessionStats.wrong}</span>
        </div>
        <div style={{ flex: 1, height: 4, background: "#1E293B", borderRadius: 4, overflow: "hidden" }}>
          {sessionStats.total > 0 && <div style={{ height: "100%", width: `${Math.round(sessionStats.correct / sessionStats.total * 100)}%`, background: "linear-gradient(90deg,#34D399,#2DD4BF)", borderRadius: 4, transition: "width 0.5s" }} />}
        </div>
        <div style={{ fontSize: 11, color: "#64748B" }}>정답률 {sessionStats.total > 0 ? Math.round(sessionStats.correct / sessionStats.total * 100) : 0}%</div>
        {q.isAI && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: "#818CF822", color: "#818CF8", border: "1px solid #818CF844", fontWeight: 700 }}>✨ AI 생성</span>}
      </div>

      {/* Question header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontWeight: 700, background: (TYPE_COLOR[q.type] || color) + "22", color: TYPE_COLOR[q.type] || color, border: `1px solid ${TYPE_COLOR[q.type] || color}44` }}>{q.type}</span>
          <span style={{ fontSize: 12, color: "#F59E0B" }}>{DIFF_LABEL[q.difficulty]}</span>
        </div>
        <span style={{ fontSize: 12, color: "#475569" }}>{idx + 1} / {total}</span>
      </div>

      {/* Passage */}
      {q.passage && (
        <div style={{ background: "#12121F", border: "1px solid #1E2030", borderLeft: `3px solid ${color}`, borderRadius: "0 12px 12px 0", padding: "16px 20px", marginBottom: 18, fontSize: 13.5, color: "#CBD5E1", lineHeight: 1.95, whiteSpace: "pre-line" }}>
          {q.passage}
        </div>
      )}

      {/* Question */}
      <div style={{ fontSize: 15.5, fontWeight: 700, color: "#F1F5F9", marginBottom: 18, lineHeight: 1.6 }}>{q.question}</div>

      {/* Options */}
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
        {q.options.map((opt, i) => {
          let bg = "#12121F", border = "#1E2030", textColor = "#CBD5E1", icon = i + 1;
          if (revealed) {
            if (i === q.answer) { bg = "#0D2B1E"; border = "#34D399"; textColor = "#34D399"; icon = "✓"; }
            else if (i === selected && selected !== q.answer) { bg = "#2B0D0D"; border = "#EF4444"; textColor = "#EF4444"; icon = "✗"; }
          } else if (selected === i) {
            bg = color + "11"; border = color; textColor = "#F1F5F9";
          }
          return (
            <button key={i} onClick={() => { if (!revealed) setSelected(i); }}
              style={{ background: bg, border: `1px solid ${border}`, borderRadius: 10, padding: "13px 16px", textAlign: "left", cursor: revealed ? "default" : "pointer", color: textColor, fontSize: 13.5, fontWeight: selected === i || (revealed && i === q.answer) ? 700 : 400, transition: "all 0.2s", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ minWidth: 24, height: 24, borderRadius: "50%", background: revealed && i === q.answer ? "#34D399" : revealed && i === selected && selected !== q.answer ? "#EF4444" : selected === i ? color : "#1E293B", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0, marginTop: 1 }}>{icon}</span>
              {opt}
            </button>
          );
        })}
      </div>

      {/* Reveal */}
      {selected !== null && !revealed && (
        <button onClick={() => setRevealed(true)} style={{ width: "100%", padding: 13, borderRadius: 10, marginBottom: 16, background: `linear-gradient(135deg,${color},${color}99)`, border: "none", color: "#000", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>
          정답 확인 →
        </button>
      )}

      {/* Explanation */}
      {revealed && (
        <div style={{ background: correct ? "#0D2B1E" : "#2B0D0D", border: `1px solid ${correct ? "#34D399" : "#EF4444"}55`, borderRadius: 12, padding: "16px 20px", marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: correct ? "#34D399" : "#EF4444", marginBottom: 8 }}>
            {correct ? "✅ 정답!" : "❌ 오답"}
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", lineHeight: 1.85 }}>
            <span style={{ fontWeight: 700, color: "#CBD5E1" }}>해설 </span>{q.explanation}
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={handlePrev} disabled={idx === 0}
          style={{ flex: 1, padding: 11, borderRadius: 10, border: "1px solid #1E2030", background: "#12121F", color: idx === 0 ? "#334155" : "#94A3B8", cursor: idx === 0 ? "not-allowed" : "pointer", fontWeight: 600, fontSize: 13 }}>← 이전</button>
        <button onClick={handleReset}
          style={{ padding: "11px 14px", borderRadius: 10, border: "1px solid #1E2030", background: "#12121F", color: "#64748B", cursor: "pointer", fontSize: 12 }}>↺</button>
        {idx < total - 1 ? (
          <button onClick={handleNext}
            style={{ flex: 1, padding: 11, borderRadius: 10, border: `1px solid ${color}44`, background: color + "22", color, cursor: "pointer", fontWeight: 600, fontSize: 13 }}>다음 →</button>
        ) : (
          <button onClick={onNewAI} disabled={isGenerating}
            style={{ flex: 2, padding: 11, borderRadius: 10, border: `1px solid ${color}66`, background: isGenerating ? "#1E293B" : `linear-gradient(135deg,${color}33,${color}11)`, color: isGenerating ? "#475569" : color, cursor: isGenerating ? "not-allowed" : "pointer", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            {isGenerating ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> AI 생성 중...</> : "✨ AI 새 문제 생성"}
          </button>
        )}
      </div>

      {/* Generate next AI anytime */}
      {idx === total - 1 && !isGenerating && (
        <div style={{ marginTop: 10, textAlign: "center", fontSize: 11, color: "#334155" }}>
          문제를 다 풀면 AI가 더 어려운 문제를 자동 생성합니다
        </div>
      )}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function LEETMap() {
  const [activeSection, setActiveSection] = useState("lang");
  const [activeTopic, setActiveTopic] = useState(null);
  const [masteries, setMasteries] = useState({});
  const [view, setView] = useState("map");

  // Quiz state
  const [quizTab, setQuizTab] = useState("lang");
  const [questions, setQuestions] = useState({ lang: [], reason: [], strategy: [] });
  const [quizIdx, setQuizIdx] = useState({ lang: 0, reason: 0, strategy: 0 });
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0, total: 0 });
  const [answeredSet, setAnsweredSet] = useState(new Set());
  const [autoLoaded, setAutoLoaded] = useState({ lang: false, reason: false, strategy: false });

  const section = LEET_DATA.sections.find(s => s.id === activeSection);
  const setMastery = (id, val) => setMasteries(p => ({ ...p, [id]: val }));
  const getMastery = (id) => masteries[id] ?? 0;
  const totalTopics = LEET_DATA.sections.flatMap(s => s.topics);
  const avgMastery = totalTopics.length ? Math.round(totalTopics.reduce((a, t) => a + getMastery(t.id), 0) / totalTopics.length) : 0;
  const allTopics = LEET_DATA.sections.flatMap(s => s.topics.map(t => ({ ...t, sectionColor: s.color })));

  const curQList = questions[quizTab];
  const curQIdx = quizIdx[quizTab];
  const curQ = curQList[curQIdx];
  const quizColor = QUIZ_TABS.find(t => t.id === quizTab)?.color || "#2DD4BF";

  // 퀴즈 탭 열릴 때 문제 없으면 자동 생성
  useEffect(() => {
    if (view === "quiz" && !autoLoaded[quizTab] && curQList.length === 0 && !isGenerating) {
      setAutoLoaded(p => ({ ...p, [quizTab]: true }));
      handleGenerateAI(quizTab);
    }
  }, [view, quizTab]);

  // Adaptive difficulty: increase as user answers correctly
  const getNextDifficulty = useCallback(() => {
    const base = Math.min(5, Math.max(1, Math.ceil(sessionStats.correct / 2) + 2));
    return Math.min(5, base);
  }, [sessionStats.correct]);

  const handleRevealAnswer = useCallback((questionId, isCorrect) => {
    if (answeredSet.has(questionId)) return;
    setAnsweredSet(prev => new Set([...prev, questionId]));
    setSessionStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      wrong: prev.wrong + (isCorrect ? 0 : 1),
      total: prev.total + 1
    }));
  }, [answeredSet]);

  const handleGenerateAI = useCallback(async (tabOverride) => {
    const tab = tabOverride || quizTab;
    setIsGenerating(true);
    setGenError(null);
    try {
      const difficulty = getNextDifficulty();
      const newQ = await generateQuestion(tab, difficulty);
      setQuestions(prev => {
        const updated = [...prev[tab], newQ];
        setQuizIdx(p => ({ ...p, [tab]: updated.length - 1 }));
        return { ...prev, [tab]: updated };
      });
    } catch (e) {
      setGenError("AI 생성 실패: " + (e.message || "다시 시도해주세요"));
    } finally {
      setIsGenerating(false);
    }
  }, [quizTab, getNextDifficulty]);

  // Auto-track answers when card reveals
  const TrackedQuizCard = useCallback((props) => {
    return (
      <QuizCard
        {...props}
        onReveal={(isCorrect) => handleRevealAnswer(props.q.id, isCorrect)}
      />
    );
  }, [handleRevealAnswer]);

  return (
    <div style={{ minHeight: "100vh", background: "#09090F", color: "#E2E8F0", fontFamily: "'Noto Sans KR','Apple SD Gothic Neo',sans-serif", display: "flex", flexDirection: "column" }}>

      {/* NAV */}
      <div style={{ background: "#0F0F1A", borderBottom: "1px solid #1E2030", padding: "12px 22px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#2DD4BF,#F59E0B)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17 }}>⚖️</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 15, color: "#F1F5F9" }}>LEET 지식 맵</div>
            <div style={{ fontSize: 10, color: "#475569" }}>법학적성시험 전략 로드맵</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {[{ id: "map", label: "📚 개념 맵" }, { id: "quiz", label: "✏️ 연습 문제" }, { id: "strategy", label: "🎯 전략" }, { id: "progress", label: "📊 진도" }].map(t => (
            <button key={t.id} onClick={() => setView(t.id)} style={{ background: view === t.id ? "#1E293B" : "transparent", border: view === t.id ? "1px solid #334155" : "1px solid transparent", borderRadius: 7, padding: "5px 11px", color: view === t.id ? "#F1F5F9" : "#64748B", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>{t.label}</button>
          ))}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#64748B" }}>숙련도</span>
          <div style={{ width: 90, height: 5, background: "#1E293B", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${avgMastery}%`, background: "linear-gradient(90deg,#2DD4BF,#F59E0B)", transition: "width 0.5s" }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#F1F5F9" }}>{avgMastery}%</span>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ══ MAP ══ */}
        {view === "map" && (
          <>
            <div style={{ width: 56, background: "#0F0F1A", borderRight: "1px solid #1E2030", display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 0", gap: 7 }}>
              {LEET_DATA.sections.map(s => (
                <button key={s.id} onClick={() => { setActiveSection(s.id); setActiveTopic(null); }} title={s.title}
                  style={{ width: 40, height: 40, borderRadius: 11, background: activeSection === s.id ? s.bg : "transparent", border: activeSection === s.id ? `2px solid ${s.color}` : "2px solid transparent", fontSize: 19, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {s.icon}
                </button>
              ))}
            </div>
            <div style={{ width: 260, background: "#0C0C18", borderRight: "1px solid #1E2030", display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ padding: "13px 15px 10px", borderBottom: "1px solid #1E2030" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: 15 }}>{section.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: section.color }}>{section.title}</span>
                </div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 3 }}>{section.description}</div>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 9 }}>
                {section.topics.map(topic => {
                  const m = getMastery(topic.id);
                  const isActive = activeTopic?.id === topic.id;
                  return (
                    <button key={topic.id} onClick={() => setActiveTopic(isActive ? null : topic)}
                      style={{ width: "100%", textAlign: "left", background: isActive ? section.bg : "#12121F", border: isActive ? `1px solid ${section.color}44` : "1px solid #1E2030", borderRadius: 11, padding: "10px 12px", marginBottom: 6, cursor: "pointer", transition: "all 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? section.color : "#CBD5E1" }}>{topic.title}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 6, background: WEIGHT_COLOR[topic.weight] + "22", color: WEIGHT_COLOR[topic.weight] }}>{topic.weight}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, height: 3, background: "#1E293B", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${m}%`, background: section.color, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 10, color: "#475569" }}>{m}%</span>
                      </div>
                      <div style={{ fontSize: 9, color: "#334155", marginTop: 4 }}>
                        <span style={{ color: "#F59E0B" }}>{DIFF_LABEL[topic.difficulty]}</span> · {topic.time}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 22 }}>
              {!activeTopic ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                  <div style={{ fontSize: 12, color: "#334155", marginBottom: 22 }}>← 영역을 클릭해 세부 내용 확인</div>
                  <div style={{ position: "relative", width: 460, height: 290 }}>
                    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
                      <line x1="230" y1="70" x2="230" y2="215" stroke="#334155" strokeWidth="1.5" strokeDasharray="5 4" />
                      <line x1="115" y1="140" x2="345" y2="140" stroke="#334155" strokeWidth="1.5" strokeDasharray="5 4" />
                      <line x1="70" y1="190" x2="390" y2="95" stroke="#818CF866" strokeWidth="2" />
                    </svg>
                    {[
                      { label: "언어이해", x: 170, y: 52, color: "#2DD4BF", size: 58, icon: "📖" },
                      { label: "추리논증", x: 240, y: 190, color: "#F59E0B", size: 58, icon: "⚖️" },
                      { label: "독해 기반", x: 52, y: 118, color: "#2DD4BF88", size: 40 },
                      { label: "추론·응용", x: 70, y: 193, color: "#2DD4BF88", size: 40 },
                      { label: "형식논리", x: 355, y: 93, color: "#F59E0B88", size: 40 },
                      { label: "논증 분석", x: 372, y: 192, color: "#F59E0B88", size: 40 },
                      { label: "법적 추론", x: 267, y: 258, color: "#8B5CF688", size: 40 },
                    ].map((n, i) => (
                      <div key={i} style={{ position: "absolute", left: n.x - n.size / 2, top: n.y - n.size / 2, width: n.size, height: n.size, borderRadius: "50%", background: n.color + "22", border: `2px solid ${n.color}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontSize: n.size > 52 ? 10 : 8, color: n.color, fontWeight: 700, textAlign: "center", padding: 2 }}>
                        {n.icon && <span style={{ fontSize: 14 }}>{n.icon}</span>}
                        <span style={{ lineHeight: 1.2 }}>{n.label}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 16, fontSize: 11, color: "#475569", textAlign: "center" }}>
                    언어이해 <span style={{ color: "#2DD4BF" }}>추론·응용</span>↔ 추리논증 <span style={{ color: "#F59E0B" }}>논증 분석</span> 스킬 공유
                  </div>
                </div>
              ) : (
                <div style={{ maxWidth: 620 }}>
                  <div style={{ background: section.bg, border: `1px solid ${section.color}33`, borderRadius: 13, padding: "16px 20px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>{section.icon}</span>
                      <span style={{ fontSize: 17, fontWeight: 900, color: section.color }}>{activeTopic.title}</span>
                      <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 7, background: WEIGHT_COLOR[activeTopic.weight] + "22", color: WEIGHT_COLOR[activeTopic.weight], fontWeight: 700 }}>{activeTopic.weight}</span>
                    </div>
                    <div style={{ display: "flex", gap: 16, fontSize: 11, color: "#64748B" }}>
                      <span>난이도: <span style={{ color: "#F59E0B" }}>{DIFF_LABEL[activeTopic.difficulty]}</span></span>
                      <span>출제 비중: <span style={{ color: section.color }}>{activeTopic.time}</span></span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 9 }}>📌 세부 항목</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                      {activeTopic.subtopics.map((sub, i) => (
                        <div key={i} style={{ background: "#12121F", border: "1px solid #1E2030", borderRadius: 9, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: section.color + "22", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: section.color, fontWeight: 800, flexShrink: 0 }}>{i + 1}</div>
                          <span style={{ fontSize: 12, color: "#CBD5E1" }}>{sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: "#131320", border: "1px solid #818CF822", borderRadius: 11, padding: "13px 17px", marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#818CF8", marginBottom: 7 }}>💡 학습 팁</div>
                    <div style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.8 }}>{activeTopic.tips}</div>
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 9 }}>🔗 연결 개념</div>
                    <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                      {activeTopic.linked.map(lid => {
                        const linked = allTopics.find(t => t.id === lid);
                        if (!linked) return null;
                        return (
                          <button key={lid} onClick={() => { const sec = LEET_DATA.sections.find(s => s.topics.some(t => t.id === lid)); if (sec) { setActiveSection(sec.id); setActiveTopic(sec.topics.find(t => t.id === lid)); } }}
                            style={{ background: linked.sectionColor + "11", border: `1px solid ${linked.sectionColor}44`, borderRadius: 18, padding: "4px 11px", color: linked.sectionColor, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                            → {linked.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ background: "#0F0F1A", border: `1px solid ${section.color}33`, borderRadius: 11, padding: "14px 17px" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: section.color, marginBottom: 11 }}>📈 나의 숙련도</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[0, 20, 40, 60, 80, 100].map(val => (
                        <button key={val} onClick={() => setMastery(activeTopic.id, val)}
                          style={{ padding: "6px 12px", borderRadius: 18, fontSize: 11, fontWeight: 700, cursor: "pointer", background: getMastery(activeTopic.id) === val ? section.color : "#1E293B", color: getMastery(activeTopic.id) === val ? "#000" : "#64748B", border: getMastery(activeTopic.id) === val ? `1px solid ${section.color}` : "1px solid #334155" }}>
                          {["미시작","입문","기초","중급","고급","완료"][val / 20]} {val}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ QUIZ ══ */}
        {view === "quiz" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Sub-tabs + difficulty indicator */}
            <div style={{ background: "#0F0F1A", borderBottom: "1px solid #1E2030", padding: "9px 22px", display: "flex", gap: 7, alignItems: "center" }}>
              {QUIZ_TABS.map(t => (
                <button key={t.id} onClick={() => setQuizTab(t.id)}
                  style={{ background: quizTab === t.id ? t.color + "22" : "transparent", border: quizTab === t.id ? `1px solid ${t.color}55` : "1px solid transparent", borderRadius: 18, padding: "5px 15px", color: quizTab === t.id ? t.color : "#64748B", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>{t.label}</button>
              ))}
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 11, color: "#475569" }}>
                  다음 AI 난이도: <span style={{ color: "#F59E0B", fontWeight: 800 }}>{DIFF_LABEL[getNextDifficulty()]}</span>
                </div>
                <div style={{ display: "flex", gap: 3 }}>
                  {curQList.map((_, i) => (
                    <div key={i} onClick={() => setQuizIdx(p => ({ ...p, [quizTab]: i }))}
                      style={{ width: 7, height: 7, borderRadius: "50%", background: i === curQIdx ? quizColor : curQList[i]?.isAI ? "#818CF844" : "#1E293B", border: `1px solid ${i === curQIdx ? quizColor : "#334155"}`, cursor: "pointer", transition: "all 0.2s" }} />
                  ))}
                </div>
              </div>
            </div>

            {genError && (
              <div style={{ background: "#2B0D0D", border: "1px solid #EF444444", borderRadius: 9, padding: "10px 16px", margin: "12px 22px 0", fontSize: 12, color: "#EF4444" }}>
                ⚠️ {genError} — API 키가 설정되어 있는지 확인해주세요.
              </div>
            )}

            <div style={{ flex: 1, overflowY: "auto", padding: 26 }}>
              {curQList.length === 0 ? (
                <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
                  <div style={{ fontSize: 48, animation: "spin 1.5s linear infinite" }}>⟳</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: quizColor }}>AI가 문제를 생성하고 있어요...</div>
                  <div style={{ fontSize: 13, color: "#475569" }}>잠깐만 기다려주세요 😊</div>
                  <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : (
              <QuizCard
                key={`${quizTab}-${curQIdx}`}
                q={curQList[curQIdx]}
                idx={curQIdx}
                total={curQList.length}
                color={quizColor}
                sessionStats={sessionStats}
                isGenerating={isGenerating}
                onNext={() => setQuizIdx(p => ({ ...p, [quizTab]: Math.min(p[quizTab] + 1, curQList.length - 1) }))}
                onPrev={() => setQuizIdx(p => ({ ...p, [quizTab]: Math.max(p[quizTab] - 1, 0) }))}
                onNewAI={handleGenerateAI}
              />
              )}
            </div>
          </div>
        )}

        {/* ══ STRATEGY ══ */}
        {view === "strategy" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 26 }}>
            <div style={{ maxWidth: 760, margin: "0 auto" }}>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#F1F5F9", marginBottom: 5 }}>🎯 LEET 합격 전략</div>
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 22 }}>점수를 올리는 검증된 학습 전략</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 13, marginBottom: 22 }}>
                {LEET_DATA.strategies.map(s => (
                  <div key={s.id} style={{ background: "#0F0F1A", border: `1px solid ${s.color}33`, borderRadius: 13, padding: "17px 19px" }}>
                    <div style={{ fontSize: 24, marginBottom: 7 }}>{s.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: s.color, marginBottom: 6 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ background: "#0F0F1A", border: "1px solid #1E2030", borderRadius: 13, padding: 20 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F5F9", marginBottom: 16 }}>📅 주간 학습 권장 플랜</div>
                {[{ day: "월·화", focus: "언어이해 기출 독해", detail: "지문 10개 정독 + 선지 분석", color: "#2DD4BF" }, { day: "수·목", focus: "추리논증 논리 훈련", detail: "형식논리 집중 + 논증 분석 20문항", color: "#F59E0B" }, { day: "금", focus: "약점 보완", detail: "오답 노트 리뷰 + 개념 재정리", color: "#818CF8" }, { day: "토", focus: "실전 모의고사", detail: "시간 재고 전체 풀이 + 분석", color: "#F472B6" }, { day: "일", focus: "복습 & 어휘", detail: "한자어·법학 배경지식 보충", color: "#34D399" }].map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, padding: "10px 0", borderBottom: i < 4 ? "1px solid #1E2030" : "none" }}>
                    <div style={{ minWidth: 46, height: 32, borderRadius: 8, background: d.color + "22", border: `1px solid ${d.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: d.color }}>{d.day}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#E2E8F0" }}>{d.focus}</div>
                      <div style={{ fontSize: 11, color: "#475569" }}>{d.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ PROGRESS ══ */}
        {view === "progress" && (
          <div style={{ flex: 1, overflowY: "auto", padding: 26 }}>
            <div style={{ maxWidth: 640, margin: "0 auto" }}>
              <div style={{ fontSize: 19, fontWeight: 900, color: "#F1F5F9", marginBottom: 5 }}>📊 내 학습 진도</div>
              <div style={{ fontSize: 12, color: "#475569", marginBottom: 22 }}>개념 맵에서 숙련도를 설정하면 여기에 반영됩니다</div>

              {/* Quiz session summary */}
              <div style={{ background: "#0F0F1A", border: "1px solid #818CF833", borderRadius: 13, padding: "18px 20px", marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#818CF8", marginBottom: 14 }}>✏️ 오늘 문제 풀이 세션</div>
                <div style={{ display: "flex", gap: 16 }}>
                  {[{ label: "푼 문제", val: sessionStats.total, color: "#CBD5E1" }, { label: "정답", val: sessionStats.correct, color: "#34D399" }, { label: "오답", val: sessionStats.wrong, color: "#EF4444" }, { label: "정답률", val: sessionStats.total > 0 ? `${Math.round(sessionStats.correct / sessionStats.total * 100)}%` : "-", color: "#F59E0B" }].map(s => (
                    <div key={s.label} style={{ flex: 1, background: "#12121F", border: "1px solid #1E2030", borderRadius: 10, padding: "12px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{s.val}</div>
                      <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>{s.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, fontSize: 11, color: "#475569" }}>
                  AI 생성 문제: <span style={{ color: "#818CF8", fontWeight: 700 }}>{[...Object.values(questions)].flat().filter(q => q.isAI).length}개</span>
                </div>
              </div>

              {LEET_DATA.sections.map(s => {
                const avg = Math.round(s.topics.reduce((a, t) => a + getMastery(t.id), 0) / s.topics.length);
                return (
                  <div key={s.id} style={{ background: "#0F0F1A", border: `1px solid ${s.color}22`, borderRadius: 13, padding: "19px 21px", marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <span style={{ fontSize: 17 }}>{s.icon}</span>
                        <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>{s.title}</span>
                      </div>
                      <span style={{ fontSize: 21, fontWeight: 900, color: avg >= 70 ? "#34D399" : avg >= 40 ? s.color : "#EF4444" }}>{avg}%</span>
                    </div>
                    {s.topics.map(t => {
                      const m = getMastery(t.id);
                      return (
                        <div key={t.id} style={{ marginBottom: 9 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                            <span style={{ fontSize: 12, color: "#CBD5E1" }}>{t.title}</span>
                            <span style={{ fontSize: 11, color: m >= 80 ? "#34D399" : "#64748B" }}>{m}%</span>
                          </div>
                          <div style={{ height: 5, background: "#1E293B", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${m}%`, background: m >= 80 ? "#34D399" : m >= 50 ? s.color : "#EF4444", borderRadius: 4, transition: "width 0.4s" }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <div style={{ background: avgMastery >= 70 ? "#0D2B29" : avgMastery >= 40 ? "#1A1A2E" : "#2B0D0D", border: `1px solid ${avgMastery >= 70 ? "#2DD4BF" : avgMastery >= 40 ? "#818CF8" : "#EF4444"}44`, borderRadius: 13, padding: "17px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 5, color: avgMastery >= 70 ? "#2DD4BF" : avgMastery >= 40 ? "#818CF8" : "#EF4444" }}>{avgMastery}%</div>
                <div style={{ fontSize: 13, color: "#94A3B8" }}>
                  {avgMastery >= 80 ? "🏆 완성! 실전 모의고사 집중" : avgMastery >= 60 ? "💪 고급! 약점 파트 집중 공략" : avgMastery >= 40 ? "📚 중급! 꾸준히 유지" : avgMastery >= 20 ? "🌱 기초! 기출 분석부터" : "✨ 개념 맵에서 숙련도를 기록하세요"}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
