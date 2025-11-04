import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSignIn } from '../hooks'
import toast from 'react-hot-toast'

export function SignIn() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPassword, setShowPassword] = useState(false)

  const signInMutation = useSignIn()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      await signInMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
      })
      toast.success('Welcome back!')
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to sign in'
      toast.error(errorMessage)
    }
  }

  return (
    <div className="relative flex size-full min-h-screen flex-col overflow-x-hidden group/design-root">
      <div className="flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">
            <div>
              <div className="mx-auto flex h-12 w-auto justify-center items-center gap-2">
                <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
                </svg>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">QueryBridge</h1>
              </div>
              <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>
              <p className="mt-2 text-center text-sm text-gray-600">
                Or
                <Link className="font-medium text-red-600 hover:text-red-700 ml-1" to="/signup">
                  create a new account
                </Link>
              </p>
            </div>

            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <input name="remember" type="hidden" value="true" />
              <div className="space-y-4 rounded-md shadow-sm">
                <div>
                  <label className="sr-only" htmlFor="email-address">Email address</label>
                  <input
                    autoComplete="email"
                    className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                    id="email-address"
                    name="email"
                    placeholder="Email address"
                    required
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                  {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label className="sr-only" htmlFor="password">Password</label>
                  <div className="relative">
                    <input
                      autoComplete="current-password"
                      className="block w-full rounded-md border-0 py-3 px-4 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-600 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                      id="password"
                      name="password"
                      placeholder="Password"
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
                  {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    className="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600 checked:bg-red-600 checked:border-red-600"
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleInputChange}
                  />
                  <label className="ml-2 block text-sm text-gray-600" htmlFor="remember-me">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link className="font-medium text-red-600 hover:text-red-700" to="/forgot-password">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  className="group relative flex w-full justify-center rounded-md bg-red-600 py-3 px-4 text-sm font-semibold text-white hover:bg-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={signInMutation.isPending}
                >
                  {signInMutation.isPending ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-50 px-2 text-gray-600">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <a className="inline-flex w-full justify-center rounded-md bg-white py-2 px-4 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0" href="#">
                  <span className="sr-only">Continue with Google</span>
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.425 2.865 8.165 6.837 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 5.09c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.338 4.695-4.566 4.942.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.745 0 .267.18.577.688.48A10.001 10.001 0 0020 10c0-5.523-4.477-10-10-10z"></path>
                  </svg>
                </a>
              </div>
              <div>
                <a className="inline-flex w-full justify-center rounded-md bg-white py-2 px-4 text-gray-500 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-offset-0" href="#">
                  <span className="sr-only">Continue with GitHub</span>
                  <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path clipRule="evenodd" fillRule="evenodd" d="M15.841 10.221c0-2.348-1.542-3.875-3.842-3.875h-1.833v2.334h1.767c.966 0 1.633.642 1.633 1.583 0 .942-.667 1.592-1.633 1.592h-1.767v2.333h1.833c2.3 0 3.842-1.527 3.842-3.892zM9.541 6.346h-2.1v7.5h2.1v-7.5zm-2.85-2.096c.033-.45.425-.792.884-.792s.85.342.883.792h-1.767z"></path>
                    <path clipRule="evenodd" fillRule="evenodd" d="M20 10c0-5.523-4.477-10-10-10S0 4.477 0 10s4.477 10 10 10 10-4.477 10-10zm-5.458 4.25h-1.542v-2.333h-1.833v-2.334h1.833v-2.333h1.542v7zm-2.917-7.5H4.25v7.5h7.375c2.908 0 4.875-2.092 4.875-4.917 0-2.825-1.967-4.916-4.875-4.916H9.542v2.333z"></path>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}