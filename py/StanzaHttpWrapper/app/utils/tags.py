from typing import Optional, Dict

from app.config import settings

def parse_features(
    features: Optional[Dict[str, str]],
    features_str: Optional[str]
) -> Dict[str, str]:
    result = {}
    if features_str:
        for item in features_str.split('|'):
            if '=' in item:
                key, value = item.split('=', 1)
                result[key.strip()] = value.strip()
    if features:
        result.update(features)
    return result


def map_tags_to_pymorphy(features: Dict[str, str]) -> set:
    # Инициализируем множество для хранения тегов pymorphy2
    pymorphy_tags = set()

    # Флаг для отслеживания множественного числа
    is_plural = False

    for key, value in features.items():
        # Проверяем, что ключ является одним из допустимых
        if key in ['Case', 'Number', 'Gender', 'Tense', 'Person']:
            # Если это число и оно множественное, устанавливаем флаг
            if key == 'Number' and value == 'Plur':
                is_plural = True

            # Проверяем, есть ли значение в маппинге
            if value in settings.TAG_MAPPING:
                pymorphy_tags.add(settings.TAG_MAPPING[value])

    # Если число множественное, удаляем все теги, связанные с родом
    if is_plural:
        pymorphy_tags = {tag for tag in pymorphy_tags if tag not in {'masc', 'femn', 'neut'}}

    return pymorphy_tags