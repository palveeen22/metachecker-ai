'use client'

import { Button } from "@/shared/ui"
import { Check, Copy } from "lucide-react"
import { useState } from "react"

export function CopyButton({
  content,
  className = '',
}: {
  content: string | null | undefined
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  if (!content) return null

  const copy = () => {
    navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      className={`h-6 w-6 hover:bg-accent hover:text-accent-foreground ${className}`}
      onClick={copy}
    >
      {copied ? <Check className='h-3 w-3' /> : <Copy className='h-3 w-3' />}
      <span className='sr-only'>Copy</span>
    </Button>
  )
}