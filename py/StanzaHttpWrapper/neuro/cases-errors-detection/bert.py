import os
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, BertForTokenClassification, Trainer, TrainingArguments, \
    DataCollatorForTokenClassification
from dataset import *



data_dir = "/home/roman/projects/mag/ts/corpus-final"

json_files = [os.path.join(data_dir, f) for f in os.listdir(data_dir)]

train_files, eval_files = train_test_split(json_files, test_size=0.2, random_state=42)



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