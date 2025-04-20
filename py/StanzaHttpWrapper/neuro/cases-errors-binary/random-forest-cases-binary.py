import os
import numpy as np
from tqdm import tqdm
from transformers import BertTokenizer, BertModel
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, confusion_matrix
import torch

# Конфигурация
MODEL_NAME = 'bert-base-multilingual-cased'
MAX_LENGTH = 128
BATCH_SIZE = 32


# Загрузка данных
def load_data():
    texts, labels = [], []

    # Чтение правильных предложений
    for file in os.listdir('/home/roman/projects/mag/ts/caseErrorsBinaryClassification/correct'):
        with open(f'/home/roman/projects/mag/ts/caseErrorsBinaryClassification/correct/{file}', 'r', encoding='utf-8') as f:
            texts.append(f.read())
            labels.append(1)  # 1 = корректные

    # Чтение некорректных предложений
    for file in os.listdir('/home/roman/projects/mag/ts/caseErrorsBinaryClassification/incorrect'):
        with open(f'/home/roman/projects/mag/ts/caseErrorsBinaryClassification/incorrect/{file}', 'r', encoding='utf-8') as f:
            texts.append(f.read())
            labels.append(0)  # 0 = ошибка

    return texts, np.array(labels)


# Получение BERT-эмбеддингов
def get_bert_embeddings(texts, tokenizer, model):
    model.eval()
    embeddings = []

    for i in tqdm(range(0, len(texts), BATCH_SIZE)):
        batch = texts[i:i + BATCH_SIZE]

        inputs = tokenizer(
            batch,
            max_length=MAX_LENGTH,
            padding='max_length',
            truncation=True,
            return_tensors='pt'
        )

        with torch.no_grad():
            outputs = model(**inputs)

        # Используем эмбеддинги [CLS]-токена
        cls_embeddings = outputs.last_hidden_state[:, 0, :].numpy()
        embeddings.append(cls_embeddings)

    return np.vstack(embeddings)


# Основной процесс
if __name__ == '__main__':
    # 1. Загрузка данных
    texts, labels = load_data()

    # 2. Загрузка BERT
    tokenizer = BertTokenizer.from_pretrained(MODEL_NAME)
    bert_model = BertModel.from_pretrained(MODEL_NAME)

    # 3. Получение эмбеддингов
    print("Получение BERT-эмбеддингов...")
    embeddings = get_bert_embeddings(texts, tokenizer, bert_model)

    # 4. Разделение данных
    X_train, X_test, y_train, y_test = train_test_split(
        embeddings, labels, test_size=0.2, random_state=42
    )

    # 5. Обучение классификатора
    print("\nОбучение Random Forest...")
    clf = RandomForestClassifier(n_estimators=100)
    clf.fit(X_train, y_train)

    # 6. Оценка
    y_pred = clf.predict(X_test)
    print("\nОтчёт о классификации:")
    print(classification_report(y_test, y_pred))

    print("\nМатрица ошибок:")
    print(confusion_matrix(y_test, y_pred))