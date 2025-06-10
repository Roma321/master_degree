import torch
from matplotlib import pyplot as plt
from sklearn.metrics import classification_report
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
from sklearn.model_selection import train_test_split
from torch.utils.data import DataLoader
from transformers import AutoTokenizer, BertForSequenceClassification

from train import load_corpus
from dataset import TextDataset


def evaluate_model(model, test_dataset, batch_size=16):
    model.eval()
    dataloader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    all_preds = []
    all_labels = []
    print(test_dataset)
    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch['input_ids']
            attention_mask = batch['attention_mask']
            labels = batch['labels']

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask
            )

            logits = outputs.logits
            preds = torch.argmax(logits, dim=1)

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    return all_labels, all_preds


def plot_confusion_matrix(y_true, y_pred, labels, save_path="confusion_matrix.png"):
    cm = confusion_matrix(y_true, y_pred)
    disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=labels)
    disp.plot(cmap=plt.cm.Blues)
    plt.title("Confusion Matrix")
    plt.savefig(save_path, bbox_inches='tight')
    plt.close()
    print(f"Матрица ошибок сохранена в {save_path}")

def predict(text: str, model, tokenizer):
    model.eval()  # Переводим модель в режим оценки
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)

    with torch.no_grad():
        outputs = model(**inputs)

    logits = outputs.logits
    predicted_class_id = logits.argmax().item()
    return model.config.id2label[predicted_class_id]


if __name__ == '__main__':
    # После обучения загружаем модель и делаем предсказание
    weights = "/home/roman/projects/mag/py/StanzaHttpWrapper/neuro/simple-binary/sergeyzh__rubert-tiny-turbo-rulec-2000"
    data = load_corpus('/home/roman/projects/mag/ts/corpus-only-binary-classification/corpus.json')
    # data_rulec_test = data_rulec
    tokenizer_name = 'sergeyzh/rubert-tiny-turbo'

    tokenizer = AutoTokenizer.from_pretrained(tokenizer_name)
    model = BertForSequenceClassification.from_pretrained(weights)

    # data = load_corpus('/home/roman/projects/mag/ts/corpus-only-binary-classification/corpus.json')
    train_data, eval_data = train_test_split(data, test_size=0.2, random_state=42)
    print(len(train_data), len(eval_data))

    eval_dataset = TextDataset(eval_data, tokenizer)
    true_labels, predicted_labels = evaluate_model(model, eval_dataset, 16)

    # Получаем метки классов
    label_list = model.config.id2label.values()

    # Вывод полного отчёта
    print("Classification Report:")
    print(classification_report(true_labels, predicted_labels))

    # Рисуем и сохраняем матрицу ошибок
    plot_confusion_matrix(true_labels, predicted_labels, labels=label_list, save_path='res/rulec-and-2000/sergey-zh.png')
