import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const ThemeToggle = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${
        isDark
          ? 'bg-slate-800 border-slate-700 text-teal-400 hover:bg-slate-700 hover:text-teal-300 shadow-sm'
          : 'bg-white/90 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm'
      } ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-200 -rotate-12 hover:rotate-0" />
      )}
    </button>
  );
};

export default ThemeToggle;
