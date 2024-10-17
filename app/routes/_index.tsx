import { User } from '@prisma/client/edge'
import { json, LoaderFunctionArgs } from '@remix-run/cloudflare'
import { Outlet, useLoaderData } from '@remix-run/react'

import { Layout } from '~/components/layout'
import { getAuthenticator } from '~/services/auth/auth.server'

export type UserForClient = Pick<
  User,
  'email' | 'name' | 'id' | 'role' | 'image'
>

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const authenticator = getAuthenticator(context)
  const user = await authenticator.isAuthenticated(request)
  if (!user) {
    return null
  }
  const { email, name, id, role, image } = user
  return json({ email, name, id, role, image })
}

export default function App() {
  const user = useLoaderData<typeof loader>()
  return (
    <Layout user={user}>
      <Outlet />
    </Layout>
  )
}
