import { Menu, Bell, User } from 'lucide-react'
import { useUIStore } from '@/app/store'
import { Button } from '@/components/ui/Button'

export function Topbar() {
  const { toggleSidebar } = useUIStore()

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="ml-2 text-xl font-semibold text-gray-900">
            QueryBridge
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
