import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from '@/components/AppShell/AppShell'

// Mock the router to avoid navigation issues in tests
const MockRouter = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  </BrowserRouter>
)

describe('AppShell', () => {
  it('renders without crashing', () => {
    render(
      <MockRouter>
        <AppShell />
      </MockRouter>
    )

    expect(screen.getByText('QueryBridge')).toBeInTheDocument()
  })

  it('renders sidebar with navigation items', () => {
    render(
      <MockRouter>
        <AppShell />
      </MockRouter>
    )

    expect(screen.getByText('Applications')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('renders topbar with user controls', () => {
    render(
      <MockRouter>
        <AppShell />
      </MockRouter>
    )

    // Check for bell and user icons (they should be present as buttons)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
