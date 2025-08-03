import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';

const AIButton = ({
  onClick,
  loading = false,
  disabled = false,
  children,
  variant = 'primary',
  size = 'md',
  icon: CustomIcon = null,
  className = '',
  ...props
}) => {
  const [localLoading, setLocalLoading] = useState(false);

  const isLoading = loading || localLoading;

  const handleClick = async (e) => {
    if (isLoading || disabled) return;

    setLocalLoading(true);
    try {
      await onClick(e);
    } finally {
      setLocalLoading(false);
    }
  };

  // Size variants
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Variant styles
  const variantClasses = {
    primary: 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border-purple-500/30 hover:bg-purple-500/30',
    secondary: 'bg-white/10 text-white border-white/20 hover:bg-white/20',
    ghost: 'bg-transparent text-purple-400 border-transparent hover:bg-purple-500/10'
  };

  const Icon = CustomIcon || Sparkles;

  return (
    <motion.button
      onClick={handleClick}
      disabled={isLoading || disabled}
      whileHover={{ scale: isLoading ? 1 : 1.02 }}
      whileTap={{ scale: isLoading ? 1 : 0.98 }}
      className={`
        flex items-center space-x-2 rounded-xl border transition-all duration-200
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-center space-x-2">
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        <span>{isLoading ? 'AI Working...' : children}</span>
      </div>
    </motion.button>
  );
};

export default AIButton; 