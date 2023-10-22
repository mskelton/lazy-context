/* eslint-disable vitest/max-expects */
import { render, renderHook, screen } from "@testing-library/react"
import React, { memo, useMemo } from "react"
import { describe, expect, it, vi } from "vitest"
import { createLazyContext } from "./createLazyContext.js"

describe("createLazyContext", () => {
  it("should work with the default context value", () => {
    const [use] = createLazyContext({ name: "mark" })
    const { result } = renderHook(() => use())
    expect(result.current.name).toBe("mark")
  })

  it("should work with provided context", () => {
    const [use, Provider] = createLazyContext({ name: "mark" })
    const { result } = renderHook(() => use(), {
      wrapper: ({ children }) => (
        <Provider value={{ name: "bar" }}>{children}</Provider>
      ),
    })
    expect(result.current.name).toBe("bar")
  })

  it("should only re-render when the destructured values change", () => {
    const [use, Provider] = createLazyContext({ age: 12, name: "foo" })
    const nameRenderCount = vi.fn()
    const ageRenderCount = vi.fn()

    const Name = memo(function Name() {
      const { name } = use()
      nameRenderCount()
      return <span data-testid="name">{name}</span>
    })

    const Age = memo(function Age() {
      const { age } = use()
      ageRenderCount()
      return <span data-testid="age">{age}</span>
    })

    function Component({ age, name }: { age: number; name: string }) {
      const ctx = useMemo(() => ({ age, name }), [name, age])

      return (
        <Provider value={ctx}>
          <Name />
          <Age />
        </Provider>
      )
    }

    const { rerender } = render(<Component age={12} name="foo" />)
    expect(nameRenderCount).toHaveBeenCalledTimes(1)
    expect(ageRenderCount).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("name").textContent).toBe("foo")
    expect(screen.getByTestId("age").textContent).toBe("12")

    rerender(<Component age={12} name="blah" />)
    expect(nameRenderCount).toHaveBeenCalledTimes(2)
    expect(ageRenderCount).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("name").textContent).toBe("blah")
    expect(screen.getByTestId("age").textContent).toBe("12")

    rerender(<Component age={20} name="blah" />)
    expect(nameRenderCount).toHaveBeenCalledTimes(2)
    expect(ageRenderCount).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId("name").textContent).toBe("blah")
    expect(screen.getByTestId("age").textContent).toBe("20")

    rerender(<Component age={10} name="test" />)
    expect(nameRenderCount).toHaveBeenCalledTimes(3)
    expect(ageRenderCount).toHaveBeenCalledTimes(3)
    expect(screen.getByTestId("name").textContent).toBe("test")
    expect(screen.getByTestId("age").textContent).toBe("10")
  })
})
