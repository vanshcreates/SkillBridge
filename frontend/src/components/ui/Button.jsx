// Button.jsx
import React from 'react';

export const Button = ({ 
  children, 
  type = 'button', 
  onClick, 
  className = '', 
  href,
  ...props 
}) => {
  const styles = `inline-flex items-center justify-center px-4 py-2 bg-secondary text-white rounded hover:bg-secondary-hover transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 ${className}`

  if (href) {
    return (
      <a href={href} className={styles} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={styles}
      {...props}
    >
      {children}
    </button>
  );
};
