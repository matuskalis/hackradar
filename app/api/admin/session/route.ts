import { isViewerAdmin } from '@/lib/auth/admin'

/**
 * Tells the header whether the current visitor may see the admin link. It
 * exists so the root layout does not have to read cookies: a layout that does
 * turns every public page dynamic and gives up the prerendered city pages.
 */
export async function GET() {
  return Response.json(
    { admin: await isViewerAdmin() },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
