import { Suspense } from "react"
import { MetadataPage } from "@/pages/metadata-page"

export default function Page() {
  return (
    <Suspense>
      <MetadataPage />
    </Suspense>
  )
}