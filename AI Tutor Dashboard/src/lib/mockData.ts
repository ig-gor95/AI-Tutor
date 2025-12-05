import { Session, SessionResult } from '@/types';

// Mock данные для демонстрации
export const mockSessions: Session[] = [
  {
    id: 'session-1',
    organizerId: '1',
    organizerName: 'Александр Петров',
    params: {
      topic: 'Основы React и TypeScript',
      difficulty: 'intermediate',
      duration: 30,
      language: 'ru',
      goals: ['Понять хуки React', 'Научиться типизации в TypeScript', 'Разобрать примеры кода'],
      personality: 'friendly'
    },
    createdAt: new Date().toISOString(),
    shareUrl: '/session/session-1'
  },
  {
    id: 'session-2',
    organizerId: '1',
    organizerName: 'Александр Петров',
    params: {
      topic: 'SQL и работа с базами данных',
      difficulty: 'beginner',
      duration: 45,
      language: 'ru',
      goals: ['Основы SQL запросов', 'Работа с JOIN', 'Практические примеры'],
      personality: 'professional'
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    shareUrl: '/session/session-2'
  }
];

export const mockResults: SessionResult[] = [
  {
    id: 'result-1',
    sessionId: 'session-1',
    studentId: '2',
    studentName: 'Мария Иванова',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 1800000).toISOString(),
    transcript: [
      {
        role: 'ai',
        message: 'Привет! Я готов помочь тебе разобраться в React и TypeScript. С чего начнём?',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        role: 'user',
        message: 'Расскажи про хук useState',
        timestamp: new Date(Date.now() - 3500000).toISOString()
      },
      {
        role: 'ai',
        message: 'useState — это базовый хук для управления состоянием в функциональных компонентах. Он возвращает массив из двух элементов: текущее значение состояния и функцию для его обновления.',
        timestamp: new Date(Date.now() - 3400000).toISOString()
      },
      {
        role: 'user',
        message: 'А как работает useEffect?',
        timestamp: new Date(Date.now() - 3300000).toISOString()
      },
      {
        role: 'ai',
        message: 'useEffect позволяет выполнять побочные эффекты в функциональных компонентах. Он принимает функцию и массив зависимостей. Эффект запускается после каждого рендера, когда изменяются зависимости.',
        timestamp: new Date(Date.now() - 3200000).toISOString()
      },
      {
        role: 'user',
        message: 'Спасибо, теперь понятно!',
        timestamp: new Date(Date.now() - 3100000).toISOString()
      },
      {
        role: 'ai',
        message: 'Отлично! Ты хорошо усвоил материал. Продолжай практиковаться!',
        timestamp: new Date(Date.now() - 3000000).toISOString()
      }
    ],
    summary: 'Студент успешно освоил основы хуков React (useState, useEffect). Показал хорошее понимание концепций, задавал уточняющие вопросы. Рекомендуется больше практики с реальными примерами.',
    score: 85
  },
  {
    id: 'result-2',
    sessionId: 'session-2',
    studentId: '3',
    studentName: 'Дмитрий Смирнов',
    startedAt: new Date(Date.now() - 7200000).toISOString(),
    completedAt: new Date(Date.now() - 4500000).toISOString(),
    transcript: [
      {
        role: 'ai',
        message: 'Здравствуйте. Я готов провести занятие по теме "SQL и работа с базами данных". Приступим к обучению.',
        timestamp: new Date(Date.now() - 7200000).toISOString()
      },
      {
        role: 'user',
        message: 'Как написать простой SELECT запрос?',
        timestamp: new Date(Date.now() - 7100000).toISOString()
      },
      {
        role: 'ai',
        message: 'Базовый синтаксис SELECT: SELECT column1, column2 FROM table_name. Можно использовать * для выбора всех колонок.',
        timestamp: new Date(Date.now() - 7000000).toISOString()
      },
      {
        role: 'user',
        message: 'А как отфильтровать результаты?',
        timestamp: new Date(Date.now() - 6900000).toISOString()
      },
      {
        role: 'ai',
        message: 'Используйте WHERE для фильтрации: SELECT * FROM users WHERE age > 18. Можно комбинировать условия через AND и OR.',
        timestamp: new Date(Date.now() - 6800000).toISOString()
      },
      {
        role: 'user',
        message: 'Что такое JOIN и для чего он нужен?',
        timestamp: new Date(Date.now() - 6700000).toISOString()
      },
      {
        role: 'ai',
        message: 'JOIN объединяет данные из нескольких таблиц по общему полю. INNER JOIN возвращает только совпадающие записи, LEFT JOIN — все из левой таблицы плюс совпадения из правой.',
        timestamp: new Date(Date.now() - 6600000).toISOString()
      },
      {
        role: 'user',
        message: 'Можешь показать пример с INNER JOIN?',
        timestamp: new Date(Date.now() - 6500000).toISOString()
      },
      {
        role: 'ai',
        message: 'SELECT users.name, orders.total FROM users INNER JOIN orders ON users.id = orders.user_id. Это вернёт имена пользователей и суммы их заказов.',
        timestamp: new Date(Date.now() - 6400000).toISOString()
      },
      {
        role: 'user',
        message: 'Отлично, спасибо за объяснение!',
        timestamp: new Date(Date.now() - 6300000).toISOString()
      }
    ],
    summary: 'Ученик показал очень хорошее понимание SQL. Освоил базовые запросы SELECT, WHERE, работу с JOIN. Задавал содержательные вопросы, быстро усваивал материал. Готов к практическим задачам.',
    score: 92
  },
  {
    id: 'result-3',
    sessionId: 'session-1',
    studentId: '4',
    studentName: 'Анна Козлова',
    startedAt: new Date(Date.now() - 10800000).toISOString(),
    completedAt: new Date(Date.now() - 9000000).toISOString(),
    transcript: [
      {
        role: 'ai',
        message: 'Привет! Я готов помочь тебе разобраться в React и TypeScript. С чего начнём?',
        timestamp: new Date(Date.now() - 10800000).toISOString()
      },
      {
        role: 'user',
        message: 'Я слышала про TypeScript, но не понимаю зачем он нужен',
        timestamp: new Date(Date.now() - 10700000).toISOString()
      },
      {
        role: 'ai',
        message: 'TypeScript добавляет статическую типизацию в JavaScript. Это помогает находить ошибки на этапе разработки, улучшает автодополнение кода и делает его более понятным для других разработчиков.',
        timestamp: new Date(Date.now() - 10600000).toISOString()
      },
      {
        role: 'user',
        message: 'Как типизировать props в React компоненте?',
        timestamp: new Date(Date.now() - 10500000).toISOString()
      },
      {
        role: 'ai',
        message: 'Создайте интерфейс для props: interface Props { name: string; age: number; }. Затем используйте: function MyComponent({ name, age }: Props) { ... }',
        timestamp: new Date(Date.now() - 10400000).toISOString()
      },
      {
        role: 'user',
        message: 'А необязательные параметры?',
        timestamp: new Date(Date.now() - 10300000).toISOString()
      },
      {
        role: 'ai',
        message: 'Используйте знак вопроса: interface Props { name: string; age?: number; }. Теперь age необязателен.',
        timestamp: new Date(Date.now() - 10200000).toISOString()
      }
    ],
    summary: 'Студентка начала с нуля, но показала хороший прогресс в понимании TypeScript. Освоила базовую типизацию props. Рекомендуется дополнительная практика с более сложными типами и дженериками.',
    score: 78
  },
  {
    id: 'result-4',
    sessionId: 'session-2',
    studentName: 'Гость (незарегистрирован)',
    startedAt: new Date(Date.now() - 14400000).toISOString(),
    completedAt: new Date(Date.now() - 12600000).toISOString(),
    transcript: [
      {
        role: 'ai',
        message: 'Здравствуйте. Я готов провести занятие по теме "SQL и работа с базами данных". Приступим к обучению.',
        timestamp: new Date(Date.now() - 14400000).toISOString()
      },
      {
        role: 'user',
        message: 'Что такое первичный ключ?',
        timestamp: new Date(Date.now() - 14300000).toISOString()
      },
      {
        role: 'ai',
        message: 'PRIMARY KEY — уникальный идентификатор записи в таблице. Каждое значение должно быть уникальным и не может быть NULL.',
        timestamp: new Date(Date.now() - 14200000).toISOString()
      },
      {
        role: 'user',
        message: 'А внешний ключ?',
        timestamp: new Date(Date.now() - 14100000).toISOString()
      },
      {
        role: 'ai',
        message: 'FOREIGN KEY — ссылка на первичный ключ другой таблицы. Используется для связи между таблицами и обеспечения целостности данных.',
        timestamp: new Date(Date.now() - 14000000).toISOString()
      }
    ],
    summary: 'Незарегистрированный пользователь изучил базовые концепции ключей в БД. Короткая сессия, но продуктивная. Материал усвоен частично.',
    score: 65
  },
  {
    id: 'result-5',
    sessionId: 'session-1',
    studentId: '5',
    studentName: 'Игорь Волков',
    startedAt: new Date(Date.now() - 18000000).toISOString(),
    completedAt: new Date(Date.now() - 16200000).toISOString(),
    transcript: [
      {
        role: 'ai',
        message: 'Привет! Я готов помочь тебе разобраться в React и TypeScript. С чего начнём?',
        timestamp: new Date(Date.now() - 18000000).toISOString()
      },
      {
        role: 'user',
        message: 'Расскажи про useContext',
        timestamp: new Date(Date.now() - 17900000).toISOString()
      },
      {
        role: 'ai',
        message: 'useContext позволяет получить доступ к контексту React. Это удобный способ передачи данных через дерево компонентов без прокидывания props на каждом уровне.',
        timestamp: new Date(Date.now() - 17800000).toISOString()
      },
      {
        role: 'user',
        message: 'Как создать контекст с TypeScript?',
        timestamp: new Date(Date.now() - 17700000).toISOString()
      },
      {
        role: 'ai',
        message: 'Создайте тип для контекста: type ThemeContext = { theme: string; setTheme: (theme: string) => void; }. Затем: const ThemeContext = createContext<ThemeContext | null>(null);',
        timestamp: new Date(Date.now() - 17600000).toISOString()
      },
      {
        role: 'user',
        message: 'А как типизировать useReducer?',
        timestamp: new Date(Date.now() - 17500000).toISOString()
      },
      {
        role: 'ai',
        message: 'Определите типы для состояния и действий: type State = { count: number }; type Action = { type: "increment" } | { type: "decrement" }; const reducer = (state: State, action: Action): State => { ... }',
        timestamp: new Date(Date.now() - 17400000).toISOString()
      },
      {
        role: 'user',
        message: 'Супер! Это продвинутые темы, спасибо',
        timestamp: new Date(Date.now() - 17300000).toISOString()
      },
      {
        role: 'ai',
        message: 'Отлично справился! Ты понимаешь сложные концепции React и TypeScript на высоком уровне.',
        timestamp: new Date(Date.now() - 17200000).toISOString()
      }
    ],
    summary: 'Продвинутый студент с отличным пониманием React и TypeScript. Изучил useContext, useReducer с типизацией. Демонстрирует глубокое понимание паттернов. Готов к самостоятельной разработке сложных приложений.',
    score: 95
  },
  {
    id: 'result-6',
    sessionId: 'session-1',
    studentId: '6',
    studentName: 'Елена Морозова',
    startedAt: new Date(Date.now() - 21600000).toISOString(),
    completedAt: new Date(Date.now() - 19800000).toISOString(),
    transcript: [
      {
        role: 'ai',
        message: 'Привет! Я готов помочь тебе разобраться в React и TypeScript. С чего начнём?',
        timestamp: new Date(Date.now() - 21600000).toISOString()
      },
      {
        role: 'user',
        message: 'Я только начинаю изучать React',
        timestamp: new Date(Date.now() - 21500000).toISOString()
      },
      {
        role: 'ai',
        message: 'Отлично! Начнём с основ. React — это библиотека для создания пользовательских интерфейсов. Основная концепция — компоненты, которые можно переиспользовать.',
        timestamp: new Date(Date.now() - 21400000).toISOString()
      },
      {
        role: 'user',
        message: 'Что такое компонент?',
        timestamp: new Date(Date.now() - 21300000).toISOString()
      },
      {
        role: 'ai',
        message: 'Компонент — это переиспользуемый кусок UI. Это может быть функция, которая возвращает JSX: function Button() { return <button>Click me</button> }',
        timestamp: new Date(Date.now() - 21200000).toISOString()
      },
      {
        role: 'user',
        message: 'А что такое JSX?',
        timestamp: new Date(Date.now() - 21100000).toISOString()
      },
      {
        role: 'ai',
        message: 'JSX — это синтаксис, похожий на HTML, который позволяет писать разметку прямо в JavaScript коде. React преобразует его в обычные JavaScript вызовы.',
        timestamp: new Date(Date.now() - 21000000).toISOString()
      }
    ],
    summary: 'Студентка-новичок, начинает изучение с нуля. Освоила базовые концепции компонентов и JSX. Задаёт правильные вопросы. Требуется больше времени и практики для закрепления материала.',
    score: 70
  },
  {
    id: 'result-7',
    sessionId: 'session-2',
    studentId: '7',
    studentName: 'Алексей Кузнецов',
    startedAt: new Date(Date.now() - 25200000).toISOString(),
    completedAt: new Date(Date.now() - 23400000).toISOString(),
    transcript: [
      {
        role: 'ai',
        message: 'Здравствуйте. Я готов провести занятие по теме "SQL и работа с базами данных". Приступим к обучению.',
        timestamp: new Date(Date.now() - 25200000).toISOString()
      },
      {
        role: 'user',
        message: 'Как группировать данные в SQL?',
        timestamp: new Date(Date.now() - 25100000).toISOString()
      },
      {
        role: 'ai',
        message: 'Используйте GROUP BY для группировки: SELECT category, COUNT(*) FROM products GROUP BY category. Это подсчитает количество товаров в каждой категории.',
        timestamp: new Date(Date.now() - 25000000).toISOString()
      },
      {
        role: 'user',
        message: 'А как отфильтровать результаты группировки?',
        timestamp: new Date(Date.now() - 24900000).toISOString()
      },
      {
        role: 'ai',
        message: 'Используйте HAVING после GROUP BY: SELECT category, COUNT(*) FROM products GROUP BY category HAVING COUNT(*) > 10. HAVING работает с агрегатными функциями, в отличие от WHERE.',
        timestamp: new Date(Date.now() - 24800000).toISOString()
      },
      {
        role: 'user',
        message: 'В чём разница между WHERE и HAVING?',
        timestamp: new Date(Date.now() - 24700000).toISOString()
      },
      {
        role: 'ai',
        message: 'WHERE фильтрует строки до группировки, HAVING — после. WHERE работает с отдельными строками, HAVING — с результатами агрегатных функций (COUNT, SUM, AVG).',
        timestamp: new Date(Date.now() - 24600000).toISOString()
      },
      {
        role: 'user',
        message: 'Понял, спасибо за чёткое объяснение!',
        timestamp: new Date(Date.now() - 24500000).toISOString()
      }
    ],
    summary: 'Студент изучил продвинутые темы SQL: GROUP BY, HAVING, агрегатные функции. Хорошо понимает разницу между WHERE и HAVING. Показал высокий уровень аналитического мышления.',
    score: 88
  }
];

export function getSessions(): Session[] {
  const stored = localStorage.getItem('sessions');
  return stored ? JSON.parse(stored) : mockSessions;
}

export function saveSession(session: Session): void {
  const sessions = getSessions();
  sessions.push(session);
  localStorage.setItem('sessions', JSON.stringify(sessions));
}

export function getSessionById(id: string): Session | undefined {
  return getSessions().find(s => s.id === id);
}

export function getResults(): SessionResult[] {
  const stored = localStorage.getItem('results');
  return stored ? JSON.parse(stored) : mockResults;
}

export function saveResult(result: SessionResult): void {
  const results = getResults();
  results.push(result);
  localStorage.setItem('results', JSON.stringify(results));
}

export function getResultsByStudentId(studentId: string): SessionResult[] {
  return getResults().filter(r => r.studentId === studentId);
}

export function getResultsByOrganizerId(organizerId: string): SessionResult[] {
  const sessions = getSessions().filter(s => s.organizerId === organizerId);
  const sessionIds = sessions.map(s => s.id);
  return getResults().filter(r => sessionIds.includes(r.sessionId));
}