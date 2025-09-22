import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { AuthLayout } from '../components/AuthLayout'

export function ForgotPassword() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Placeholder logic
    console.log('Forgot password submitted')
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a reset link"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1"
            placeholder="Enter your email"
          />
        </div>

        <div>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </div>

        <div className="text-center">
          <Link
            to="/signin"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
