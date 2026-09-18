import { revalidatePath } from 'next/cache'

/**
 * Cached public surfaces that show an event: the map, its detail page and the
 * city landing pages, which are prerendered.
 */
export function revalidatePublic(slug: string): void {
  revalidatePath('/')
  revalidatePath(`/hackathon/${slug}`)
  revalidatePath('/hackathony/[city]', 'page')
  revalidatePath('/sitemap.xml')
  revalidatePath('/admin')
}
