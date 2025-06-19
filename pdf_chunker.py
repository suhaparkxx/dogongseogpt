from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import PyPDFLoader

import sys

if len(sys.argv) != 2:
    print("❌ 사용법: python pdf_chunker.py <파일명.pdf>")
    sys.exit(1)

pdf_path = sys.argv[1]

loader = PyPDFLoader(pdf_path)
documents = loader.load()

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ".", " ", ""],
)

chunks = text_splitter.split_documents(documents)

with open("chunks.txt", "w", encoding="utf-8") as f:
    for chunk in chunks:
        f.write(chunk.page_content.strip().replace("\n", " ") + "\n")

print(f"✅ 총 {len(chunks)}개 조각으로 분할되었습니다.")
