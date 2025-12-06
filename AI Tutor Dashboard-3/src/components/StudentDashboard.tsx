import { User, SessionResult } from '@/types';
import { Calendar, Clock, BarChart3, Award, TrendingUp, Video } from 'lucide-react';
import { getResultsByStudentId, getSessions } from '@/lib/mockData';

interface Props {
  user: User;
  onOpenSession: (sessionId: string) => void;
}

export function StudentDashboard({ user, onOpenSession }: Props) {
  const results = getResultsByStudentId(user.id);
  const sessions = getSessions();

  const averageScore = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.score || 0), 0) / results.length)
    : 0;

  const totalMinutes = results.reduce((acc, r) => {
    if (r.startedAt && r.completedAt) {
      const duration = new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime();
      return acc + Math.round(duration / 60000);
    }
    return acc;
  }, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Пройдено</p>
            </div>
            <p className="text-xl sm:text-3xl text-gray-900">{results.length}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Ср. балл</p>
            </div>
            <p className="text-xl sm:text-3xl text-gray-900">{averageScore}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Минут</p>
            </div>
            <p className="text-xl sm:text-3xl text-gray-900">{totalMinutes}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <p className="text-xs sm:text-sm text-gray-600">Прогресс</p>
            </div>
            <p className="text-xl sm:text-3xl text-gray-900">+{Math.min(results.length * 5, 100)}%</p>
          </div>
        </div>

        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl text-gray-900 mb-1">Доступные сессии с AI-роботом</h2>
          <p className="text-sm sm:text-base text-gray-600">Выберите сессию для общения с AI-тьютором</p>
        </div>

        {/* Available Sessions */}
        <div className="space-y-4 mb-8 sm:mb-12">
          {sessions.length === 0 ? (
            <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Video className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base text-gray-600 mb-2">Нет доступных сессий</p>
              <p className="text-xs sm:text-sm text-gray-500">
                Попросите организатора создать сессию для вас
              </p>
            </div>
          ) : (
            sessions.slice(0, 5).map((session) => (
              <div key={session.id} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start gap-3 sm:gap-6">
                  <div className="w-12 h-12 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl sm:text-4xl">🤖</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-lg text-gray-900 mb-2 truncate">{session.params.topic}</h3>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm">
                        {session.params.difficulty === 'beginner' ? 'Начальный' : 
                         session.params.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                      </span>
                      <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        {session.params.duration} мин
                      </span>
                      <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs sm:text-sm truncate max-w-[120px]">
                        {session.organizerName}
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenSession(session.id)}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 text-xs sm:text-sm"
                    >
                      <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Начать разговор с роботом</span>
                      <span className="sm:hidden">Начать</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Completed Sessions Header */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg sm:text-2xl text-gray-900 mb-1">История завершённых сессий</h2>
          <p className="text-sm sm:text-base text-gray-600">Ваши результаты и достижения</p>
        </div>

        {/* Results List */}
        <div className="space-y-4">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl p-8 sm:p-12 border border-gray-200 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
              </div>
              <p className="text-sm sm:text-base text-gray-900 mb-2">Пока нет завершённых сессий</p>
              <p className="text-xs sm:text-sm text-gray-600 mb-6">
                Начните обучение, получив ссылку от организатора
              </p>
            </div>
          ) : (
            results.map((result) => {
              const session = sessions.find(s => s.id === result.sessionId);
              return (
                <div key={result.id} className="bg-white rounded-xl p-4 sm:p-6 border border-gray-200 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-0 mb-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg text-gray-900 mb-2">
                        {session?.params.topic || 'Учебная сессия'}
                      </h3>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
                        {session && (
                          <>
                            <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm">
                              {session.params.difficulty === 'beginner' ? 'Начальный' : 
                               session.params.difficulty === 'intermediate' ? 'Средний' : 'Продвинутый'}
                            </span>
                            <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs sm:text-sm">
                              {session.organizerName}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {result.score && (
                      <div className="px-3 sm:px-4 py-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg text-center self-start">
                        <p className="text-xl sm:text-2xl text-green-700">{result.score}</p>
                        <p className="text-[10px] sm:text-xs text-green-600">баллов</p>
                      </div>
                    )}
                  </div>

                  {result.summary && (
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg mb-4">
                      <p className="text-xs sm:text-sm text-blue-900">{result.summary}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(result.startedAt).toLocaleDateString('ru-RU')}</span>
                    </div>
                    {result.completedAt && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {Math.round((new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()) / 60000)} мин
                        </span>
                      </div>
                    )}
                  </div>

                  {result.transcript.length > 0 && (
                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                        Показать диалог ({result.transcript.length} сообщений)
                      </summary>
                      <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                        {result.transcript.map((msg, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-lg ${
                              msg.role === 'ai'
                                ? 'bg-blue-50 text-blue-900'
                                : 'bg-gray-50 text-gray-900'
                            }`}
                          >
                            <p className="text-xs text-gray-600 mb-1">
                              {msg.role === 'ai' ? '🤖 AI-тьютор' : '👤 Вы'}
                            </p>
                            <p className="text-sm">{msg.message}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Progress Chart Placeholder */}
        {results.length > 0 && (
          <div className="mt-12 bg-white rounded-xl p-8 border border-gray-200">
            <h3 className="text-gray-900 mb-4">Динамика прогресса</h3>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">График прогресса</p>
                <p className="text-sm text-gray-500">Отслеживайте свои достижения</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}