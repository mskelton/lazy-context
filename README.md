# Lazy Context

[![Build status](https://github.com/mskelton/lazy-context/workflows/Build/badge.svg)](https://github.com/mskelton/npm-template/actions)
[![npm](https://img.shields.io/npm/v/lazy-context)](https://www.npmjs.com/package/lazy-context)

A thin layer on top of React context that supports "lazy subscription" to only
re-render when the data you care about changes.

## Installation

**npm**

```bash
npm install lazy-context
```

**Yarn**

```bash
yarn add lazy-context
```

**pnpm**

```bash
pnpm add lazy-context
```

**bun**

```bash
bun add lazy-context
```

## How does it work?

One of the challenges with React context is that it's all or nothing when you
update. If you have an object with ten properties and a child component only
needs one of those properties, React will still re-render the child if any of
the other nine properties change. In most cases this is fine, but when fine
tuning performance where ever re-render matters, it starts to break down.

That's where React Lazy Context comes in. It will observe which keys you use
from the context object and only re-render the component when those specific
keys change, ignoring unrelated updates.

## Example Usage

```javascript
import React, { memo } from "react"
import { createLazyContext } from "lazy-context"

const [useUserContext, UserContextProvider] = createLazyContext({
  name: "Mark Skelton",
  hobbies: [],
})

// UserCard will only re-render when `name` changes. Changes to `hobbies` will
// not trigger a re-render.
const UserCard = memo(function UserCard() {
  const { name } = useUserContext()

  return <p>{name}</p>
})

function Page({ children }) {
  return (
    <UserContextProvider value={{ name: "Brad Williams", hobbies: [] }}>
      {children}
    </UserContextProvider>
  )
}
```
