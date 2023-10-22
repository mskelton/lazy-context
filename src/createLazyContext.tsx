import React, {
  Context,
  createContext,
  Provider,
  useContext,
  useEffect,
  useMemo,
} from "react"
import { Store } from "./Store.js"
import { useSubscription } from "./useSubscription.js"

interface LazyContextProviderProps<T extends Record<string, unknown>> {
  children: React.ReactNode
  value: T
}

export interface LazyContext<T extends Record<string, unknown>>
  extends Omit<Context<Store<T>>, "Provider"> {
  Provider: Provider<T>
}

export function createLazyContext<T extends Record<string, unknown>>(
  defaultValue: T,
) {
  const context = createContext(new Store(defaultValue))

  function LazyContextProvider({
    children,
    value,
  }: LazyContextProviderProps<T>) {
    // Very intentionally not re-creating the store when value changes. We
    // manually update the value in the effect which then triggers subscriptions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const ctx = useMemo(() => new Store(value), [])

    useEffect(() => {
      ctx.set(value)
    }, [ctx, value])

    return <context.Provider value={ctx}>{children}</context.Provider>
  }

  function useLazyContext(): T {
    const store = useContext(context)
    const value = useSubscription(store)
    return value
  }

  return [useLazyContext, LazyContextProvider] as const
}
