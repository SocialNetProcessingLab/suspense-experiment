import {
    MutableRefObject,
    useCallback,
    useRef,
    useSyncExternalStore,
    useTransition
} from "react"

export const useRefOnce = <T> (f: () => T): MutableRefObject<T> => {
    const ref = useRef<T>()
    if (!ref.current) {
        console.log("called current")
        ref.current = f()
    }
    return ref as MutableRefObject<T>
}

type AnyFunction = (...args: any[]) => any

type InternalStore<Data, Meta> = {
    version: number
    data: Data | Promise<void>
    meta: Meta
}
type Destroy = () => void
type Subscribe = (onStoreChange: () => void) => Destroy
type GetSnapshot<T = any> = () => T

export const createStore = <Data, Meta> () => {
    const subscribers = new Set<AnyFunction>()
    const store: InternalStore<Data, Meta> = {
        version: -1,
        data: null!,
        meta: null!
    }

    const notifyAll = () => subscribers.forEach(f => f())

    const subscribe: Subscribe = (onStoreChange) => {
        console.log("subscribe", onStoreChange)
        subscribers.add(onStoreChange)
        return () => {
            console.log("unsubscribe", onStoreChange)
            subscribers.delete(onStoreChange)
        }
    }
    const getSnapshot: GetSnapshot = () => store

    const pushPromise = (rawPromise: Promise<Data>, meta: Meta) => {
        console.log("pushPromise", rawPromise, meta)
        store.version++
        store.meta = meta
        store.data = rawPromise.then(data => {
            console.log("getData", data)
            store.version++
            store.meta = meta
            store.data = data
            notifyAll()
        })
        notifyAll()
        return store.data
    }

    return {
        subscribe,
        getSnapshot,
        pushPromise
    }
}

const store = createStore()
export const useAsyncFunctionStore = <Data, Meta> () => {
    const snapshot = useSyncExternalStore<InternalStore<Data, Meta>>(
        store.subscribe,
        store.getSnapshot
    )
    return {
        snapshot,
        pushPromise: store.pushPromise
    }
}

export type State<Data, Args extends unknown[]> = [
    result: Data,
    execute: (...args: Args) => void,
    isPending: boolean,
    reset: () => void
]

export const useAsyncFn = <Data, Args extends unknown[]> (
    fn: (...args: Args) => Promise<Data>,
    initialArgs: Args
) => {
    const { snapshot, pushPromise } = useAsyncFunctionStore<Data, Args>()
    const [isPending, start] = useTransition()
    const transitionNewRequest = useCallback((...args: Args) => {
        start(() => {
            pushPromise(fn(...args), args).then(() => {
                console.log("resolved")
            })
        })
    }, [fn])
    const revalidate = useCallback(() => {
        transitionNewRequest(...snapshot.meta)
    }, [])
    const ref = useRef({ init: false })
    if (snapshot.version === -1) {
        if (!ref.current.init) {
            console.log("call first")
            transitionNewRequest(...initialArgs)
            ref.current.init = true
        }
        // we don't need initialResult in our library
    }
    // have result
    if (!(snapshot.data instanceof Promise)) return [
        snapshot.data,
        transitionNewRequest,
        isPending,
        revalidate
    ] as const
    throw snapshot.data
}
