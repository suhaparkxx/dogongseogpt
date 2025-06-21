require('dotenv').config();

const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { createClient } = require('@supabase/supabase-js');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// ✅ Supabase 연결
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

async function matchDocuments(query) {
  const embeddingRes = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'text-embedding-ada-002',
      input: query
    })
  });

  const embeddingData = await embeddingRes.json();
  const [{ embedding }] = embeddingData.data;

  // ✅ Supabase에서 유사 문서 검색
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: 5
  });

  if (error) {
    console.error('❌ Supabase match_documents 오류:', error.message);
    return [];
  }

  return data;
}

app.post('/api/openai', async (req, res) => {
  try {
    const userMessages = req.body.messages || [];
    const userQuestion = userMessages.find((msg) => msg.role === "user")?.content || "";

    console.log("📥 사용자 질문:", userQuestion);

    // ✅ Supabase에서 유사 문서 찾기
    const docs = await matchDocuments(userQuestion);
    const context = docs.map((doc) => doc.content).join("\n\n");

    // ✅ OpenAI API 호출
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `
너는 '도공서지피티'라는 이름의 스마트 전자매뉴얼이야.
아래 문서를 참고해서 신입직원에게 친절하고 정확하게 안내해줘.
문서 외의 내용은 추측하지 마.

다음은 문서 내용이야:
=======================
${context}
=======================
            `.trim()
          },
          ...userMessages
        ],
        temperature: 0.2
      })
    });

    const resultText = await response.text();
    const result = JSON.parse(resultText);

    if (!response.ok) {
      return res.status(response.status).json({ error: resultText });
    }

    res.status(200).json(result);
  } catch (error) {
    console.error("❌ 서버 내부 오류:", error.message || error);
    res.status(500).json({ error: '서버 내부 오류' });
  }
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
