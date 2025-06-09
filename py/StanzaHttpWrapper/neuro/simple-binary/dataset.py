from typing import List
from torch.utils.data import Dataset
from transformers import PreTrainedTokenizerFast
from typings import CorpusItem
import torch

label_list = ["correct", "incorrect"]
label_map = {label: i for i, label in enumerate(label_list)}

class TextDataset(Dataset):
    def __init__(self, texts: List[CorpusItem], tokenizer: PreTrainedTokenizerFast, max_length=256):
        self.texts = texts
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.cached_data = []

        for item in texts:
            text = item.text
            label = label_map[item.label]

            encoding = tokenizer(
                text,
                add_special_tokens=True,
                max_length=max_length,
                padding='max_length',
                truncation=True,
                return_tensors='pt',
                return_attention_mask=True
            )

            input_ids = encoding['input_ids'].flatten()
            attention_mask = encoding['attention_mask'].flatten()

            self.cached_data.append({
                'input_ids': input_ids,
                'attention_mask': attention_mask,
                'labels': torch.tensor(label, dtype=torch.long)
            })

    def __len__(self):
        return len(self.cached_data)

    def __getitem__(self, idx):
        return self.cached_data[idx]