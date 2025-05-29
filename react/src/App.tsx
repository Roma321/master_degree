import { useState } from 'react';

type WordLabel = "O" | "Voice" | "paronym" | "typo" | "Number" | "Gender" | "Tense" | "Case" | "Person"

const colorsMap: Record<WordLabel, string> = {
  O: 'white',
  Voice: 'green',
  paronym: 'blue',
  typo: 'orange',
  Number: 'cyan',
  Gender: 'red',
  Tense: 'magenta',
  Case: 'lime',
  Person: 'brown'
}

export function normalizeSpacesAroundPunctuation(text: string): string {
  const punctuationMarks = [',', '.', '!', '?', ':', ';', '…'];
  const punctuationRegex = `[${punctuationMarks.map(mark => '\\' + mark).join('')}]`;

  return (
    text
      .replace(new RegExp(`\\s*(${punctuationRegex})\\s*`, 'g'), '$1')
      .replace(new RegExp(`([^\\s])(${punctuationRegex})`, 'g'), '$1 $2')
      .replace(new RegExp(`(${punctuationRegex})([^\\s])`, 'g'), '$1 $2')
  );
}


function App() {
  const [inputText, setInputText] = useState<string>('');
  const [highlightedText, setHighlightedText] = useState<React.ReactNode>('');

  const handleSubmit = async (e: React.FormEvent) => {

    const normalizedtext = normalizeSpacesAroundPunctuation(inputText);
    setInputText(normalizedtext)
    e.preventDefault();

    console.log('Отправляем:', normalizedtext);

    try {
      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Ошибка сети');
      }

      const res: WordLabel[] = await response.json();
      const colors = res.map(it => colorsMap[it])
      const words = inputText.trim().split(/\s+/);

      if (colors.length !== words.length) {
        throw new Error('Количество цветов не совпадает с количеством слов');
      }

      const renderedText = words.map((word, index) => (
        <span
          key={index}
          style={{ color: colors[index], cursor: 'help' }}
          title={`Метка: ${res[index]}`}
        >
          {word}{' '}
        </span>
      ));

      setHighlightedText(renderedText);
    } catch (error) {
      console.error('Ошибка:', error);
      alert('Произошла ошибка при обработке запроса');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Определение ошибок</h1>
      <form onSubmit={handleSubmit}>
        <textarea          
          value={inputText}
          rows={6}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Введите текст..."
          style={{ width: '300px', padding: '8px' }}
        />
        <br/>
        <button type="submit" style={{ marginLeft: '10px', padding: '8px 12px' }}>
          Отправить
        </button>
      </form>

      <div style={{ marginTop: '20px', fontSize: '1.2rem' }}>
        {highlightedText || 'Здесь будет результат...'}
      </div>
    </div>
  );
}

export default App;