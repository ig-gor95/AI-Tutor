import { Provider } from 'jotai';
import { store } from '../lib/jotai';

interface JotaiProviderProps {
  children: React.ReactNode;
}

export function JotaiProvider({ children }: JotaiProviderProps) {
  return <Provider store={store}>{children}</Provider>;
}
