'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { Skeleton } from '@/shared/ui'
import { MetadataForm, useMetadataQuery } from '@/features/check-metadata'
import { MetadataDashboard } from '@/widgets/metadata-dashboard'

export function MetadataPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const checkedUrl = searchParams?.get('url') ?? ''

  const { data, isLoading, error } = useMetadataQuery(checkedUrl)

  function handleSubmit(url: string) {
    router.push(`?url=${encodeURIComponent(url)}`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-bold tracking-tight">MetaChecker</h1>
          <p className="mt-2 text-muted-foreground text-base">
            {/* Analyze metadata, Open Graph, Twitter Cards, and more from any URL */}
            Analyze metadata, Open Graph, Twitter Cards, and more from any URL.
            Get a complete overview of how your website is represented on
            social media and search engines. Preview link cards, detect missing or invalid tags,
            and ensure your content looks perfect everywhere it’s shared.
          </p>
        </header>

        <div className="mb-8">
          <MetadataForm
            defaultUrl={checkedUrl}
            isPending={isLoading}
            onSubmit={handleSubmit}
            errorMessage={error?.message}
          />
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        )}

        {data && !isLoading && <MetadataDashboard metadata={data} />}
      </div>
    </div>
  )
}
