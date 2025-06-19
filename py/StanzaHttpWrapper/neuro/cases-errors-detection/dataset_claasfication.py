import json

import torch
from torch.utils.data import Dataset

label_list = ["O", "Voice", "paronym", "typo", "Number", "Gender", "Tense", "Case", "Person"]
label_map = {label: i for i, label in enumerate(label_list)}


class GrammarDatasetClass(Dataset):
    def __init__(self, data_files, tokenizer):
        self.data = []
        for file in data_files:
            with open(file, "r", encoding="utf-8") as f:
                data = json.load(f)
            words = data["text"]
            labels = ["O"] * len(words)
            for annotation in data["annotations"]:
                labels[annotation["wordNumber"]] = annotation["type"]

            encoding = tokenizer(
                words,
                add_special_tokens=True,
                max_length=128,
                padding='max_length',
                truncation=True,
                return_tensors='pt',
                return_attention_mask=True
            )
            input_ids = encoding['input_ids'].flatten()
            attention_mask = encoding['attention_mask'].flatten()

            self.data.append({
                "input_ids": input_ids,
                "attention_mask": attention_mask,
                "labels": torch.tensor(len(data["annotations"]), dtype=torch.long),
            })

    def __len__(self):
        return len(self.data)

    def __getitem__(self, idx):
        return self.data[idx]
