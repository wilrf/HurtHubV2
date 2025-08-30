import { lazy, type ComponentType } from 'react'

/**
 * Utility for lazy loading components with named exports
 * Provides better error handling and type safety
 */
export function lazyImport<
  T extends Record<string, ComponentType<any>>,
  U extends keyof T,
>(factory: () => Promise<T>, name: U): Record<U, T[U]> {
  return {
    [name]: lazy(() =>
      factory().then(module => ({
        default: module[name],
      }))
    ),
  } as Record<U, T[U]>
}

/**
 * Utility for lazy loading default exports
 */
export function lazyDefault<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): T {
  return lazy(factory)
}