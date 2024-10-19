import { ReactNode } from 'react'

import { UserForClient } from '~/routes/_public+/_layout'

import { Header } from './header'

export interface LayoutProps {
  children: ReactNode
  user: UserForClient | null
}

export const Layout = ({ children, user }: LayoutProps) => {
  return (
    <div>
      <Header user={user} />
      {children}
    </div>
  )
}
