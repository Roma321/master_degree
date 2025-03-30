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
    return {
        settings.TAG_MAPPING.get(value)
        for key, value in features.items()
        if key in ['Case', 'Number', 'Gender', 'Tense', 'Person']
        and value in settings.TAG_MAPPING
    }