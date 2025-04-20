import os
import torch
import numpy as np
from sklearn.metrics import confusion_matrix
from transformers import BertTokenizer, BertForSequenceClassification
from torch.optim import AdamW
from torch.utils.data import Dataset, DataLoader
from sklearn.model_selection import train_test_split
from tqdm import tqdm

# Конфигурация
# MODEL_NAME = 'bert-base-multilingual-cased'
MODEL_NAME = 'DeepPavlov/rubert-base-cased'
BATCH_SIZE = 16
EPOCHS = 8
LEARNING_RATE = 5e-6
MAX_LENGTH = 256

# Пути к данным
CORRECT_DIR = '/home/roman/projects/mag/ts/caseErrorsBinaryClassification/correct'
INCORRECT_DIR = '/home/roman/projects/mag/ts/caseErrorsBinaryClassification/incorrect'

CORPUS_VOLUME = 15000
def load_data():
    texts = []
    labels = []

    # Чтение правильных предложений
    for filename in os.listdir(CORRECT_DIR)[:CORPUS_VOLUME]:
        with open(os.path.join(CORRECT_DIR, filename), 'r', encoding='utf-8') as f:
            texts.append(f.read())
            labels.append(1)

    # Чтение неправильных предложений
    for filename in os.listdir(INCORRECT_DIR)[:CORPUS_VOLUME]:
        with open(os.path.join(INCORRECT_DIR, filename), 'r', encoding='utf-8') as f:
            texts.append(f.read())
            labels.append(0)

    return texts, labels


class TextDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        encoding = self.tokenizer(
            text,
            max_length=self.max_length,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }


def print_confusion_matrix(y_true, y_pred, class_names):
    cm = confusion_matrix(y_true, y_pred)
    print("\nМатрица ошибок:")
    print(f"{'':<15}{class_names[0]:<15}{class_names[1]:<15}")
    for i, row in enumerate(cm):
        print(f"{class_names[i]:<15}{row[0]:<15}{row[1]:<15}")
    print("\nТочность по классам:")
    for i, class_name in enumerate(class_names):
        precision = cm[i, i] / cm[:, i].sum() if cm[:, i].sum() > 0 else 0
        recall = cm[i, i] / cm[i, :].sum() if cm[i, :].sum() > 0 else 0
        print(f"{class_name}: Precision={precision:.2f}, Recall={recall:.2f}")


def main():
    # Загрузка данных
    print("Загрузка данных...")
    texts, labels = load_data()
    # texts, labels = load_data()
    print("Общее количество примеров:", len(labels))
    print("Класс 'correct':", sum(labels))
    print("Класс 'inCorrect':", len(labels) - sum(labels))

    # Примеры из каждого класса
    print("\nПример correct:", texts[labels.index(1)])  # Первый элемент с меткой 1
    print("Пример inCorrect:", texts[labels.index(0)])  # Первый элемент с меткой 0
    # Разделение данных
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.2, random_state=42
    )

    # Инициализация токенизатора
    tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)

    # Создание датасетов
    train_dataset = TextDataset(train_texts, train_labels, tokenizer, MAX_LENGTH)
    val_dataset = TextDataset(val_texts, val_labels, tokenizer, MAX_LENGTH)

    # Даталоадеры
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE)

    # Инициализация модели
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = BertForSequenceClassification.from_pretrained(MODEL_NAME, num_labels=2)
    model.to(device)

    # Оптимизатор
    optimizer = AdamW(model.parameters(), lr=LEARNING_RATE)

    # Обучение
    print("Начало обучения...")
    for epoch in range(EPOCHS):
        model.train()
        total_loss = 0

        progress_bar = tqdm(train_loader, desc=f'Epoch {epoch + 1}')
        for batch in progress_bar:
            optimizer.zero_grad()

            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)
            # print(batch['labels'])
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels
            )

            loss = outputs.loss
            total_loss += loss.item()

            loss.backward()
            optimizer.step()

            progress_bar.set_postfix({'loss': loss.item()})

        avg_train_loss = total_loss / len(train_loader)
        print(f"\nEpoch {epoch + 1}, Average Training Loss: {avg_train_loss:.4f}")

        # Валидация
        model.eval()
        val_loss = 0
        correct_predictions = 0
        all_preds = []
        all_labels = []

        with torch.no_grad():
            for batch in val_loader:
                input_ids = batch['input_ids'].to(device)
                attention_mask = batch['attention_mask'].to(device)
                labels = batch['labels'].to(device)

                outputs = model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    labels=labels
                )

                val_loss += outputs.loss.item()

                _, preds = torch.max(outputs.logits, dim=1)
                correct_predictions += torch.sum(preds == labels).item()

                all_preds.extend(preds.cpu().numpy())
                all_labels.extend(labels.cpu().numpy())

        avg_val_loss = val_loss / len(val_loader)
        val_accuracy = correct_predictions / len(val_dataset)
        print(f"Validation Loss: {avg_val_loss:.4f}, Accuracy: {val_accuracy:.4f}")

        # Вывод матрицы ошибок
        print_confusion_matrix(
            all_labels,
            all_preds,
            class_names=["inCorrect", "Correct"]
        )

    # Сохранение модели
    model.save_pretrained('bert_binary_classifier')
    tokenizer.save_pretrained('bert_binary_classifier')
    print("\nМодель сохранена в 'bert_binary_classifier'")


if __name__ == '__main__':
    main()