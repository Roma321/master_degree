import os
from transformers import AutoTokenizer, BertForTokenClassification, Trainer, DataCollatorForTokenClassification
from seqeval.metrics import classification_report
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt
from dataset import GrammarDataset

model_dir = "./results-more-classes/checkpoint-15500"

tokenizer = AutoTokenizer.from_pretrained("DeepPavlov/rubert-base-cased")
model = BertForTokenClassification.from_pretrained(model_dir)

label_list = ["O", "Voice", "paronym", "typo", "Number", "Gender", "Tense", "Case", "Person"]
label_map = {label: i for i, label in enumerate(label_list)}

data_dir = "/home/roman/projects/mag/ts/corpus-final-2"
N = 1000
json_files = [os.path.join(data_dir, f) for f in os.listdir(data_dir)][:N]

test_dataset = GrammarDataset(json_files, tokenizer)

trainer = Trainer(
    model=model,
    data_collator=DataCollatorForTokenClassification(tokenizer)
)

predictions, labels, _ = trainer.predict(test_dataset)

def decode_predictions(predictions, label_list):
    predicted_labels = []
    for prediction in predictions:
        predicted_label_ids = prediction.argmax(axis=-1)
        predicted_labels.append([label_list[label_id] for label_id in predicted_label_ids])
    return predicted_labels

decoded_predictions = decode_predictions(predictions, label_list)

true_labels = []
for label in labels:
    true_labels.append([label_list[l] if l != -100 else "O" for l in label])

filtered_predictions = []
filtered_true_labels = []

for preds, trues in zip(decoded_predictions, true_labels):
    filtered_preds = []
    filtered_trues = []
    for pred, true in zip(preds, trues):
        if true != "O":
            filtered_preds.append(pred)
            filtered_trues.append(true)
    filtered_predictions.append(filtered_preds)
    filtered_true_labels.append(filtered_trues)

report = classification_report(filtered_true_labels, filtered_predictions, digits=4)
print("Classification Report:")
print(report)

flat_filtered_true_labels = [label for sublist in filtered_true_labels for label in sublist]
flat_filtered_predictions = [label for sublist in filtered_predictions for label in sublist]

cm = confusion_matrix(flat_filtered_true_labels, flat_filtered_predictions, labels=label_list)
disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=label_list)

plt.figure(figsize=(20, 16))
disp.plot(cmap=plt.cm.Blues, values_format=".0f", xticks_rotation=45)

plt.title("Confusion Matrix")

output_file = "confusion_matrix-1000.png"
plt.savefig(output_file, bbox_inches="tight", dpi=300)
print(f"Confusion matrix saved to {output_file}")