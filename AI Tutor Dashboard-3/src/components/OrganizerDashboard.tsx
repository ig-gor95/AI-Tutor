import { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, Calendar, Clock, Target, Copy, Check, BarChart3, Users, MessageSquare, Video, BookOpen, Brain, ListChecks, FileText, ChevronDown, ChevronUp, Sparkles, Wand2, X } from 'lucide-react';
import { Session, SessionParams, User, SessionResult } from '@/types';
import { getResultsByOrganizer, createSession } from '@/lib/sessionApi';

interface Props {
  user: User;
  sessions: Session[];
  onRefresh: () => void;
  onOpenSession: (sessionId: string) => void;
}

export function OrganizerDashboard({ user, sessions, onRefresh, onOpenSession }: Props) {
  // Получаем начальную вкладку из URL или используем 'manage' по умолчанию
  const getInitialTab = (): 'manage' | 'sessions' | 'students' => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'manage' || tab === 'sessions' || tab === 'students') {
      return tab;
    }
    return 'manage';
  };

  const [activeTab, setActiveTab] = useState<'manage' | 'sessions' | 'students'>(getInitialTab());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<SessionParams>({
    topic: '',
    difficulty: 'intermediate',
    duration: 30,
    language: 'ru',
    goals: [],
    personality: 'friendly',
    interactionStyle: 'mixed'
  });
  const [goalInput, setGoalInput] = useState('');
  const [criteriaInput, setCriteriaInput] = useState('');
  const [focusInput, setFocusInput] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Синхронизация activeTab с URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', newUrl);
  }, [activeTab]);

  // Чтение вкладки из URL при изменении URL (например, при навигации назад/вперед)
  useEffect(() => {
    const handlePopState = () => {
      const tab = getInitialTab();
      setActiveTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const userSessions = sessions.filter(s => s.organizerId === user.id);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Загрузка результатов с бэкенда
  useEffect(() => {
    const loadResults = async () => {
      if (user.id) {
        try {
          setIsLoadingResults(true);
          const loadedResults = await getResultsByOrganizer(user.id);
          setResults(loadedResults);
        } catch (error) {
          console.error('Failed to load results:', error);
          setResults([]);
        } finally {
          setIsLoadingResults(false);
        }
      }
    };
    
    loadResults();
  }, [user.id]);

  // Обновление результатов при переключении на вкладку статистики
  useEffect(() => {
    if (activeTab === 'students' && user.id) {
      const loadResults = async () => {
        try {
          setIsLoadingResults(true);
          const loadedResults = await getResultsByOrganizer(user.id);
          setResults(loadedResults);
        } catch (error) {
          console.error('Failed to refresh results:', error);
          setResults([]);
        } finally {
          setIsLoadingResults(false);
        }
      };
      
      loadResults();
    }
  }, [activeTab, user.id]);

  const handleCreateSession = async () => {
    try {
      setIsProcessing(true);
      const newSession = await createSession(formData);
      setShowCreateForm(false);
      setFormData({
        topic: '',
        difficulty: 'intermediate',
        duration: 30,
        language: 'ru',
        goals: [],
        personality: 'friendly',
        interactionStyle: 'mixed'
      });
      onRefresh(); // Обновляем список сессий
    } catch (error) {
      console.error('Failed to create session:', error);
      alert('Ошибка создания сессии. Попробуйте еще раз.');
    } finally {
      setIsProcessing(false);
    }
  };

  const addGoal = () => {
    if (goalInput.trim()) {
      setFormData({
        ...formData,
        goals: [...formData.goals, goalInput.trim()]
      });
      setGoalInput('');
    }
  };

  const removeGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index)
    });
  };

  const addCriteria = () => {
    if (criteriaInput.trim()) {
      setFormData({
        ...formData,
        evaluationCriteria: [...(formData.evaluationCriteria || []), criteriaInput.trim()]
      });
      setCriteriaInput('');
    }
  };

  const removeCriteria = (index: number) => {
    setFormData({
      ...formData,
      evaluationCriteria: formData.evaluationCriteria?.filter((_, i) => i !== index)
    });
  };

  const addFocusArea = () => {
    if (focusInput.trim()) {
      setFormData({
        ...formData,
        focusAreas: [...(formData.focusAreas || []), focusInput.trim()]
      });
      setFocusInput('');
    }
  };

  const removeFocusArea = (index: number) => {
    setFormData({
      ...formData,
      focusAreas: formData.focusAreas?.filter((_, i) => i !== index)
    });
  };

  const copyToClipboard = (sessionId: string, url: string) => {
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleTranscript = (resultId: string) => {
    setExpandedTranscripts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(resultId)) {
        newSet.delete(resultId);
      } else {
        newSet.add(resultId);
      }
      return newSet;
    });
  };

  const handleAIGenerate = async () => {
    if (!aiDescription.trim()) return;
    
    setIsGenerating(true);
    
    // Имитация обработки AI (в продакшене будет реальный API call)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Парсинг и генерация данных на основе описания
    const description = aiDescription.toLowerCase();
    
    // Определяем тему
    let topic = '';
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    let duration = 30;
    let goals: string[] = [];
    let evaluationCriteria: string[] = [];
    let focusAreas: string[] = [];
    let roleContext = '';
    let interactionStyle: 'questions' | 'practice' | 'theory' | 'mixed' = 'mixed';
    let contextDescription = aiDescription;
    let personality: 'friendly' | 'professional' | 'motivating' = 'friendly';
    
    // Определяем предмет/тему
    if (description.includes('react')) {
      topic = 'Основы React';
      goals = ['Понимание компонентов', 'Работа с хуками', 'Управление состоянием'];
      evaluationCriteria = ['Понимание JSX', 'Использование useState и useEffect', 'Создание компонентов'];
      focusAreas = ['Hooks', 'Components', 'Props'];
      roleContext = 'Опытный React-разработчик и преподаватель';
    } else if (description.includes('python') || description.includes('питон')) {
      topic = 'Программирование на Python';
      goals = ['Основы синтаксиса', 'Работа с функциями', 'ООП в Python'];
      evaluationCriteria = ['Знание базовых конструкций', 'Умение писать функции', 'Понимание ООП'];
      focusAreas = ['Синтаксис', 'Функции', 'Классы'];
      roleContext = 'Эксперт по Python с педагогическим опытом';
    } else if (description.includes('английск') || description.includes('english')) {
      topic = 'Английский язык';
      goals = ['Улучшение разговорных навыков', 'Расширение словарного запаса', 'Практика грамматики'];
      evaluationCriteria = ['Правильность произношения', 'Использование времен', 'Активный словарный запас'];
      focusAreas = ['Speaking', 'Vocabulary', 'Grammar'];
      roleContext = 'Преподаватель английского языка с носителем';
    } else if (description.includes('математик') || description.includes('math')) {
      topic = 'Математика';
      goals = ['Решение задач', 'Понимание теории', 'Применение формул'];
      evaluationCriteria = ['Точность вычислений', 'Логика решения', 'Объяснение хода мыслей'];
      focusAreas = ['Алгебра', 'Геоетрия', 'Задачи'];
      roleContext = 'Преподаватель математики';
    } else if (description.includes('дизайн') || description.includes('design')) {
      topic = 'Основы дизайна';
      goals = ['Понимание композиции', 'Работа с цветом', 'Типографика'];
      evaluationCriteria = ['Чувство композиции', 'Знание теории цвета', 'Навыки типографики'];
      focusAreas = ['Composition', 'Color Theory', 'Typography'];
      roleContext = 'Профессиональный дизайнер и наставник';
    } else if (description.includes('интервью') || description.includes('собеседован')) {
      topic = 'Подготовка к техническому интервью';
      goals = ['Уверенность при ответах', 'Знание алгоритмов', 'Понимание патт��рнов'];
      evaluationCriteria = ['Структура ответа', 'Техническая корректность', 'Коммуникабельность'];
      focusAreas = ['Алгоритмы', 'Паттерны проектирования', 'Системный дизайн'];
      roleContext = 'Технический интервьюер FAANG компаний';
      personality = 'professional';
    } else {
      // Общий случай - извлекаем тему из первых слов
      topic = aiDescription.split('.')[0].substring(0, 50);
      goals = ['Освоить основы темы', 'Получить практические навыки', 'Закрепить знания'];
      evaluationCriteria = ['Понимание концепций', 'Практическое применение', 'Качество ответов'];
      focusAreas = ['Теория', 'Практика', 'Применение'];
      roleContext = 'Опытный преподаватель';
    }
    
    // Определяем уровень сложности
    if (description.includes('начальн') || description.includes('новичк') || description.includes('beginner')) {
      difficulty = 'beginner';
    } else if (description.includes('продвинут') || description.includes('advanced') || description.includes('эксперт')) {
      difficulty = 'advanced';
    }
    
    // Определяем длительность
    if (description.includes('быстр') || description.includes('short')) {
      duration = 15;
    } else if (description.includes('подробн') || description.includes('длинн') || description.includes('long')) {
      duration = 60;
    }
    
    // Определяем стиль взаимодействия
    if (description.includes('вопрос') || description.includes('question')) {
      interactionStyle = 'questions';
    } else if (description.includes('практик') || description.includes('practice') || description.includes('задач')) {
      interactionStyle = 'practice';
    } else if (description.includes('теори') || description.includes('theory') || description.includes('лекц')) {
      interactionStyle = 'theory';
    }
    
    // Определяем характер
    if (description.includes('мотивир') || description.includes('motivat') || description.includes('вдохновл')) {
      personality = 'motivating';
    } else if (description.includes('професс') || description.includes('серьёзн') || description.includes('строг')) {
      personality = 'professional';
    }
    
    setFormData({
      ...formData,
      topic,
      difficulty,
      duration,
      goals,
      evaluationCriteria,
      focusAreas,
      roleContext,
      interactionStyle,
      contextDescription,
      personality
    });
    
    setIsGenerating(false);
    setAiDescription('');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">Всего сессий</p>
            </div>
            <p className="text-2xl sm:text-3xl text-gray-900">{userSessions.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">
                {results.length === 1 ? 'Ученик прошёл' : 
                 results.length >= 2 && results.length <= 4 ? 'Ученика прошли' : 
                 'Учеников прошли'}
              </p>
            </div>
            <p className="text-2xl sm:text-3xl text-gray-900">{results.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-sm sm:text-base text-gray-600">Средний балл</p>
            </div>
            <p className="text-2xl sm:text-3xl text-gray-900">
              {results.length > 0 
                ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length)
                : 0}
            </p>
          </div>
        </div>

        {/* Tabs - меню навигации */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Управление</span>
            <span className="sm:hidden">Сессии</span>
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'sessions'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Сессии с роботом</span>
            <span className="sm:hidden">Робот</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 sm:flex-none px-3 sm:px-6 py-2 sm:py-3 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm whitespace-nowrap ${
              activeTab === 'students'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span>Статистика</span>
          </button>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl text-gray-900 mb-1">
              {activeTab === 'manage' 
                ? 'Управление сессиями' 
                : activeTab === 'sessions'
                ? 'Мои разговоры с роботом'
                : 'Статистика учеников'}
            </h2>
            <p className="text-sm sm:text-base text-gray-600">
              {activeTab === 'manage' 
                ? 'Создавайте и управляйте учебными сессиями' 
                : activeTab === 'sessions'
                ? 'Протестируйте и пообщайтесь с AI-тьютором'
                : 'Детальная статистика по всем ученикам'}
            </p>
          </div>
          {activeTab === 'manage' && (
            <div className="relative">
              <button
                onClick={() => setShowCreateMenu(!showCreateMenu)}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Создать сессию</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showCreateMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowCreateForm(true);
                      setShowCreateMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Обычная сессия</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateForm(true);
                      setShowCreateMenu(false);
                      // Прокручиваем к полю AI генерации
                      setTimeout(() => {
                        const aiField = document.getElementById('ai-description');
                        aiField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        aiField?.focus();
                      }, 100);
                    }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Через AI (быстро)</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Закрытие меню при клике вне его */}
        {showCreateMenu && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowCreateMenu(false)}
          />
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-8 relative">
              {/* Close Button */}
              <button
                onClick={() => setShowCreateForm(false)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 z-10"
                aria-label="Закрыть"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <h3 className="text-lg sm:text-xl text-gray-900 mb-4 sm:mb-6 pr-8">Создать новую сессию</h3>
              
              {/* AI Auto-fill Section */}
              <div className="mb-6 p-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl border-2 border-purple-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      Автозаполнение с помощью AI
                    </h4>
                    <p className="text-sm text-gray-600">
                      Опишите что хотите — AI заполнит все поля автоматически
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <textarea
                    value={aiDescription}
                    onChange={(e) => setAiDescription(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none bg-white"
                    placeholder="Например: Хочу создать урок по React для начинающих на 45 минут с упором на практику. Робот должен быть дружелюбным и мотивирующим."
                    rows={3}
                    disabled={isGenerating}
                  />
                  
                  <button
                    onClick={handleAIGenerate}
                    disabled={!aiDescription.trim() || isGenerating}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Генерирую...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        <span>Заполнить форму через AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">или заполните вручную</span>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Тема урока</label>
                  <input
                    type="text"
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Например: Основы React"
                  />
                </div>

                {/* Уровень сложности - кастомные кнопки */}
                <div>
                  <label className="block text-sm text-gray-700 mb-3">Уровень сложности</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'beginner', label: 'Начальный', emoji: '🌱' },
                      { value: 'intermediate', label: 'Средний', emoji: '📚' },
                      { value: 'advanced', label: 'Продвинутый', emoji: '🚀' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, difficulty: option.value as any })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.difficulty === option.value
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="text-2xl mb-2">{option.emoji}</div>
                        <div className={`text-sm ${
                          formData.difficulty === option.value ? 'text-blue-700' : 'text-gray-700'
                        }`}>
                          {option.label}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Длительность - кнопки выбора */}
                <div>
                  <label className="block text-sm text-gray-700 mb-3">Длительность урока</label>
                  <div className="grid grid-cols-4 gap-3">
                    {[15, 30, 45, 60].map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setFormData({ ...formData, duration })}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                          formData.duration === duration
                            ? 'border-purple-500 bg-purple-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`text-xl mb-1 ${
                          formData.duration === duration ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {duration}
                        </div>
                        <div className={`text-xs ${
                          formData.duration === duration ? 'text-purple-600' : 'text-gray-600'
                        }`}>
                          минут
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Язык и Характер AI */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-gray-700 mb-3">Язык общения</label>
                    <div className="space-y-2">
                      {[
                        { value: 'ru', label: 'Русский', flag: '🇷🇺' },
                        { value: 'en', label: 'English', flag: '🇬🇧' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, language: option.value as any })}
                          className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                            formData.language === option.value
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <span className="text-2xl">{option.flag}</span>
                          <span className={`${
                            formData.language === option.value ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {option.label}
                          </span>
                          {formData.language === option.value && (
                            <Check className="w-5 h-5 text-blue-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-3">Характер робота</label>
                    <div className="space-y-2">
                      {[
                        { value: 'friendly', label: 'Дружелюбный', emoji: '😊' },
                        { value: 'professional', label: 'Профессиональный', emoji: '👔' },
                        { value: 'motivating', label: 'Мотивирующий', emoji: '💪' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, personality: option.value as any })}
                          className={`w-full p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                            formData.personality === option.value
                              ? 'border-purple-500 bg-purple-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <span className="text-2xl">{option.emoji}</span>
                          <span className={`${
                            formData.personality === option.value ? 'text-purple-700' : 'text-gray-700'
                          }`}>
                            {option.label}
                          </span>
                          {formData.personality === option.value && (
                            <Check className="w-5 h-5 text-purple-600 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Цели обучения</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addGoal())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Добавьте цель и нажмите Enter"
                    />
                    <button
                      type="button"
                      onClick={addGoal}
                      className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.goals.map((goal, index) => (
                      <div key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
                        <span>{goal}</span>
                        <button
                          type="button"
                          onClick={() => removeGoal(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Критерии оценки</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={criteriaInput}
                      onChange={(e) => setCriteriaInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCriteria())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Добавьте критерий и нажмите Enter"
                    />
                    <button
                      type="button"
                      onClick={addCriteria}
                      className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.evaluationCriteria?.map((criteria, index) => (
                      <div key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
                        <span>{criteria}</span>
                        <button
                          type="button"
                          onClick={() => removeCriteria(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-2">Области фокуса</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={focusInput}
                      onChange={(e) => setFocusInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFocusArea())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      placeholder="Добавьте область фокуса и нажмите Enter"
                    />
                    <button
                      type="button"
                      onClick={addFocusArea}
                      className="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.focusAreas?.map((focusArea, index) => (
                      <div key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2">
                        <span>{focusArea}</span>
                        <button
                          type="button"
                          onClick={() => removeFocusArea(index)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Расширенные настройки AI */}
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Brain className="w-5 h-5 text-purple-600" />
                    <h4 className="text-gray-900">Расширенные настройки AI</h4>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Роль AI-робота</label>
                      <input
                        type="text"
                        value={formData.roleContext || ''}
                        onChange={(e) => setFormData({ ...formData, roleContext: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="Например: Опытный преподаватель React, Технический интервьюер"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-3">Стиль взаимодействия</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { value: 'questions', label: 'Вопросы и ответы', icon: '❓' },
                          { value: 'practice', label: 'Практические задания', icon: '💻' },
                          { value: 'theory', label: 'Теоретический материал', icon: '📖' },
                          { value: 'mixed', label: 'Смешанный стиль', icon: '🎯' }
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, interactionStyle: option.value as any })}
                            className={`p-3 rounded-lg border-2 transition-all duration-200 flex items-center gap-3 ${
                              formData.interactionStyle === option.value
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <span className="text-xl">{option.icon}</span>
                            <span className={`text-sm ${
                              formData.interactionStyle === option.value ? 'text-blue-700' : 'text-gray-700'
                            }`}>
                              {option.label}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Описание контекста</label>
                      <textarea
                        value={formData.contextDescription || ''}
                        onChange={(e) => setFormData({ ...formData, contextDescription: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        placeholder="Опишите контекст урока, специфические требования, особенности аудитории..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Предполагаемый уровень знаний ученика</label>
                      <textarea
                        value={formData.expectedKnowledge || ''}
                        onChange={(e) => setFormData({ ...formData, expectedKnowledge: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        placeholder="Что ученик должен знать перед началом урока..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Дополнительные инструкции для AI</label>
                      <textarea
                        value={formData.additionalInstructions || ''}
                        onChange={(e) => setFormData({ ...formData, additionalInstructions: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                        placeholder="Дополнительные требования к поведению AI, специфические указания..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={handleCreateSession}
                  disabled={!formData.topic}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Создать сессию
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {activeTab === 'manage' ? (
            // Management Tab Content
            <>
              {userSessions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">Пока нет созданных сессий</p>
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Создать первую сессию
                  </button>
                </div>
              ) : (
                userSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-base sm:text-lg text-gray-900 mb-2">{session.params.topic}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm">
                            {session.params.difficulty === 'beginner' ? 'Начальный' : 
                             session.params.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                          </span>
                          <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.params.duration} мин
                          </span>
                          <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm">
                            {session.params.personality === 'friendly' ? 'Дружелюбный' :
                             session.params.personality === 'professional' ? 'Профессиональный' : 'Мотивирующий'}
                          </span>
                        </div>
                        {session.params.goals.length > 0 && (
                          <div className="text-xs sm:text-sm text-gray-600">
                            <p className="mb-1">Цели:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {session.params.goals.map((goal, i) => (
                                <li key={i}>{goal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg">
                      <LinkIcon className="w-4 h-4 text-gray-600 hidden sm:block" />
                      <code className="flex-1 text-xs sm:text-sm text-gray-700 truncate">
                        {window.location.origin}{session.shareUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(session.id, session.shareUrl)}
                        className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-sm"
                      >
                        {copiedId === session.id ? (
                          <>
                            <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Скопировано</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>Копировать</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Создана {new Date(session.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {(() => {
                            const count = results.filter(r => r.sessionId === session.id).length;
                            return `${count} ${
                              count === 1 ? 'ученик' : 
                              count >= 2 && count <= 4 ? 'ученика' : 
                              'учеников'
                            }`;
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : activeTab === 'sessions' ? (
            // Sessions Tab Content - List of sessions to talk with robot
            <>
              {userSessions.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Video className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">Создайте сессию, чтобы пообщаться с роботом</p>
                  <button
                    onClick={() => {
                      setActiveTab('manage');
                      setShowCreateForm(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                  >
                    Создать сессию
                  </button>
                </div>
              ) : (
                userSessions.map((session) => (
                  <div key={session.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <span className="text-4xl">🤖</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 mb-2">{session.params.topic}</h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                            {session.params.difficulty === 'beginner' ? 'Начальный' : 
                             session.params.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                          </span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {session.params.duration} мин
                          </span>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                            {session.params.personality === 'friendly' ? 'Дружелюбный' :
                             session.params.personality === 'professional' ? 'Профессиональный' : 'Мотивирующий'}
                          </span>
                        </div>
                        <button
                          onClick={() => onOpenSession(session.id)}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                        >
                          <Video className="w-5 h-5" />
                          <span>Начать разговор с роботом</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          ) : (
            // Students Tab Content - Statistics about students
            <>
              {isLoadingResults ? (
                <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-8 h-8 text-gray-400 animate-pulse" />
                  </div>
                  <p className="text-gray-600">Загрузка статистики...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 mb-4">Пока нет результатов от учеников</p>
                  <p className="text-sm text-gray-500">
                    Создайте сессию и поделитесь ссылкой с учениками
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop Table Header - hidden on mobile */}
                  <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <div className="grid grid-cols-5 gap-4">
                        <div className="col-span-2">
                          <p className="text-sm text-gray-700">Ученик / Сессия</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Оценка</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Дата</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-700">Сообщений</p>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Table Body */}
                    <div className="divide-y divide-gray-200">
                      {results.map((result) => {
                        const session = sessions.find(s => s.id === result.sessionId);
                        const isExpanded = expandedTranscripts.has(result.id);
                        return (
                          <div key={result.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                            <div className="grid grid-cols-5 gap-4 items-center">
                              <div className="col-span-2">
                                <p className="text-gray-900">
                                  {result.studentName || 'Незарегистрированный ученик'}
                                </p>
                                <p className="text-sm text-gray-600 truncate">
                                  {session?.params.topic}
                                </p>
                              </div>
                              <div>
                                {result.score && (
                                  <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full">
                                    <span className="text-lg">{result.score}</span>
                                    <span className="text-xs ml-1">/100</span>
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">
                                  {new Date(result.completedAt || result.startedAt).toLocaleDateString('ru-RU', { 
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(result.completedAt || result.startedAt).toLocaleTimeString('ru-RU', { 
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div>
                                <div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full">
                                  <MessageSquare className="w-3 h-3" />
                                  <span className="text-sm">{result.transcript?.length || 0}</span>
                                </div>
                              </div>
                            </div>

                            {result.summary && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-700">{result.summary}</p>
                              </div>
                            )}

                            {/* Transcript Toggle Button */}
                            {result.transcript && result.transcript.length > 0 && (
                              <div className="mt-3">
                                <button
                                  onClick={() => toggleTranscript(result.id)}
                                  className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm">
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp className="w-4 h-4" />
                                      <span>Скрыть транскрипцию</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-4 h-4" />
                                      <span>Показать транскрипцию ({result.transcript.length} сообщений)</span>
                                    </>
                                  )}
                                </button>

                                {/* Transcript Content */}
                                {isExpanded && (
                                  <div className="mt-3 p-4 bg-white border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                                    <div className="space-y-3">
                                      {result.transcript.map((message, index) => (
                                        <div key={index} className={`flex gap-3 ${message.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                                          <div className={`max-w-[80%] rounded-lg px-4 py-3 ${
                                            message.role === 'ai' 
                                              ? 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200' 
                                              : 'bg-gray-100 border border-gray-200'
                                          }`}>
                                            <div className="flex items-center gap-2 mb-1">
                                              <div className={`w-2 h-2 rounded-full ${message.role === 'ai' ? 'bg-blue-600' : 'bg-gray-600'}`} />
                                              <span className="text-xs text-gray-500">
                                                {message.role === 'ai' ? '🤖 AI-робот' : '👤 Ученик'}
                                              </span>
                                              <span className="text-xs text-gray-400">
                                                {new Date(message.timestamp).toLocaleTimeString('ru-RU', { 
                                                  hour: '2-digit',
                                                  minute: '2-digit'
                                                })}
                                              </span>
                                            </div>
                                            <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.message}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {results.map((result) => {
                      const session = sessions.find(s => s.id === result.sessionId);
                      const isExpanded = expandedTranscripts.has(result.id);
                      return (
                        <div key={result.id} className="bg-white rounded-xl p-4 border border-gray-200">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {result.studentName || 'Незарегистрированный ученик'}
                              </p>
                              <p className="text-xs text-gray-600">
                                {session?.params.topic}
                              </p>
                            </div>
                            {result.score && (
                              <div className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                <span>{result.score}</span>
                                <span className="ml-0.5">/100</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>
                                {new Date(result.completedAt || result.startedAt).toLocaleDateString('ru-RU', { 
                                  day: 'numeric',
                                  month: 'short'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(result.completedAt || result.startedAt).toLocaleTimeString('ru-RU', { 
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              <span>{result.transcript?.length || 0}</span>
                            </div>
                          </div>

                          {result.summary && (
                            <div className="p-2 bg-gray-50 rounded-lg mb-3">
                              <p className="text-xs text-gray-700">{result.summary}</p>
                            </div>
                          )}

                          {result.transcript && result.transcript.length > 0 && (
                            <div>
                              <button
                                onClick={() => toggleTranscript(result.id)}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-xs">
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    <span>Скрыть транскрипцию</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    <span>Транскрипция ({result.transcript.length})</span>
                                  </>
                                )}
                              </button>

                              {isExpanded && (
                                <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                                  <div className="space-y-2">
                                    {result.transcript.map((message, index) => (
                                      <div key={index} className={`flex gap-2 ${message.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                                        <div className={`max-w-[85%] rounded-lg px-3 py-2 ${
                                          message.role === 'ai' 
                                            ? 'bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200' 
                                            : 'bg-gray-100 border border-gray-200'
                                        }`}>
                                          <div className="flex items-center gap-1 mb-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${message.role === 'ai' ? 'bg-blue-600' : 'bg-gray-600'}`} />
                                            <span className="text-[10px] text-gray-500">
                                              {message.role === 'ai' ? '🤖 AI' : '👤 Ученик'}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                              {new Date(message.timestamp).toLocaleTimeString('ru-RU', { 
                                                hour: '2-digit',
                                                minute: '2-digit'
                                              })}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-900 whitespace-pre-wrap">{message.message}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Recent Results - Only show on Management tab */}
        {activeTab === 'manage' && results.length > 0 && (
          <div className="mt-12">
            <h3 className="text-gray-900 mb-4">Последние результаты</h3>
            <div className="space-y-4">
              {results.slice(0, 5).map((result) => {
                const session = sessions.find(s => s.id === result.sessionId);
                return (
                  <div key={result.id} className="bg-white rounded-xl p-6 border border-gray-200">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-gray-900">{session?.params.topic}</p>
                        <p className="text-sm text-gray-600">
                          {result.studentName || 'Незарегистрированный ученик'}
                        </p>
                      </div>
                      {result.score && (
                        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                          <span className="text-xl">{result.score}</span>
                          <span className="text-sm">/100</span>
                        </div>
                      )}
                    </div>
                    {result.summary && (
                      <p className="text-sm text-gray-600 mb-3">{result.summary}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Завершено {new Date(result.completedAt || result.startedAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}