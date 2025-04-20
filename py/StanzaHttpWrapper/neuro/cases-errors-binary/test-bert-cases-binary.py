import os
import torch
from sklearn.metrics import confusion_matrix
from transformers import BertTokenizer, BertForSequenceClassification
from torch.utils.data import Dataset, DataLoader
from tqdm import tqdm
from cases_binary_bert import print_confusion_matrix, TextDataset
# Конфигурация
MODEL_PATH = 'bert_binary_classifier'
BATCH_SIZE = 16
MAX_LENGTH = 256


def load_test_data(test_dir):
    texts = []
    labels = []
    filenames = []

    # Чтение правильных предложений
    correct_dir = os.path.join(test_dir, 'correct')
    for filename in os.listdir(correct_dir):
        with open(os.path.join(correct_dir, filename), 'r', encoding='utf-8') as f:
            texts.append(f.read())
            labels.append(1)
            filenames.append(os.path.join('correct', filename))

    # Чтение неправильных предложений
    incorrect_dir = os.path.join(test_dir, 'incorrect')
    for filename in os.listdir(incorrect_dir):
        with open(os.path.join(incorrect_dir, filename), 'r', encoding='utf-8') as f:
            texts.append(f.read())
            labels.append(0)
            filenames.append(os.path.join('incorrect', filename))

    return texts, labels, filenames


def evaluate_model(test_dir):
    # Загрузка данных
    print("Загрузка тестовых данных...")
    test_texts, test_labels, test_filenames = load_test_data(test_dir)

    # Инициализация токенизатора и модели
    tokenizer = BertTokenizer.from_pretrained(MODEL_PATH)
    model = BertForSequenceClassification.from_pretrained(MODEL_PATH)

    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model.to(device)
    model.eval()

    # Создание датасета и даталоадера
    test_dataset = TextDataset(test_texts, test_labels, tokenizer, MAX_LENGTH)
    test_loader = DataLoader(test_dataset, batch_size=BATCH_SIZE)

    # Предсказания
    all_preds = []
    all_labels = []
    incorrect_predictions = []

    with torch.no_grad():
        for batch_idx, batch in enumerate(tqdm(test_loader)):
            input_ids = batch['input_ids'].to(device)
            attention_mask = batch['attention_mask'].to(device)
            labels = batch['labels'].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask
            )

            _, preds = torch.max(outputs.logits, dim=1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

            # Сохраняем информацию о неправильных предсказаниях
            for i in range(len(preds)):
                print(preds[i] == labels[i])
                if preds[i] != labels[i]:
                    sample_idx = batch_idx * BATCH_SIZE + i
                    incorrect_predictions.append((
                        test_filenames[sample_idx],
                        preds[i].item(),
                        test_texts[sample_idx]
                    ))

    # Вывод матрицы ошибок
    print_confusion_matrix(
        all_labels,
        all_preds,
        class_names=["inCorrect", "Correct"]
    )

    # Запись ошибок в файл
    with open('log.txt', 'w', encoding='utf-8') as f:
        for filename, pred, text in incorrect_predictions:
            f.write(f"{filename} {pred} {text}\n")

    print(f"\nЗаписано {len(incorrect_predictions)} ошибок в файл log.txt")


if __name__ == '__main__':
    # Укажите путь к тестовой директории
    TEST_DIR = '/home/roman/projects/mag/corpus/rozovskaya-case-errors'
    evaluate_model(TEST_DIR)