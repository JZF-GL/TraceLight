import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from '@/stores'

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.setState({
      theme: 'light',
      repos: [],
      accounts: [],
      commits: [],
      reports: [],
      loading: false,
      error: null
    })
  })

  it('has default theme of light', () => {
    const { theme } = useAppStore.getState()
    expect(theme).toBe('light')
  })

  it('setTheme changes the theme', () => {
    const { setTheme } = useAppStore.getState()
    setTheme('dark')
    expect(useAppStore.getState().theme).toBe('dark')
  })

  it('exports useAppStore from index', () => {
    expect(useAppStore).toBeDefined()
    expect(typeof useAppStore.getState).toBe('function')
  })
})
