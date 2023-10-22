import { useEffect, useRef, useState } from "react"
import { Store } from "./Store.js"

export function useSubscription<T extends Record<string, unknown>>(
  store: Store<T>,
): T {
  const subscriptions = useRef(new Map<string, () => void>())
  // We are using this state to force a re-render when the store changes. Not
  // actually used outside of that.
  const [_, setKey] = useState(0)

  useEffect(() => {
    const subs = subscriptions.current

    return () => {
      // Unsubscribe from all subscriptions when the component unmounts
      for (const unsubscribe of subs.values()) {
        unsubscribe()
      }
    }
  }, [store])

  return new Proxy<T>({} as T, {
    get(_, key: string) {
      // Subscribe to the store for the specified key when it is accessed
      if (!subscriptions.current.has(key)) {
        subscriptions.current.set(
          key,
          store.subscribe(key, () => setKey((key) => key + 1)),
        )
      }

      return store.get(key)
    },
  })
}
