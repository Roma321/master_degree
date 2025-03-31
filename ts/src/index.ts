import StanzaApi from "./api/stanza";

const api = new StanzaApi();

// Пример вызова
async function test() {
  try {
    const result = await api.getSemanticSimilarity("абонент_NOUN", "абонемент_NOUN");
    console.log(`Схожесть: ${result.similarity.toFixed(2)}`);
  } catch (error) {
    console.error(error);
  }
}

test();