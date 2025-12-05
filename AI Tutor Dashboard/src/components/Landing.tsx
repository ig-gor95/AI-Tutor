import { ArrowRight, Sparkles, Users, Target, Shield, Code, Languages, Music, Briefcase, GraduationCap, Palette } from 'lucide-react';
import { AIAvatar } from './AIAvatar';
import { LogoSimple } from './LogoSimple';
import { useState } from 'react';

interface Props {
  onNavigate: (view: 'login-organizer' | 'login-student') => void;
}

export function Landing({ onNavigate }: Props) {
  const [demoListening, setDemoListening] = useState(false);
  const [demoSpeaking, setDemoSpeaking] = useState(false);

  const handleDemoInteraction = () => {
    // Демо: говорим -> слушаем -> готов
    setDemoSpeaking(true);
    const timeout1 = setTimeout(() => {
      setDemoSpeaking(false);
      setDemoListening(true);
    }, 3000);
    const timeout2 = setTimeout(() => {
      setDemoListening(false);
    }, 6000);
    
    // Возвращаем функцию очистки
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Navigation Header with Logo */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <LogoSimple size="md" showText={true} />

            {/* Quick Actions */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => onNavigate('login-student')}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Для учеников
              </button>
              <button
                onClick={() => onNavigate('login-organizer')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all text-sm"
              >
                Для организаторов
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          {/* Large Hero Logo */}
          <div className="flex justify-center mb-8">
            <LogoSimple size="lg" showText={false} />
          </div>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full mb-8">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-700">AI-тьютор нового поколения</span>
          </div>
          
          <h1 className="text-gray-900 mb-6">
            BigBrother
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
            Персонализированное обучение любым навыкам с голосовым AI-ассистентом. 
            Создавайте уроки по любым дисциплинам, делитесь ими и отслеживайте прогресс учеников.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button
              onClick={() => onNavigate('login-organizer')}
              className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              <span>Войти как организатор</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <button
              onClick={() => onNavigate('login-student')}
              className="px-8 py-4 bg-white text-gray-900 rounded-xl hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 border-2 border-gray-200"
            >
              <Target className="w-5 h-5 text-blue-600" />
              <span>Войти как ученик</span>
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-gray-900 mb-3">Для организаторов</h3>
            <p className="text-gray-600">
              Создавайте персонализированные учебные сессии, задавайте параметры обучения 
              и получайте детальные отчёты о прогрессе каждого ученика
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-gray-900 mb-3">Для учеников</h3>
            <p className="text-gray-600">
              Учитесь в своём темпе с AI-ассистентом, который адаптируется под ваш уровень. 
              Сохраняйте прогресс и отслеживайте достижения
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-gray-900 mb-3">AI с характером</h3>
            <p className="text-gray-600">
              Голосовой ассистент с визуальным образом робота ведёт диалог как живой собеседник. 
              Настраивайте его личность под задачи обучения
            </p>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-gray-900 mb-4">Применение в любой сфере</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              BigBrother адаптируется под любую область знаний — от технических навыков до творческих дисциплин
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Code className="w-5 h-5 text-blue-600" />
                </div>
                <h4 className="text-gray-900">IT и Программирование</h4>
              </div>
              <p className="text-sm text-gray-600">
                React, Python, SQL, алгоритмы, архитектура
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Languages className="w-5 h-5 text-purple-600" />
                </div>
                <h4 className="text-gray-900">Иностранные языки</h4>
              </div>
              <p className="text-sm text-gray-600">
                Английский, испанский, китайский, практика диалогов
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-pink-600" />
                </div>
                <h4 className="text-gray-900">Бизнес и Маркетинг</h4>
              </div>
              <p className="text-sm text-gray-600">
                Управление проектами, продажи, аналитика, стратегия
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-green-600" />
                </div>
                <h4 className="text-gray-900">Академические дисциплины</h4>
              </div>
              <p className="text-sm text-gray-600">
                Математика, физика, биология, история, литература
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Palette className="w-5 h-5 text-orange-600" />
                </div>
                <h4 className="text-gray-900">Творчество и Искусство</h4>
              </div>
              <p className="text-sm text-gray-600">
                Дизайн, фотография, живопись, теория искусства
              </p>
            </div>

            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="text-gray-900">Музыка и Медиа</h4>
              </div>
              <p className="text-sm text-gray-600">
                Теория музыки, композиция, монтаж видео
              </p>
            </div>
          </div>
        </div>

        {/* Demo Preview */}
        <div className="mt-20 bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden border border-gray-200">
          <div className="text-center py-6 border-b border-gray-200">
            <h3 className="text-gray-900 mb-2">Познакомьтесь с AI-тьютором</h3>
            <p className="text-sm text-gray-600">Нажмите на робота, чтобы увидеть его в действии</p>
          </div>
          <div 
            className="aspect-video relative cursor-pointer group"
            onClick={handleDemoInteraction}
          >
            <AIAvatar isListening={demoListening} isSpeaking={demoSpeaking} />
            {!demoSpeaking && !demoListening && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/5 transition-colors">
                <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="px-6 py-3 bg-white/90 backdrop-blur rounded-full shadow-lg">
                    <span className="text-gray-700">👆 Нажмите для демонстрации</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200">
            <Shield className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">
              Безопасное обучение без сбора персональных данных
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}