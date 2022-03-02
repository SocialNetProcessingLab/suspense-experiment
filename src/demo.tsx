import type {} from "react/experimental"
import type {} from "react-dom/experimental"
import React, { Suspense, useState } from "react"
import { createRoot } from "react-dom/client"
import { useAsyncFn } from "./hooks"

createRoot(document.querySelector("#app")!).render(
    <Suspense fallback="Loading...">
        <App />
    </Suspense>
)

function App () {
    const [input, setInput] = useState("")
    const [data, transitionNewRequest, isPending, revalidate] = useAsyncFn(
        echo,
        [input]
    )
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
            <button onClick={revalidate}>restart</button>
        </>
    )
}

async function echo (x: string) {
    await new Promise((r) => setTimeout(r, 200))
    return x + `\nupdated at ${new Date().toString()}`
}
