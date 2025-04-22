import os
import json
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, BertForTokenClassification, Trainer, TrainingArguments, \
    DataCollatorForTokenClassification
from torch.utils.data import Dataset


# Класс для датасета
class GrammarDataset(Dataset):
    def __init__(self, data_files, tokenizer):
        self.data = []
        for file in data_files:
            with open(file, "r", encoding="utf-8") as f:
                data = json.load(f)
            words = data["text"].split()
            labels = ["O"] * len(words)  # Инициализация меток
            for annotation in data["annotations"]:
                labels[annotation["wordNumber"]] = annotation["type"]

            # Токенизация
            tokenized = tokenizer(
                words,
                is_split_into_words=True,
                truncation=True
            )
            word_ids = tokenized.word_ids()
            aligned_labels = []
            for word_id in word_ids:
                if word_id is None:
                    aligned_labels.append(-100)  # -100 игнорируется при потере
                else:
                    aligned_labels.append(label_map[labels[word_id]])  # Преобразуем метку в число

            self.data.append({
                "input_ids": tokenized["input_ids"],
                "attention_mask": tokenized["attention_mask"],
                "labels": aligned_labels
            })

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]


# Путь к директории с данными
data_dir = "/home/roman/projects/mag/ts/output-several-errors"

# Получаем список всех JSON-файлов
json_files = [os.path.join(data_dir, f) for f in os.listdir(data_dir)]

# Разделяем файлы на обучающую и валидационную выборки (80% / 20%)
train_files, eval_files = train_test_split(json_files, test_size=0.2, random_state=42)

# Определяем уникальные метки
label_list = ["O", "case"]  # Добавьте другие типы ошибок при необходимости
label_map = {label: i for i, label in enumerate(label_list)}  # {"O": 0, "case": 1}

# Загружаем токенизатор
tokenizer = AutoTokenizer.from_pretrained("DeepPavlov/rubert-base-cased")

# Создаем обучающий и валидационный датасеты
train_dataset = GrammarDataset(train_files, tokenizer)
eval_dataset = GrammarDataset(eval_files, tokenizer)

# Загружаем предобученную модель
model = BertForTokenClassification.from_pretrained(
    "DeepPavlov/rubert-base-cased",
    num_labels=len(label_list)  # Количество меток
)

# Создаем коллектор
data_collator = DataCollatorForTokenClassification(tokenizer)

# Настройки обучения
training_args = TrainingArguments(
    output_dir="./results",
    evaluation_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=3,
    weight_decay=0.01,
)

# Создаем Trainer
trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    data_collator=data_collator
)

# Начинаем обучение
trainer.train()