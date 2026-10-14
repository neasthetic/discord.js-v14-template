import type { StoreOptions } from "#base/protocols/store"

export class Store<V, K extends string | number = string> {
    private store = new Map<K, V>()
    private timers = new Map<K, ReturnType<typeof setTimeout>>()

    public set(name: K, value: V, options: StoreOptions = {}) {
        this.delete(name)
        this.store.set(name, value)
        if (options.time !== undefined) {
            const timer = setTimeout(() => {
                this.timers.delete(name)
                if (!options.beforeDelete || options.beforeDelete()) this.delete(name)
            }, options.time)
            timer.unref()
            this.timers.set(name, timer)
        }
    }
    public get(name: K) { return this.store.get(name) }
    public has(name: K) { return this.store.has(name) }
    public delete(name: K) {
        const timer = this.timers.get(name)
        if (timer) clearTimeout(timer)
        this.timers.delete(name)
        this.store.delete(name)
    }
}
