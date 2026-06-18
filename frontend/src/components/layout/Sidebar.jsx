import { Brand } from './Brand'
import { NavList } from './NavList'
import { UserMenu } from './UserMenu'

/** Sidebar fija para md+ (PLAN §5.3). */
export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:border-r md:border-border md:bg-card">
      <div className="flex h-16 items-center px-6">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <NavList />
      </div>
      <div className="border-t border-border p-3">
        <UserMenu />
      </div>
    </aside>
  )
}
