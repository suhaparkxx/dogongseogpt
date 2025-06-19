import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { OpenAI } from "openai";
import { Plus, Mic, Waves } from "lucide-react";

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});



function App() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  const sampleQuestions = [
    "출퇴근 할인 시간과 비율은?",
    "감면단말기로 할인 받으려면?",
    "화물차 심야 할인 시간은?",
  ];

  const handleSend = async () => {
  if (!input.trim()) return;

  const userMessage = {
    role: "user",
    content: input,
  };

  setMessages((prev) => [...prev, userMessage]);
  setInput("");

  try {
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input,
    });

    const embedding = embeddingResponse.data[0].embedding;

    const { data: chunks, error } = await supabase.rpc("match_documents", {
      query_embedding: embedding,
      match_threshold: 0.75,
      match_count: 10,
    });

    if (error) {
      console.error("❌ Supabase match_documents 오류:", error);
      return;
    }

    const contextText = chunks.map((chunk) => chunk.content).join("\n\n");

    const systemPrompt = {
      role: "system",
      content: `
너는 '도공서지피티'라는 이름의 스마트 전자매뉴얼이야. 당신은 한국도로공사서비스의 신입직원들에게 고속도로 운영, 톨게이트 요금, 하이패스 등록, 통행료 제도 등의 영업실무에 대해 전문적인 안내를 제공해야 해.

- 무조건 친절하고, 간결하게 설명해야 해
- 한글로 대답해야 하며, 반드시 존댓말을 사용해
- 질문자가 문서를 제대로 이해하지 못한 경우를 고려해 핵심을 짚어줘야 해
- 질문자의 말에 포함되지 않은 정보라도 문서 내에서 찾을 수 있다면 명확하게 안내해줘
- 엉뚱한 추측은 절대 하지마
- 문서에 근거가 없다면 "해당 내용은 영업실무편람에 나와 있지 않습니다"라고 답해
`.trim(),
    };

    const contextMessage = {
      role: "user",
      content: `다음 문서를 참고해서 답해주세요:\n\n${contextText}\n\n질문: ${input}`,
    };

    const chatResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [systemPrompt, contextMessage],
      temperature: 0.2,
    });

    const assistantMessage = {
      role: "assistant",
      content: chatResponse.choices[0].message.content,
    };

    setMessages((prev) => [...prev, assistantMessage]);
  } catch (err) {
    console.error("❌ GPT 오류:", err);
  }
};


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col items-center px-4 py-6">
      <header className="text-center my-6">
        <div className="text-sm text-zinc-400">EXS AI 챗봇형 전자매뉴얼</div>
        <div className="text-2xl font-bold mt-2">도공서 지피티</div>
        <div className="text-sm text-zinc-400 mt-1">작성자: 수도권동부 박수하 🚀</div>
        <div className="text-sm text-zinc-400 mt-1">한국도로공사서비스 신입직원들을 위한 영업실무 전자매뉴얼</div>
        <div className="text-sm text-zinc-400 mt-1">Open AI API와 영업실무편람을 기반으로 하고 있습니다.</div>
        <div className="text-sm text-zinc-400 mt-1">✅주의사항: 현재 베타 테스트 버전이며 답변에 💡3~5초 가량💡 소요될 수 있습니다.</div>
      </header>

      <div className="flex flex-wrap justify-center gap-3 my-8">
        {sampleQuestions.map((q, i) => (
          <button
            key={i}
            className="border border-zinc-600 text-sm rounded-xl px-4 py-2 hover:bg-zinc-800"
            onClick={() => setInput(q)}
          >
            {q}
          </button>
        ))}
      </div>

      <main className="w-full max-w-2xl flex-1 overflow-y-auto mb-32 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`whitespace-pre-line max-w-xl px-4 py-3 rounded-xl text-sm ${
              msg.role === "user"
                ? "bg-blue-600 self-end ml-auto"
                : "bg-zinc-700 self-start mr-auto"
            }`}
          >
            {msg.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </main>

      <footer className="fixed bottom-4 w-full max-w-2xl px-4">
  <div className="flex items-center bg-zinc-800 rounded-2xl px-4 py-3">
    <Plus className="w-5 h-5 text-zinc-400" />
    <input
      type="text"
      className="flex-1 mx-3 bg-transparent text-white placeholder-zinc-400 focus:outline-none"
      placeholder="무엇이든 물어보세요"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && handleSend()}
    />
    <Mic className="w-5 h-5 text-zinc-400 mr-2" />
    <button
      onClick={handleSend}
      className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
      </svg>
    </button>
  </div>
</footer>

    </div>
  );
}

export default App;