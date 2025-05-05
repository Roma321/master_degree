from torch.utils.data import Dataset
import json
label_list = ["O", "Voice", "paronym", "typo", "Number", "Gender", "Tense", "Case", "Person"]
label_map = {label: i for i, label in enumerate(label_list)}

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
