import React from "react"

function Card({ className = "", children, variant = "default", ...props }) {
  const baseClasses = variant === "question" 
    ? "question-card" 
    : "retro-card";
    
  return (
    <div
      className={`${baseClasses} text-card-foreground smooth-transition ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

function CardHeader({ className = "", children, ...props }) {
  return (
    <div
      className={`flex flex-col space-y-3 p-6 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

function CardTitle({ className = "", children, ...props }) {
  return (
    <h3
      className={`text-2xl font-semibold leading-tight tracking-tight text-card-foreground/90 ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

function CardDescription({ className = "", children, ...props }) {
  return (
    <p
      className={`text-sm text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </p>
  )
}

function CardContent({ className = "", children, ...props }) {
  return (
    <div className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

function CardFooter({ className = "", children, ...props }) {
  return (
    <div
      className={`flex items-center p-6 pt-0 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } 