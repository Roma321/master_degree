import os

import torch
from torch.utils.data import DataLoader
from transformers import AutoTokenizer, BertForTokenClassification, Trainer, DataCollatorForTokenClassification, \
    BertForSequenceClassification
from seqeval.metrics import classification_report
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt
from dataset import GrammarDataset
from dataset_claasfication import GrammarDatasetClass
model_dir = "./results-more-classes/checkpoint-15500"

tokenizer = AutoTokenizer.from_pretrained("DeepPavlov/rubert-base-cased")
model = BertForTokenClassification.from_pretrained(model_dir)

label_list = ["O", "Voice", "paronym", "typo", "Number", "Gender", "Tense", "Case", "Person"]
label_map = {label: i for i, label in enumerate(label_list)}

data_dir = "/home/roman/projects/mag/ts/test-final"
N = 1000
json_files = [os.path.join(data_dir, f) for f in os.listdir(data_dir)][:N]

test_dataset = GrammarDataset(json_files, tokenizer)
test_dataset_class = GrammarDatasetClass(json_files, tokenizer)
trainer = Trainer(
    model=model,
    data_collator=DataCollatorForTokenClassification(tokenizer)
)
def evaluate_model(model, test_dataset, batch_size=16):
    model.eval()
    dataloader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)

    all_preds = []
    all_labels = []
    # print(test_dataset)
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


classification_model = BertForSequenceClassification.from_pretrained('/home/roman/Downloads/dp')
# classification_trainer = Trainer(
#     model=classification_model,
# )

_, classification_predictions = evaluate_model(classification_model, test_dataset_class)
print(classification_predictions)
print('\n')
predictions, labels, _ = trainer.predict(test_dataset)

def decode_predictions(predictions, label_list):
    predicted_labels = []
    for prediction in predictions:
        predicted_label_ids = prediction.argmax(axis=-1)
        predicted_labels.append([label_list[label_id] for label_id in predicted_label_ids])
    return predicted_labels

decoded_predictions = decode_predictions(predictions, label_list)
print(decoded_predictions)

true_labels = []
for label in labels:
    true_labels.append([label_list[l] if l != -100 else "O" for l in label])

filtered_predictions = []
filtered_true_labels = []

for idx, (preds, trues) in enumerate(zip(decoded_predictions, true_labels)):
    print(classification_predictions[idx], classification_predictions[idx] == 0)
    preds = ['0'] * len(true_labels) if classification_predictions[idx] == 0 else preds
    filtered_preds = []
    filtered_trues = []
    for pred, true in zip(preds, trues):
        if true != "O":
            filtered_preds.append(pred)
            filtered_trues.append(true)
    filtered_predictions.append(filtered_preds)
    filtered_true_labels.append(filtered_trues)

report = classification_report(filtered_true_labels, filtered_predictions, digits=4)
flat_filtered_true_labels = [label for sublist in filtered_true_labels for label in sublist]
flat_filtered_predictions = [label for sublist in filtered_predictions for label in sublist]
print(report)
cm = confusion_matrix(flat_filtered_true_labels, flat_filtered_predictions, labels=label_list)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=label_list)

plt.figure(figsize=(20, 16))
disp.plot(cmap=plt.cm.Blues, values_format=".0f", xticks_rotation=45)

plt.title("Confusion Matrix")
# plt.show()
output_file = "AAAAA.png"
plt.savefig(output_file, bbox_inches="tight", dpi=300)
print(f"Confusion matrix saved to {output_file}")
#
# output_errors_file = "error_analysis.txt"
# with open(output_errors_file, "w", encoding="utf-8") as f:
#     f.write("Error Analysis:\n\n")
