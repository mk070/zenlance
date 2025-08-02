import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const Button = forwardRef(({ 
  className, 
  variant = "default", 
  size = "default", 
  loading = false,
  children, 
  ...props 
}, ref) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group"
  
  const variants = {
    default: "btn-premium shadow-glow hover:shadow-glow-lg transform hover:scale-105 active:scale-95",
    secondary: "glass hover:bg-glass-light text-foreground hover:shadow-premium border border-border hover:border-border-light",
    outline: "border border-primary-600 bg-transparent hover:bg-primary-600 text-primary-400 hover:text-white hover:shadow-glow transition-all duration-300",
    ghost: "hover:bg-glass text-foreground-secondary hover:text-foreground transition-all duration-300",
    destructive: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-red-500/25 hover:shadow-red-500/40",
    premium: "bg-gradient-to-r from-primary-600 via-purple-600 to-primary-700 hover:from-primary-700 hover:via-purple-700 hover:to-primary-800 text-white shadow-glow hover:shadow-glow-lg transform hover:scale-105 hover:rotate-1 transition-all duration-300",
    glass: "btn-glass backdrop-blur-xl bg-glass border border-border hover:bg-glass-light hover:border-border-light"
  }
  
  const sizes = {
    default: "h-11 px-6 py-3",
    sm: "h-9 rounded-lg px-4 text-sm",
    lg: "h-12 rounded-xl px-8 text-lg",
    xl: "h-14 rounded-2xl px-10 text-xl",
    icon: "h-11 w-11"
  }

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        loading && "cursor-not-allowed opacity-70",
        className
      )}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    >
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      
      {loading && (
        <div className="mr-2 flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
        </div>
      )}
      {children}
    </button>
  )
})

Button.displayName = "Button"

export { Button } 