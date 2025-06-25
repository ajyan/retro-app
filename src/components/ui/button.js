import React from "react"

function Button({ 
  className = "", 
  variant = "default", 
  size = "default", 
  isRecording = false,
  children,
  ...props 
}) {
  const variantStyles = {
    default: "retro-button",
    destructive: `retro-button ${isRecording ? 'recording-pulse' : ''}`,
    outline: "bg-card border-2 border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl px-6 py-3 font-medium smooth-transition shadow-md hover:shadow-lg hover:border-primary",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl px-6 py-3 font-medium smooth-transition shadow-md hover:shadow-lg",
    ghost: "hover:bg-accent/20 hover:text-accent-foreground rounded-xl px-4 py-2 smooth-transition",
    link: "text-primary underline-offset-4 hover:underline smooth-transition",
  }
  
  const sizeStyles = {
    default: "",
    sm: "px-4 py-2 text-sm",
    lg: "px-8 py-4 text-lg",
    icon: "w-12 h-12 rounded-full p-0",
  }
  
  const classes = `inline-flex items-center justify-center font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`
  
  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}

export { Button } 