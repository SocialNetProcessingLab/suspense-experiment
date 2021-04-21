import { Result, Ok, Err } from "ts-results"
import { unstable_useTransition, useCallback, useRef, useEffect } from "react"

import {
    // @ts-expect-error
    unstable_createMutableSource as createMutableSource,
    // @ts-expect-error
    unstable_useMutableSource as useMutableSource,
} from "react"

export type State<Return, Args extends unknown[]> = [
    result: Result<Return, unknown>,
    transitionToNewParameter: (...args: Args) => void,
    isPending: boolean,
    revalidate: () => void
]
function takeSnapshot<T>(x: T) {
    return { ...x }
}
export function useAsyncFn<Return, Args extends unknown[]>(
    fn: (...args: Args) => Promise<Return>,
    initialArgs: Args,
    initialResult?: Return
): State<Return, Args> {
    const { pushPromise, snapshot } = useStore<Return, Args>()
    const [start, isPending] = unstable_useTransition()

    const startRequestTransition = useCallback(
        (...args: Args) => {
            start(() => void pushPromise(fn(...args), args))
        },
        [fn]
    )
    const revalidate = useCallback(() => {
        startRequestTransition(...snapshot.meta)
    }, [startRequestTransition, snapshot.version])

    const ref = useRef({ init: false })
    if (snapshot.version === -1) {
        if (!ref.current.init) {
            startRequestTransition(...initialArgs)
            ref.current.init = true
        }
        if (initialResult !== undefined) {
            return [Ok(initialResult), startRequestTransition, true, revalidate]
        }
    }
    if ("val" in snapshot.data) return [snapshot.data, startRequestTransition, isPending, revalidate]
    throw snapshot.data
}

type InternalStore<T, M> = {
    version: number
    data: Result<T, unknown> | Promise<void>
    meta: M
}
function createAsyncMutableStore<T, M>() {
    const subscribers = new Set<Function>()
    const store: InternalStore<T, M> = {
        version: -1,
        data: null!,
        meta: null!,
    }
    const source: unknown = createMutableSource(store, () => store.version)

    function notify() {
        subscribers.forEach((f) => f())
    }
    function subscribe(_snapshot: InternalStore<T, M>, f: Function) {
        subscribers.add(f)
        return () => subscribers.delete(f)
    }
    function pushPromise(rawPromise: Promise<T>, meta: M) {
        store.version++
        store.meta = meta
        const promise = (store.data = Result.wrapAsync(() => rawPromise).then((val) => {
            store.version++
            store.meta = meta
            store.data = val
            notify()
        }))
        notify()
        return promise
    }
    return { pushPromise, source, subscribe }
}

function useStore<T, M>() {
    const { pushPromise, source, subscribe } = useRefOnce(() => createAsyncMutableStore())
    const snapshot: Readonly<InternalStore<T, M>> = useMutableSource(source, takeSnapshot, subscribe)
    return { snapshot, pushPromise }
}

function useRefOnce<T>(f: () => T): T {
    const ref = useRef<T>()
    if (!ref.current) ref.current = f()
    return ref.current
}
