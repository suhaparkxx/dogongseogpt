// api/openai.js
export default async function handler(req, res) {
  if (req.method === 'POST') {
    const apiKey = process.env.OPENAI_API_KEY;  // 환경 변수에서 API 키를 가져옵니다
    const url = 'https://api.openai.com/v1/chat/completions';  // OpenAI API URL

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4",  // 사용할 모델
          messages: req.body.messages,  // 클라이언트에서 받은 messages
          temperature: 0.2  // 응답 다양성 설정
        })
      });

      const data = await response.json();
      res.status(200).json(data);  // OpenAI API 응답을 클라이언트로 전달
    } catch (error) {
      console.error("❌ OpenAI API 호출 오류:", error);
      res.status(500).json({ error: 'OpenAI API 호출에 실패했습니다.' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });  // 허용되지 않은 HTTP 메소드
  }
}
