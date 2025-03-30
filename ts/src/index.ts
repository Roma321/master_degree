import StanzaApi from "./api/stanza";

const api = new StanzaApi('http://localhost:8000');

async function testApi() {
  try {
    const splitResult = await api.splitSentences("Мама мыла раму. Рама была грязной.");

    const posResult = await api.posTagging("Кот спит на ковре.");

    const health = await api.healthCheck();
  } catch (error: any) {
    console.error('API Error:', error.message);
  }
}

testApi();