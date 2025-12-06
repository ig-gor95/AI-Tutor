import { useState } from 'react';
import { Users, TrendingUp, Award, Calendar, Search, Filter, Download, ExternalLink, X } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  email: string;
  lastSession: string;
  totalSessions: number;
  avgScore: number;
  latestScore: number;
  topics: string[];
  status: 'excellent' | 'good' | 'needs-improvement';
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Анна Иванова',
    email: 'anna.ivanova@example.com',
    lastSession: '2025-11-30',
    totalSessions: 12,
    avgScore: 88,
    latestScore: 92,
    topics: ['SQL Basics', 'Analytics Case', 'SQL Advanced'],
    status: 'excellent'
  },
  {
    id: '2',
    name: 'Дмитрий Петров',
    email: 'dmitry.petrov@example.com',
    lastSession: '2025-11-29',
    totalSessions: 8,
    avgScore: 75,
    latestScore: 78,
    topics: ['SQL Basics', 'Analytics Case'],
    status: 'good'
  },
  {
    id: '3',
    name: 'Елена Сидорова',
    email: 'elena.sidorova@example.com',
    lastSession: '2025-11-28',
    totalSessions: 15,
    avgScore: 91,
    latestScore: 95,
    topics: ['SQL Basics', 'SQL Advanced', 'Data Thinking', 'Analytics Case'],
    status: 'excellent'
  },
  {
    id: '4',
    name: 'Михаил Козлов',
    email: 'mikhail.kozlov@example.com',
    lastSession: '2025-11-27',
    totalSessions: 5,
    avgScore: 62,
    latestScore: 65,
    topics: ['SQL Basics'],
    status: 'needs-improvement'
  },
  {
    id: '5',
    name: 'Ольга Новикова',
    email: 'olga.novikova@example.com',
    lastSession: '2025-11-30',
    totalSessions: 10,
    avgScore: 84,
    latestScore: 87,
    topics: ['SQL Basics', 'SQL Advanced', 'Analytics Case'],
    status: 'excellent'
  }
];

export function SchoolDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-700';
      case 'good':
        return 'bg-blue-100 text-blue-700';
      case 'needs-improvement':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'Отлично';
      case 'good':
        return 'Хорошо';
      case 'needs-improvement':
        return 'Требует внимания';
      default:
        return '';
    }
  };

  const filteredStudents = mockStudents.filter(
    (student) =>
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStudents = mockStudents.length;
  const avgScore = Math.round(mockStudents.reduce((acc, s) => acc + s.avgScore, 0) / totalStudents);
  const totalSessions = mockStudents.reduce((acc, s) => acc + s.totalSessions, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Личный кабинет школы</h1>
        <p className="text-gray-600">Отслеживайте прогресс студентов и результаты тренировок</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Всего студентов</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl text-gray-900">{totalStudents}</p>
          <p className="text-sm text-gray-500 mt-1">Активных пользователей</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Средний балл</span>
            <Award className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl text-gray-900">{avgScore}</p>
          <p className="text-sm text-gray-500 mt-1">Из 100 возможных</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-600">Всего сессий</span>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-3xl text-gray-900">{totalSessions}</p>
          <p className="text-sm text-gray-500 mt-1">Завершённых тренировок</p>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl border border-gray-200">
        {/* Table Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-gray-900">Студенты</h2>
            <div className="flex gap-2">
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Фильтры
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
                <Download className="w-4 h-4" />
                Экспорт
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Поиск по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Студент
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Последняя сессия
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Сессий
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Средний балл
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Последний балл
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {new Date(student.lastSession).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">{student.totalSessions}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900">{student.avgScore}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${student.avgScore}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-900">{student.latestScore}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(student.status)}`}>
                      {getStatusLabel(student.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      Подробнее
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 z-10"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between pr-12">
                <div>
                  <h2 className="text-gray-900 mb-1">{selectedStudent.name}</h2>
                  <p className="text-gray-600">{selectedStudent.email}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Всего сессий</p>
                  <p className="text-2xl text-gray-900">{selectedStudent.totalSessions}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Средний балл</p>
                  <p className="text-2xl text-gray-900">{selectedStudent.avgScore}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-gray-900 mb-3">Пройденные темы</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedStudent.topics.map((topic, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-gray-900 mb-3">Прогресс по навыкам</h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">SQL-логика</span>
                      <span className="text-sm text-gray-900">85/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Аналитическое мышление</span>
                      <span className="text-sm text-gray-900">78/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '78%' }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-600">Структура ответа</span>
                      <span className="text-sm text-gray-900">92/100</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }} />
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}