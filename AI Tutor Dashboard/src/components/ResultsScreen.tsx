import { Award, TrendingUp, AlertCircle, Lightbulb, Download, Share2, ArrowLeft } from 'lucide-react';

interface Skill {
  name: string;
  score: number;
  max: number;
}

interface Error {
  title: string;
  description: string;
}

interface Results {
  score: number;
  skills: Skill[];
  errors: Error[];
  recommendations: string[];
  strengths: string[];
}

interface Props {
  results: Results;
  onBackToChat: () => void;
}

export function ResultsScreen({ results, onBackToChat }: Props) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Отлично';
    if (score >= 60) return 'Хорошо';
    return 'Нужно улучшить';
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBackToChat}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться к диалогу
        </button>
        <h1 className="text-gray-900 mb-2">Результаты сессии</h1>
        <p className="text-gray-600">Вот как вы справились с заданием</p>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-8 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 mb-2">Общая оценка</p>
            <div className="flex items-baseline gap-3">
              <span className="text-5xl">{results.score}</span>
              <span className="text-2xl text-blue-100">/ 100</span>
            </div>
            <p className="text-blue-100 mt-2">{getScoreLabel(results.score)}</p>
          </div>
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
            <Award className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Skills Breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          <h2 className="text-gray-900">Оценка навыков</h2>
        </div>
        <div className="space-y-4">
          {results.skills.map((skill, index) => (
            <div key={index}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-700">{skill.name}</span>
                <span className={getScoreColor(skill.score)}>
                  {skill.score} / {skill.max}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${(skill.score / skill.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Strengths */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-green-600" />
          <h2 className="text-gray-900">Сильные стороны</h2>
        </div>
        <ul className="space-y-2">
          {results.strengths.map((strength, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-green-600 mt-1">✓</span>
              <span>{strength}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Errors */}
      {results.errors.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h2 className="text-gray-900">Обнаруженные ошибки</h2>
          </div>
          <div className="space-y-4">
            {results.errors.map((error, index) => (
              <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-900 mb-1">{error.title}</p>
                <p className="text-amber-700 text-sm">{error.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-purple-600" />
          <h2 className="text-gray-900">Рекомендации</h2>
        </div>
        <ul className="space-y-3">
          {results.recommendations.map((rec, index) => (
            <li key={index} className="flex items-start gap-3 text-gray-700">
              <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center flex-shrink-0 text-sm">
                {index + 1}
              </span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBackToChat}
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Продолжить диалог
        </button>
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
          <Download className="w-4 h-4" />
          Скачать отчёт
        </button>
        <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          Поделиться
        </button>
      </div>
    </div>
  );
}