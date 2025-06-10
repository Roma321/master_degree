import json
import shutil
from pathlib import Path
from typing import List

import numpy as np
from sklearn.metrics import f1_score
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, BertForSequenceClassification, TrainingArguments, Trainer
from transformers import EvalPrediction

from dataset import TextDataset, label_list
from typings import CorpusItem


def load_corpus(path: str) -> List[CorpusItem]:
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return [CorpusItem(**item) for item in data]

def compute_metrics(p: EvalPrediction):
    preds = np.argmax(p.predictions, axis=1)
    labels = p.label_ids
    f1 = f1_score(labels, preds, average="weighted")  # или 'macro' / 'micro'
    return {"f1": f1}

def main():

    data = load_corpus('/home/roman/projects/mag/ts/corpus-only-binary-classification/corpus.json')
    data_extension = load_corpus('/home/roman/projects/mag/ts/corpus-only-binary-classification/corpus-3.json')
    train_data, eval_data = train_test_split(data, test_size=0.2, random_state=42)
    train_data.extend(data_extension)
    model_names = [
        'sergeyzh/rubert-tiny-turbo',
        'cointegrated/rubert-tiny',
        'cointegrated/rubert-tiny2',
        'ai-forever/ruBert-base',
        'DeepPavlov/rubert-base-cased'
    ]

    for model_name in model_names:
        tokenizer = AutoTokenizer.from_pretrained(model_name)

        train_dataset = TextDataset(train_data, tokenizer, max_length=128)
        eval_dataset = TextDataset(eval_data, tokenizer, max_length=128)

        model = BertForSequenceClassification.from_pretrained(
            model_name,
            num_labels=2,
            id2label={i: l for i, l in enumerate(label_list)},
            label2id={l: i for i, l in enumerate(label_list)}
        )
        model_dir = f"./{model_name.replace('/', '__')}-rulec-2000"
        training_args = TrainingArguments(
            output_dir=model_dir,
            evaluation_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="f1",
            greater_is_better=True,
            learning_rate=5e-6,
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
            compute_metrics=compute_metrics,
        )

        trainer.train()
        trainer.save_model(model_dir)

        for path in Path(model_dir).iterdir():
            if path.is_dir() and 'checkpoint' in path.name:
                shutil.rmtree(path)
                print(f"Удалено: {path.name}")

if __name__ == '__main__':
    main()
