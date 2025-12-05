import { User } from '@/types';
import { LogOut, User as UserIcon } from 'lucide-react';
import { LogoSimple } from './LogoSimple';

interface Props {
  user: User | null;
  onLogout: () => void;
}

export function Header({ user, onLogout }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <LogoSimple size="sm" showText={true} />

          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <UserIcon className="w-4 h-4 text-gray-600" />
                <div className="text-sm">
                  <p className="text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'organizer' ? 'Организатор' : 'Ученик'}
                  </p>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Выйти"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}