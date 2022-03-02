import {
    createContext,
    useContext,
    useCallback,
    useEffect
} from "react"

export const ResourceContext = createContext<Map<string, any> | null>(null)

const useResource = (): Map<string, any> => {
    const resource = useContext(ResourceContext)
    if (!resource) {
        throw new Error("resource not found")
    }
    return resource
}

export const useUser = (id: string) => {
    const resource = useResource()
    const fetch = useCallback(async () => {
        return new Promise(r => setTimeout(r, 1000)).then(() => {
            resource.set(id, {
                id,
                username: "himself65"
            })
        })
    }, [])
    useEffect(() => {
        return () => {
            resource.delete(id)
        }
    }, [])
    if (resource.get(id) === undefined) {
        throw fetch()
    }
    return resource.get(id)!
}
