import { useState } from 'react';
import { Plus, Link as LinkIcon, Calendar, Clock, Target, Copy, Check, BarChart3, Users, MessageSquare, Video, BookOpen, Brain, ListChecks, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Session, SessionParams, User } from '@/types';
import { createSession } from '@/lib/sessionApi';
import { getResultsByOrganizerId } from '@/lib/mockData';

interface Props {
  user: User;
  sessions: Session[];
  onRefresh: () => void;
  onOpenSession: (sessionId: string) => void;
}

export function OrganizerDashboard({ user, sessions, onRefresh, onOpenSession }: Props) {
  const [activeTab, setActiveTab] = useState<'manage' | 'sessions' | 'students'>('manage');
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  const userSessions = sessions.filter(s => s.organizerId === user.id);
  const results = getResultsByOrganizerId(user.id);

  const handleCreateSession = async () => {
    try {
      await createSession(formData);
      
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
      
      await onRefresh();
      alert('Сессия успешно создана!');
    } catch (error) {
      console.error('Failed to create session:', error);
      alert((error as Error).message || 'Ошибка создания сессии');
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-gray-600">Всего сессий</p>
            </div>
            <p className="text-3xl text-gray-900">{userSessions.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-gray-600">Учеников прошло</p>
            </div>
            <p className="text-3xl text-gray-900">{results.length}</p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-gray-600">Средний балл</p>
            </div>
            <p className="text-3xl text-gray-900">
              {results.length > 0 
                ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length)
                : 0}
            </p>
          </div>
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-gray-900 mb-1">
              {activeTab === 'manage' 
                ? 'Управление сессиями' 
                : activeTab === 'sessions'
                ? 'Мои разговоры с роботом'
                : 'Статистика учеников'}
            </h2>
            <p className="text-gray-600">
              {activeTab === 'manage' 
                ? 'Создавайте и управляйте учебными сессиями' 
                : activeTab === 'sessions'
                ? 'Протестируйте и пообщайтесь с AI-тьютором'
                : 'Детальная статистика по всем ученикам'}
            </p>
          </div>
          {activeTab === 'manage' && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Создать сессию</span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-lg border border-gray-200 inline-flex">
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Управление</span>
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'sessions'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Сессии с роботом</span>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Статистика</span>
          </button>
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <h3 className="text-gray-900 mb-6">Создать новую сессию</h3>
              
              <div className="space-y-4">
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Уровень сложности</label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="beginner">Начальный</option>
                      <option value="intermediate">Средний</option>
                      <option value="advanced">Продвинутый</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Длительность (мин)</label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      min="15"
                      step="15"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Язык</label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData({ ...formData, language: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="ru">Русский</option>
                      <option value="en">English</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Характер AI</label>
                    <select
                      value={formData.personality}
                      onChange={(e) => setFormData({ ...formData, personality: e.target.value as any })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="friendly">Дружелюбный</option>
                      <option value="professional">Профессиональный</option>
                      <option value="motivating">Мотивирующий</option>
                    </select>
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
                      <label className="block text-sm text-gray-700 mb-2">Стиль взаимодействия</label>
                      <select
                        value={formData.interactionStyle || 'mixed'}
                        onChange={(e) => setFormData({ ...formData, interactionStyle: e.target.value as any })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      >
                        <option value="questions">Вопросы и ответы</option>
                        <option value="practice">Практические задания</option>
                        <option value="theory">Теоретический материал</option>
                        <option value="mixed">Смешанный стиль</option>
                      </select>
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
                  <div key={session.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-gray-900 mb-2">{session.params.topic}</h3>
                        <div className="flex flex-wrap gap-2 mb-3">
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
                        {session.params.goals.length > 0 && (
                          <div className="text-sm text-gray-600">
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

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <LinkIcon className="w-4 h-4 text-gray-600" />
                      <code className="flex-1 text-sm text-gray-700 truncate">
                        {window.location.origin}{session.shareUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(session.id, session.shareUrl)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        {copiedId === session.id ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Скопировано</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Копировать</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Создана {new Date(session.createdAt).toLocaleDateString('ru-RU')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>
                          {results.filter(r => r.sessionId === session.id).length} учеников
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
              {results.length === 0 ? (
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
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Table Header */}
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

                  {/* Table Body */}
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
                                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="w-4 h-4" />
                                    <span className="text-sm">Скрыть транскрипцию</span>
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-4 h-4" />
                                    <span className="text-sm">Показать транскрипцию ({result.transcript.length} сообщений)</span>
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