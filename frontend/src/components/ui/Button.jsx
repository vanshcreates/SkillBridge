import React from 'react'

export const Button = ({
  children,
  type = 'button',
  onClick,
  className = '',
  href,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer select-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2'

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5 shadow-sm',
  }[size] || 'text-sm px-4 py-2.5 rounded-xl gap-2'

  const variantStyles = {
    primary:
      'bg-secondary text-white hover:bg-secondary-hover shadow-sm hover:shadow-card active:shadow-none',
    secondary:
      'bg-primary text-white hover:bg-primary-hover shadow-sm hover:shadow-card',
    outline:
      'border border-border bg-transparent text-text-main hover:bg-surface-muted hover:border-border-strong',
    glass:
      'border border-white/20 bg-white/10 text-white hover:bg-white/20 backdrop-blur-md',
    accent:
      'bg-accent text-primary font-bold hover:bg-accent-light shadow-sm hover:shadow-card',
  }[variant] || 'bg-secondary text-white hover:bg-secondary-hover'

  const combinedStyles = `${baseStyles} ${sizeStyles} ${variantStyles} ${className}`

  if (href) {
    return (
      <a className={combinedStyles} href={href} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button
      className={combinedStyles}
      disabled={disabled}
      onClick={onClick}
      type={type}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
