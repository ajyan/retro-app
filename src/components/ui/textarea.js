import React from "react"

function Textarea({ className, ...props }) {
  return (
    <textarea
      className={`retro-input flex min-h-[120px] w-full resize-none text-base placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
      {...props}
    />
  )
}

export { Textarea } 