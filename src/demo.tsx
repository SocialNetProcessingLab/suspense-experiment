import type {} from "react/experimental"
import type {} from "react-dom/experimental"
import React, { Suspense, useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { ResourceContext, useUser } from "./hooks"

createRoot(document.querySelector("#app")!).render(
    <Suspense fallback="Loading...">
        <App />
    </Suspense>
)

function User ({ id }: { id: string }) {
    const result = useUser(id)
    return (
        <div>
            {JSON.stringify(result)}
        </div>
    )
}

function App () {
    const ref = useRef<Map<string, any>>()
    if (!ref.current) {
        ref.current = new Map()
    }
    return (
        <ResourceContext.Provider value={ref.current}>
            <Suspense fallback="loading user...">
                <User id="1" />
            </Suspense>
        </ResourceContext.Provider>
    )
}
