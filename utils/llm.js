// 📍 llm.js 파일이 있다면 아래 내용으로 교체해주세요.

const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 간단한 sleep 함수
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function callLLM(prompt, provider = 'gemini') {
    // ⭐ 핵심 추가: 최대 3번까지 재시도
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            if (provider === 'gemini') {
                const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
                const result = await model.generateContent(prompt);
                return result.response.text();
            } else { // gpt
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [{ role: "user", content: prompt }],
                });
                return completion.choices[0].message.content;
            }
        } catch (error) {
            // 503 과부하 에러일 경우에만 재시도
            if (error.status === 503 && attempt < 3) {
                console.log(`[LLM 재시도] ${provider} API 과부하. ${attempt}번째 재시도...`);
                await sleep(1500); // 1.5초 대기
            } else {
                console.error(`[LLM 호출 중 오류] Provider: ${provider}`, error);
                // 최종적으로 실패하면 에러를 throw하여 상위에서 처리하도록 함
                throw new Error(`${provider} API Error: ${error.message}`);
            }
        }
    }
}

module.exports = { callLLM };