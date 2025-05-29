import os
from typing import List

from torch.utils.data import Dataset
from transformers import AutoTokenizer, BertForTokenClassification, Trainer, DataCollatorForTokenClassification, PreTrainedTokenizerFast
import torch
from fastapi import FastAPI
from pydantic import BaseModel


# === Модель данных для запроса ===
class TextInput(BaseModel):
    text: str


# === Твой датасет для инференса ===
class TextInferenceDataset(Dataset):
    def __init__(self, text: str, tokenizer: PreTrainedTokenizerFast, max_length: int = 512):
        self.tokenizer = tokenizer
        self.max_length = max_length

        # Разбиваем текст на слова
        self.words = text.split()

        # Токенизуем слова
        tokenized = tokenizer(
            self.words,
            is_split_into_words=True,
            truncation=True,
            max_length=self.max_length,
            padding="max_length"
        )

        self.word_ids = tokenized.word_ids()
        self.input_ids = tokenized["input_ids"]
        self.attention_mask = tokenized["attention_mask"]

    def __len__(self):
        return 1  # один пример — весь текст

    def __getitem__(self, idx):
        return {
            "input_ids": self.input_ids,
            "attention_mask": self.attention_mask,
            "word_ids": self.word_ids
        }


# === Функция декодирования предсказаний ===
def decode_predictions(predictions, label_list):
    predicted_labels = []
    for prediction in predictions:
        predicted_label_ids = prediction.argmax(axis=-1)
        predicted_labels.append([label_list[label_id] for label_id in predicted_label_ids])
    return predicted_labels


# === Настройка модели ===
model_dir = "./results-more-classes/checkpoint-15500"
bert_tokenizer = AutoTokenizer.from_pretrained("DeepPavlov/rubert-base-cased")
model = BertForTokenClassification.from_pretrained(model_dir)

label_list = ["O", "Voice", "paronym", "typo", "Number", "Gender", "Tense", "Case", "Person"]
label_map = {label: i for i, label in enumerate(label_list)}

trainer = Trainer(
    model=model,
    data_collator=DataCollatorForTokenClassification(bert_tokenizer)
)


# === Функция apply с обработкой ===
def apply(text: str) -> List[str]:
    text_as_dataset = TextInferenceDataset(text, bert_tokenizer)

    predictions, _, _ = trainer.predict(text_as_dataset)  # predictions.shape = [1, seq_len, num_labels]

    logits = torch.tensor(predictions[0])  # shape: [seq_len, num_labels]

    input_ids = text_as_dataset[0]["input_ids"]
    valid_length = sum(1 for x in input_ids if x != bert_tokenizer.pad_token_id)

    logits = logits[:valid_length]
    word_ids = text_as_dataset.word_ids[:valid_length]

    predicted_label_ids = logits.argmax(dim=-1).tolist()

    word_predictions = {}
    for word_id, label_id in zip(word_ids, predicted_label_ids):
        if word_id is None:
            continue  # пропускаем специальные токены
        if word_id not in word_predictions:
            word_predictions[word_id] = label_list[label_id]

    words = text.split()
    final_predictions = []
    for i in range(len(words)):
        label = word_predictions.get(i, "O")
        final_predictions.append(label)

    return final_predictions


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI()
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/predict/", response_model=List[str])
async def predict(input_data: TextInput):
    result = apply(input_data.text)
    return result


# === Запуск сервера (для теста локально) ===
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)