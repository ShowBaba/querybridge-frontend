import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useSignUp } from '../hooks'
import toast from 'react-hot-toast'

export function SignUp() {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const signUpMutation = useSignUp()

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^A-Za-z0-9]/.test(password)) strength++
    return strength
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 2) return { text: 'Weak', color: 'text-red-500' }
    if (strength <= 3) return { text: 'Medium', color: 'text-yellow-500' }
    return { text: 'Strong', color: 'text-green-500' }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }

    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstname.trim()) newErrors.firstname = 'First name is required'
    if (!formData.lastname.trim()) newErrors.lastname = 'Last name is required'

    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address'

    if (!formData.password) newErrors.password = 'Password is required'
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password'
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'

    if (!formData.termsAccepted) newErrors.termsAccepted = 'You must accept the terms and privacy policy'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (signUpMutation.isPending) return
      if (!validateForm()) return

      signUpMutation.mutate(
        {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
        },
        {
          onSuccess: (response) => {
            console.log('response; ', response)
            if (response?.status === 200 && response?.data?.status === 200) {
              toast.success('Account created successfully. Redirecting to sign in…')
            } else {
              const msg = response?.data?.message || 'Failed to create account'
              toast.error(msg)
            }
          },
          onError: (err: unknown) => {
            const msg =
              (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
              'Failed to create account'
            toast.error(msg)
          },
        }
      )
    },
    [formData, signUpMutation, validateForm]
  )

  const passwordStrengthInfo = getPasswordStrengthText(passwordStrength)

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 py-6 sm:py-12">
      <div className="w-full max-w-lg px-4">
        <div className="mb-8 text-center">
          <Link className="flex items-center justify-center gap-2" to="/">
            <svg className="h-8 w-8 text-[#ec1313]" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
            </svg>
            <span className="text-2xl font-bold tracking-tight text-gray-900">QueryBridge</span>
          </Link>
          <p className="mt-2 text-base text-gray-600">Create an account to get started.</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="block text-sm font-medium text-gray-900" htmlFor="firstname">First Name</label>
              <div className="mt-1.5">
                <input
                  autoComplete="given-name"
                  className="block w-full rounded-lg border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#ec1313] focus:ring-[#ec1313]"
                  id="firstname"
                  name="firstname"
                  placeholder="John"
                  required
                  type="text"
                  value={formData.firstname}
                  onChange={handleInputChange}
                />
                {errors.firstname && <p className="mt-1 text-sm text-red-600">{errors.firstname}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900" htmlFor="lastname">Last Name</label>
              <div className="mt-1.5">
                <input
                  autoComplete="family-name"
                  className="block w-full rounded-lg border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#ec1313] focus:ring-[#ec1313]"
                  id="lastname"
                  name="lastname"
                  placeholder="Doe"
                  required
                  type="text"
                  value={formData.lastname}
                  onChange={handleInputChange}
                />
                {errors.lastname && <p className="mt-1 text-sm text-red-600">{errors.lastname}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900" htmlFor="email">Email address</label>
              <div className="mt-1.5">
                <input
                  autoComplete="email"
                  className="block w-full rounded-lg border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#ec1313] focus:ring-[#ec1313]"
                  id="email"
                  name="email"
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-900" htmlFor="password">Password</label>
                <div className="group relative">
                  <button className="text-gray-400 hover:text-gray-600" type="button" aria-label="Password requirements">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path clipRule="evenodd" fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" />
                    </svg>
                  </button>
                  <div className="absolute bottom-full right-0 mb-2 hidden w-64 rounded-lg bg-gray-800 p-3 text-xs text-white shadow-lg group-hover:block z-10">
                    <h4 className="font-semibold">Password requirements:</h4>
                    <ul className="mt-1 list-disc pl-4 space-y-0.5">
                      <li>At least 8 characters</li>
                      <li>A mix of uppercase and lowercase letters</li>
                      <li>At least one number</li>
                      <li>At least one special symbol (!@#$%^&*)</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="mt-1.5 relative">
                <input
                  autoComplete="new-password"
                  className="block w-full rounded-lg border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#ec1313] focus:ring-[#ec1313]"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    // eye-off
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .734-.264 1.405-.7 1.92M6.228 6.228C4.206 7.63 2.999 9.5 2.999 9.5S6.75 17 14.25 17c1.4 0 2.69-.28 3.847-.757M12 5c7.5 0 11.25 7.5 11.25 7.5a18.55 18.55 0 01-2.733 3.487" />
                    </svg>
                  ) : (
                    // eye
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5c7.5 0 11.25 7.5 11.25 7.5S19.5 19.5 12 19.5.75 12 12 4.5z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex w-full h-1.5 gap-1.5">
                  {[1, 2, 3, 4].map((bar) => (
                    <div
                      key={bar}
                      className={`h-full rounded-full flex-1 bg-gray-200 transition-colors
                        ${bar <= passwordStrength ? 'bg-red-500' : ''}
                        ${bar <= passwordStrength && passwordStrength >= 3 ? 'bg-yellow-500' : ''}
                        ${bar <= passwordStrength && passwordStrength >= 4 ? 'bg-green-500' : ''}`}
                    />
                  ))}
                </div>
                <p className="text-xs text-gray-600">
                  Password strength:{' '}
                  <span className={`font-medium ${passwordStrengthInfo.color}`}>
                    {passwordStrengthInfo.text}
                  </span>
                </p>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="block text-sm font-medium text-gray-900" htmlFor="confirm-password">Confirm Password</label>
              <div className="mt-1.5 relative">
                <input
                  autoComplete="new-password"
                  className="block w-full rounded-lg border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-sm focus:border-[#ec1313] focus:ring-[#ec1313]"
                  id="confirm-password"
                  name="confirmPassword"
                  placeholder="••••••••"
                  required
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(p => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    // eye-off
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c1.657 0 3 1.343 3 3 0 .734-.264 1.405-.7 1.92M6.228 6.228C4.206 7.63 2.999 9.5 2.999 9.5S6.75 17 14.25 17c1.4 0 2.69-.28 3.847-.757M12 5c7.5 0 11.25 7.5 11.25 7.5a18.55 18.55 0 01-2.733 3.487" />
                    </svg>
                  ) : (
                    // eye
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.5c7.5 0 11.25 7.5 11.25 7.5S19.5 19.5 12 19.5.75 12 12 4.5z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
            </div>

            <div className="flex items-start">
              <div className="flex h-5 items-center">
                <input
                  className="h-4 w-4 rounded border-gray-300 text-[#ec1313] focus:ring-[#ec1313]"
                  id="terms-and-privacy"
                  name="termsAccepted"
                  type="checkbox"
                  checked={formData.termsAccepted}
                  onChange={handleInputChange}
                />
              </div>
              <div className="ml-3 text-sm">
                <label className="text-gray-600" htmlFor="terms-and-privacy">
                  I agree to the <a className="font-medium text-[#ec1313] hover:underline" href="#">Terms</a> and{' '}
                  <a className="font-medium text-[#ec1313] hover:underline" href="#">Privacy Policy</a>.
                </label>
              </div>
            </div>
            {errors.termsAccepted && <p className="text-sm text-red-600">{errors.termsAccepted}</p>}

            <div>
              <button
                className="flex w-full justify-center rounded-lg bg-[#ec1313] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors duration-200 hover:bg-[#ec1313]/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ec1313] disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={signUpMutation.isPending}
              >
                {signUpMutation.isPending ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?
          <Link className="font-semibold text-[#ec1313] hover:underline ml-1" to="/signin">
            Sign in
          </Link>
        </p>

        <div className="mt-8 text-center text-xs text-gray-500">
          <Link className="hover:underline" to="/">Home</Link>
          <span className="mx-2">·</span>
          <a className="hover:underline" href="#">Docs</a>
          <span className="mx-2">·</span>
          <a className="hover:underline" href="#">Support</a>
        </div>
      </div>
    </div>
  )
}

export default SignUp