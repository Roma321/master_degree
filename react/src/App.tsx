import { useState, useEffect } from 'react';

type WordLabel = "O" | "Voice" | "paronym" | "typo" | "Number" | "Gender" | "Tense" | "Case" | "Person"

const colorsMap: Record<WordLabel, string> = {
  O: 'white',
  Voice: 'green',
  paronym: 'pink',
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
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Определяем, мобильное ли устройство
  useEffect(() => {
    const mobileCheck = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
  }, []);

  // Скрываем toast через 3 секунды
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedtext = normalizeSpacesAroundPunctuation(inputText);
    setInputText(normalizedtext);

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
      const colors = res.map(it => colorsMap[it]);
      const words = inputText.trim().split(/\s+/);

      if (colors.length !== words.length) {
        throw new Error('Количество цветов не совпадает с количеством слов');
      }

      const renderedText = words.map((word, index) => (
        <span
          key={index}
          style={{ color: colors[index], cursor: 'help' }}
          title={!isMobile ? `Метка: ${res[index]}` : undefined}
          onClick={() => isMobile && setToastMessage(`Метка: ${res[index]}`)}
          onTouchStart={() => isMobile && setToastMessage(`Метка: ${res[index]}`)}
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

      {/* Toast уведомление */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#333',
          color: '#fff',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 9999,
          opacity: 0.9,
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default App;