import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '../components/AuthLayout'

export function ResetPassword() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder logic
    console.log('Reset password submitted')
  }

  return (
    <AuthLayout
      title="Set new password"
      subtitle="Enter your new password below"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            New password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1"
            placeholder="Enter your new password"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm new password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="mt-1"
            placeholder="Confirm your new password"
          />
        </div>

        <div>
          <Button type="submit" className="w-full">
            Reset password
          </Button>
        </div>
      </form>
    </AuthLayout>
  )
}
