import { ArrowRight, Sparkles, Target, Brain, Zap, MessageSquare, Video, TrendingUp, CheckCircle, Users, Settings } from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import { Logo, LogoIcon } from './Logo';
import { useState } from 'react';

interface Props {
  onNavigate: (view: 'login-organizer' | 'login-student') => void;
}

export function Landing({ onNavigate }: Props) {
  const [demoListening, setDemoListening] = useState(false);
  const [demoSpeaking, setDemoSpeaking] = useState(false);

  const handleDemoInteraction = () => {
    setDemoSpeaking(true);
    setTimeout(() => {
      setDemoSpeaking(false);
      setDemoListening(true);
    }, 2000);
    setTimeout(() => {
      setDemoListening(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <Logo size={48} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">BigBrother</h1>
                <p className="text-xs text-gray-500">Голосовой AI-тренинг</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('login-student')}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Войти как ученик
              </button>
              <button
                onClick={() => onNavigate('login-organizer')}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300"
              >
                Для организаторов
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 lg:px-8 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6 border border-blue-100">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">Powered by AI</span>
              </div>

              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Ваш личный
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  голосовой наставник
                </span>
              </h1>

              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Персонализированные тренинги с голосовым взаимодействием. 
                Настраивайте роли, получайте аналитику, учитесь в любой сфере.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={() => onNavigate('login-organizer')}
                  className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-2xl hover:shadow-purple-500/40 transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <span className="font-medium">Создать сессию</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={handleDemoInteraction}
                  className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-900 rounded-xl hover:border-gray-300 hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-3"
                >
                  <Video className="w-5 h-5" />
                  <span className="font-medium">Демо</span>
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-8">
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">1000+</div>
                  <div className="text-sm text-gray-600">Навыков</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">24/7</div>
                  <div className="text-sm text-gray-600">На связи</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-gray-900 mb-1">100%</div>
                  <div className="text-sm text-gray-600">Персонализация</div>
                </div>
              </div>
            </div>

            {/* Right Content - AI Avatar Demo */}
            <div className="relative">
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 border border-gray-200 shadow-2xl">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-60" />
                <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl blur-2xl opacity-60" />
                
                <div className="relative h-96 flex items-center justify-center">
                  <AIAvatar isListening={demoListening} isSpeaking={demoSpeaking} />
                </div>

                <div className="mt-6 flex items-center justify-center gap-3">
                  <div className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    demoSpeaking 
                      ? 'bg-green-500 text-white' 
                      : demoListening 
                      ? 'bg-blue-500 text-white animate-pulse' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {demoSpeaking ? 'Говорит' : demoListening ? 'Слушает' : 'Готов'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Ключевые возможности
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Всё необходимое для эффективного обучения
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Video className="w-6 h-6" />,
                title: 'Голосовое взаимодействие',
                description: 'Разговор как с живым наставником — голосом, в реальном времени',
                color: 'from-blue-500 to-cyan-500'
              },
              {
                icon: <Brain className="w-6 h-6" />,
                title: 'Умная адаптация',
                description: 'Автоматическая подстройка под уровень и темп каждого ученика',
                color: 'from-purple-500 to-pink-500'
              },
              {
                icon: <Target className="w-6 h-6" />,
                title: 'Гибкая настройка',
                description: 'Полный контроль параметров и критериев оценки',
                color: 'from-green-500 to-emerald-500'
              },
              {
                icon: <MessageSquare className="w-6 h-6" />,
                title: 'Текстовый чат',
                description: 'Полная история диалога и транскрипты сессий',
                color: 'from-orange-500 to-red-500'
              },
              {
                icon: <TrendingUp className="w-6 h-6" />,
                title: 'Детальная аналитика',
                description: 'Отчёты и метрики прогресса для каждого ученика',
                color: 'from-indigo-500 to-blue-500'
              },
              {
                icon: <Zap className="w-6 h-6" />,
                title: 'Быстрый старт',
                description: 'Создание сессии за 2 минуты, мгновенный доступ',
                color: 'from-pink-500 to-rose-500'
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative bg-white rounded-2xl p-8 border border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-20" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Готовы начать?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Создайте первую AI-сессию за 2 минуты
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate('login-organizer')}
              className="px-8 py-4 bg-white text-gray-900 rounded-xl hover:shadow-2xl transition-all duration-300 font-medium text-lg"
            >
              Для организаторов
            </button>
            <button
              onClick={() => onNavigate('login-student')}
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium text-lg"
            >
              Войти как ученик
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <LogoIcon size={40} />
              <div>
                <span className="text-white font-semibold block">BigBrother</span>
                <span className="text-sm text-gray-500">Голосовой AI-тренинг</span>
              </div>
            </div>

            <div className="flex gap-8 text-sm">
              <button onClick={() => onNavigate('login-organizer')} className="hover:text-white transition-colors">
                Для организаторов
              </button>
              <button onClick={() => onNavigate('login-student')} className="hover:text-white transition-colors">
                Для учеников
              </button>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            <p>&copy; 2024 BigBrother AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}