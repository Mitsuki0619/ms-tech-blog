import { Form, Link } from '@remix-run/react'

import { UserForClient } from '~/routes/_index'

import { Button } from './ui/button'

interface Props {
  user: UserForClient | null
}

export const Header = ({ user }: Props) => {
  return (
    <header>
      <h1>ms tech blog</h1>
      <nav>
        <Link to="/">Home</Link>
        {user ? (
          <>
            <Link to="/posts/create">New Post</Link>
            <Form method="post" action="/signout">
              <Button variant="outline">Sign out</Button>
            </Form>
          </>
        ) : (
          <Button variant="secondary" asChild>
            <Link to="/signin">Sign in</Link>
          </Button>
        )}
      </nav>
    </header>
  )
}
