import { forwardRef, useState } from 'react'
import { cn } from '../../lib/utils'
import { Eye, EyeOff } from 'lucide-react'

const Input = forwardRef(({ 
  className, 
  type,
  label,
  error,
  helperText,
  icon: Icon,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [focused, setFocused] = useState(false)
  
  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground block flex items-center">
          {label}
          {props.required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground-muted group-hover:text-foreground-secondary transition-colors h-5 w-5" />
        )}
        <input
          type={inputType}
          className={cn(
            "flex h-12 w-full rounded-xl glass border border-border bg-background-secondary/50 px-4 py-3 text-sm text-foreground transition-all duration-300",
            "placeholder:text-foreground-muted",
            "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-background-secondary focus:shadow-glow",
            "hover:border-border-light hover:bg-background-secondary/70",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-red-500 focus:ring-red-500 bg-red-500/5",
            Icon && "pl-12",
            isPassword && "pr-12",
            focused && !error && "border-primary-600 shadow-glow-lg",
            className
          )}
          ref={ref}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-foreground-muted hover:text-foreground-secondary transition-colors group"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5 group-hover:scale-110 transition-transform" />
            ) : (
              <Eye className="h-5 w-5 group-hover:scale-110 transition-transform" />
            )}
          </button>
        )}
        
        {/* Focus glow effect */}
        {focused && !error && (
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary-600/20 to-purple-600/20 blur-xl -z-10 animate-pulse" />
        )}
      </div>
      {error && (
        <div className="flex items-center space-x-2 animate-slide-up">
          <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}
      {helperText && !error && (
        <p className="text-sm text-foreground-muted flex items-center space-x-2">
          <div className="w-1 h-1 bg-foreground-muted rounded-full" />
          <span>{helperText}</span>
        </p>
      )}
    </div>
  )
})

Input.displayName = "Input"

export { Input } 