import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { AuthLayout } from '../components/AuthLayout'

export function VerifyEmail() {
  const handleResend = () => {
    // Placeholder logic
    console.log('Resend verification email')
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="We've sent a verification link to your email address"
    >
      <div className="text-center space-y-6">
        <div className="text-sm text-gray-600">
          Please check your email and click the verification link to activate your account.
        </div>

        <div>
          <Button onClick={handleResend} variant="outline" className="w-full">
            Resend verification email
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
      </div>
    </AuthLayout>
  )
}
