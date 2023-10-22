export class Store<T extends Record<string, unknown>> {
  #subscriptions: Map<string, (() => void)[]> = new Map()
  value: T

  constructor(defaultValue: T) {
    this.value = defaultValue
  }

  /**
   * Set the value of the store.
   */
  set(value: T) {
    // When the value changes, iterate through the object comparing it's
    // values and only calling the subscriptions for the keys that have
    // changed.
    Object.entries(value).forEach(([key, value]) => {
      if (this.#subscriptions.has(key) && value !== this.value[key]) {
        this.#subscriptions.get(key)?.forEach((callback) => callback())
      }
    })

    this.value = value
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
      if (!this.#subscriptions.has(key)) return

      // Remove the callback from the subscription array
      this.#subscriptions.set(
        key,
        this.#subscriptions.get(key)!.filter((cb) => cb !== callback),
      )
    }
  }
}
