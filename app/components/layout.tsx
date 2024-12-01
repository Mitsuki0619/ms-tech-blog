import { ReactNode } from 'react'

import { cn } from '~/lib/utils'
import { UserForClient } from '~/routes/_auth+/_layout'

import { Header } from './header'

export interface LayoutProps {
  children: ReactNode
  user: UserForClient | null
}

export const Layout = ({ children, user }: LayoutProps) => {
  return (
    <div
      className={cn('min-h-screen flex flex-col bg-gray-100 text-foreground')}
    >
      <Header user={user} />
      <div className="flex-1 flex">{children}</div>
    </div>
  )
}
