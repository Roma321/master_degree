import os

from transformers import AutoTokenizer, BertForTokenClassification
import torch

checkpoint_path = "/home/roman/projects/mag/py/StanzaHttpWrapper/neuro/cases-errors-detection/results/checkpoint-13500"

tokenizer = AutoTokenizer.from_pretrained("DeepPavlov/rubert-base-cased")
model = BertForTokenClassification.from_pretrained(checkpoint_path)

text = "Встреча состоится в декабре 1997 года в Вашингтоне."


def test_sentence(text):
    words = text.split()
    tokenized = tokenizer(words, is_split_into_words=True, return_tensors="pt", truncation=True)
    with torch.no_grad():
        outputs = model(**tokenized)
    logits = outputs.logits
    predictions = torch.argmax(logits, dim=-1).squeeze().tolist()
    label_list = ["O", "case"]
    words_with_errors = []
    previous_word_id = None
    for token_idx, word_id in enumerate(tokenized.word_ids()):
        if word_id is not None and word_id != previous_word_id:  # Новое слово
            label_id = predictions[token_idx]  # Предсказанная метка
            label = label_list[label_id]  # Преобразуем ID метки в строку
            if label != "O":  # Если метка указывает на ошибку
                words_with_errors.append((words[word_id], label))
        previous_word_id = word_id
    print("Слова с ошибками:", words_with_errors)
    return words_with_errors


test_sentence(text)

test_dir = '/home/roman/projects/mag/corpus/rozovskaya-case-errors'
test_dir_corr = f'{test_dir}/correct'
test_dir_incorr = f'{test_dir}/incorrect'

errors_corr = []

# for filename in os.listdir(test_dir_corr):
#         with open(os.path.join(test_dir_corr, filename), 'r', encoding='utf-8') as f:
#             txt = f.read()
#             res = test_sentence(txt)
#             if len(res) != 0:
#                 errors_corr.append((res, txt))
# with open('errors-corr.txt', 'w', encoding='utf-8') as f:
#     for e in errors_corr:
#         f.write(str(e))
#         f.write('\n')


errors_incorr=[]

for filename in os.listdir(test_dir_incorr):
        with open(os.path.join(test_dir_incorr, filename), 'r', encoding='utf-8') as f:
            txt = f.read()
            res = test_sentence(txt)
            if len(res) == 0:
                errors_incorr.append(txt)

print(f'{100*len(errors_incorr) / len(os.listdir(test_dir_incorr))}%')
with open('errors-incorr.txt', 'w', encoding='utf-8') as f:
    for e in errors_incorr:
        f.write(str(e))
        f.write('\n')