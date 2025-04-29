import os
import json
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, BertForTokenClassification, Trainer, TrainingArguments, \
    DataCollatorForTokenClassification
from torch.utils.data import Dataset


class GrammarDataset(Dataset):
    def __init__(self, data_files, tokenizer):
        self.data = []
        for file in data_files:
            with open(file, "r", encoding="utf-8") as f:
                data = json.load(f)
            words = data["text"].split()
            labels = ["O"] * len(words) 
            for annotation in data["annotations"]:
                labels[annotation["wordNumber"]] = annotation["type"]

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
                    aligned_labels.append(label_map[labels[word_id]]) 

            self.data.append({
                "input_ids": tokenized["input_ids"],
                "attention_mask": tokenized["attention_mask"],
                "labels": aligned_labels
            })

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]


data_dir = "/home/roman/projects/mag/ts/corpus-final"

json_files = [os.path.join(data_dir, f) for f in os.listdir(data_dir)]

train_files, eval_files = train_test_split(json_files, test_size=0.2, random_state=42)

label_list = ["O", "Voice", "paronym", "typo", "Number", "Gender", "Tense", "Case", "Person"]
label_map = {label: i for i, label in enumerate(label_list)} 

tokenizer = AutoTokenizer.from_pretrained("DeepPavlov/rubert-base-cased")

train_dataset = GrammarDataset(train_files, tokenizer)
eval_dataset = GrammarDataset(eval_files, tokenizer)

model = BertForTokenClassification.from_pretrained(
    "DeepPavlov/rubert-base-cased",
    num_labels=len(label_list)
)

data_collator = DataCollatorForTokenClassification(tokenizer)

training_args = TrainingArguments(
    output_dir="./results-more-classes",
    evaluation_strategy="epoch",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=5,
    weight_decay=0.01,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    data_collator=data_collator
)

trainer.train()