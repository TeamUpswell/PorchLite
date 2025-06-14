import React from 'react';

// Input component for form inputs
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      />
    );
  }
);

// Display a name for the component in React DevTools
Input.displayName = 'Input';

export default Input;