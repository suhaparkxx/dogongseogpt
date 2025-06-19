import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import "dotenv/config";

// ✅ 환경변수 불러오기
const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
});

// ✅ chunks.txt 읽기
const filePath = "./chunks.txt";
const chunks = fs.readFileSync(filePath, "utf8").split("\n").filter(Boolean);

// ✅ 업로드 함수
async function embedChunks() {
  for (const text of chunks) {
    try {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text,
      });

      const { error } = await supabase.from("embeddings").insert({
        content: text,
        embedding: embedding.data[0].embedding,
      });

      if (error) console.error("❌ Supabase 업로드 실패:", error.message);
      else console.log("✅ 업로드 성공");
    } catch (err) {
      console.error("❌ 오류:", err.message);
    }
  }
}

embedChunks();
