'use client'

import { Button } from "@/shared/ui"
import { Check, Copy } from "lucide-react"
import { useState } from "react"

export function CopyAllButton({
  data,
  title,
}: {
  data: Record<string, string | null | undefined>
  title: string
}) {
  const [copied, setCopied] = useState(false)

  const nonEmptyEntries = Object.entries(data).filter(([, value]) => value)
  if (nonEmptyEntries.length === 0) return null

  const copy = () => {
    const jsonData = {
      title,
      data: Object.fromEntries(nonEmptyEntries),
    }

    navigator.clipboard.writeText(JSON.stringify(jsonData, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant='outline'
      size='sm'
      className='ml-auto flex items-center gap-2'
      onClick={copy}
    >
      {copied ? (
        <>
          <Check className='h-3 w-3' />
          Copied!
        </>
      ) : (
        <>
          <Copy className='h-3 w-3' />
          Copy JSON
        </>
      )}
    </Button>
  )
}