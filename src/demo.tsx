import type {} from "react/experimental"
import type {} from "react-dom/experimental"
import React, { Suspense, useState } from "react"
import { unstable_createRoot } from "react-dom"
import { useAsyncFn } from "./hooks"
import {} from "ts-results"

unstable_createRoot(document.querySelector("#app")!).render(
    <Suspense fallback="Loading...">
        <App />
    </Suspense>
)
function App() {
    const [input, setInput] = useState("")
    const [result, transitionNewRequest, isPending, revalidate] = useAsyncFn(echo, [""], "")
    const data = result.unwrap()
    return (
        <>
            <input
                value={input}
                onInput={(e) => {
                    setInput(e.currentTarget.value)
                    transitionNewRequest(e.currentTarget.value)
                }}
            />
            <br />
            <pre style={isPending ? { opacity: 0.2 } : {}}>Result: {data}</pre>
            <br />
            <button onClick={revalidate}>Revalidate</button>
        </>
    )
}

async function echo(x: string) {
    await new Promise((r) => setTimeout(r, 200))
    return x + `\nupdated at ${new Date().toString()}`
}
