import { Bot, Sparkles } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function LogoSimple({ size = 'md', showText = true }: Props) {
  const sizes = {
    sm: { container: 'w-10 h-10', icon: 'w-6 h-6', sparkle: 'w-2 h-2', text: 'text-base' },
    md: { container: 'w-12 h-12', icon: 'w-7 h-7', sparkle: 'w-2.5 h-2.5', text: 'text-xl' },
    lg: { container: 'w-16 h-16', icon: 'w-10 h-10', sparkle: 'w-3 h-3', text: 'text-2xl' }
  };

  const currentSize = sizes[size];

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Logo Icon */}
      <div className="relative">
        <div className={`${currentSize.container} bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg transition-all hover:scale-105 hover:shadow-xl relative overflow-hidden`}>
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/0 via-white/20 to-purple-400/0 animate-pulse" />
          
          {/* Robot icon */}
          <Bot className={`${currentSize.icon} text-white relative z-10`} strokeWidth={2.5} />
          
          {/* Corner accent */}
          <div className="absolute top-1 right-1">
            <Sparkles className={`${currentSize.sparkle} text-yellow-300 animate-pulse`} />
          </div>
        </div>
        
        {/* Status indicator */}
        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm">
          <div className="w-full h-full bg-green-400 rounded-full animate-pulse" />
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/20 to-purple-500/20 blur-lg rounded-2xl scale-110 opacity-50" />
      </div>

      {/* Text */}
      {showText && (
        <div>
          <div className={`${currentSize.text} tracking-tight flex items-center gap-2`}>
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-semibold">
              BigBrother
            </span>
            <span className="px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs rounded-full shadow-sm">
              AI
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Персонализированное обучение с AI
          </p>
        </div>
      )}
    </div>
  );
}