import {
  Context,
  createContext,
  createElement,
  Provider,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

export interface LazyContextProviderProps<
  TValue extends Record<string, unknown>,
> {
  children: ReactNode
  value: TValue
}

export interface LazyContext<TValue extends Record<string, unknown>>
  extends Omit<Context<Store<TValue>>, "Provider"> {
  Provider: Provider<TValue>
}

export function createLazyContext<TValue extends Record<string, unknown>>(
  defaultValue: TValue,
) {
  const context = createContext(new Store(defaultValue))

  function LazyContextProvider({
    children,
    value,
  }: LazyContextProviderProps<TValue>) {
    // Very intentionally not re-creating the store when value changes. We
    // manually update the value in the effect which then triggers subscriptions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const ctx = useMemo(() => new Store(value), [])

    useEffect(() => {
      ctx.set(value)
    }, [ctx, value])

    return createElement(context.Provider, { value: ctx }, children)
  }

  function useLazyContext(): TValue {
    const store = useContext(context)
    const value = useSubscription(store)
    return value
  }

  return [useLazyContext, LazyContextProvider] as const
}

export class Store<TValue extends Record<string, unknown>> {
  #subscriptions: Map<string, (() => void)[]> = new Map()
  value: TValue

  constructor(defaultValue: TValue) {
    this.value = defaultValue
  }

  /**
   * Set the value of the store.
   */
  set(value: TValue) {
    const oldValue = this.value
    this.value = value

    // When the value changes, iterate through the object comparing it's
    // values and only calling the subscriptions for the keys that have
    // changed.
    Object.entries(value).forEach(([key, value]) => {
      if (this.#subscriptions.has(key) && value !== oldValue[key]) {
        this.#subscriptions.get(key)?.forEach((callback) => callback())
      }
    })
  }

  /**
   * Get a value from the store.
   */
  get(key: string) {
    return this.value[key]
  }

  /**
   * Subscribe to changes in the store for a given key.
   */
  subscribe(key: string, callback: () => void) {
    // Create the subscription array if it doesn't exist
    if (!this.#subscriptions.has(key)) {
      this.#subscriptions.set(key, [])
    }

    // Add the subscription with the specified callback
    this.#subscriptions.get(key)!.push(callback)

    return () => {
      if (!this.#subscriptions.has(key)) {
        return
      }

      // Remove the callback from the subscription array
      this.#subscriptions.set(
        key,
        this.#subscriptions.get(key)!.filter((cb) => cb !== callback),
      )
    }
  }
}

export function useSubscription<TValue extends Record<string, unknown>>(
  store: Store<TValue>,
): TValue {
  const [subscribedKeys] = useState(() => new Set<string>())
  const [subscriptions] = useState(() => new Map<string, () => void>())
  // We are using this state to force a re-render when the store changes. Not
  // actually used outside of that.
  const [_, setRerenderKey] = useState(0)

  const listen = useCallback(() => {
    for (const key of subscribedKeys.keys()) {
      if (!subscriptions.has(key)) {
        subscriptions.set(
          key,
          store.subscribe(key, () => {
            setRerenderKey((renderKey) => renderKey + 1)
          }),
        )
      }
    }
  }, [store, subscribedKeys, subscriptions])

  useEffect(() => {
    listen()

    return () => {
      // Unsubscribe from all subscriptions when the component unmounts
      for (const unsubscribe of subscriptions.values()) {
        unsubscribe()
      }

      // Clear the subscriptions map
      subscriptions.clear()
    }
  }, [listen, store, subscribedKeys, subscriptions])

  return new Proxy<TValue>({} as TValue, {
    get(_, key: string) {
      subscribedKeys.add(key)
      listen()
      return store.get(key)
    },
  })
}
