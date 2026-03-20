// src/components/common/Button.jsx
import React from 'react';

const Button = ({ children, variant = 'coral', icon = null, ...props }) => {
  const baseClasses = "px-6 py-3 rounded-full font-medium transition duration-150 ease-in-out flex items-center justify-center gap-2 text-sm whitespace-nowrap";
  
  const variantClasses = {
    coral: "bg-orange-500 text-white hover:bg-orange-600 shadow-sm",
    "coral-light": "bg-orange-50 text-orange-600 hover:bg-orange-100",
    "white-solid": "bg-white text-orange-600 hover:bg-slate-50 shadow-sm",
    "outline": "border border-slate-300 text-slate-700 hover:bg-slate-50",
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {icon}
      {children}
    </button>
  );
};

export default Button;