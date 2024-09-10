class HashMap<K, V> {
    private buckets: Array<Array<[K, V]>>;
    constructor(length: number) {
        this.buckets = new Array(length);
    }

    private hash(key: K): number {
        const stringKey = String(key);
        let hash = 0;
        for (let i = 0; i < stringKey.length; i++) {
            hash += stringKey.charCodeAt(i);
        }
        return hash % this.buckets.length;
    }

    set(key: K, value: V): void {
        const index = this.hash(key);
        if (!this.buckets[index]) {
            this.buckets[index] = [];
        }
        this.buckets[index].push([key, value]);
    }

    get(key: K): V | undefined {
        const index = this.hash(key);
        if (!this.buckets[index]) {
            return undefined;
        }
        for (let i = 0; i < this.buckets[index].length; i++) {
            if (this.buckets[index][i][0] === key) {
                return this.buckets[index][i][1];
            }
        }
        return undefined;
    }

    delete(key: K): boolean {
        const index = this.hash(key);
        if (!this.buckets[index]) {
            return false;
        }
        for (let i = 0; i < this.buckets[index].length; i++) {
            if (this.buckets[index][i][0] === key) {
                if (this.buckets[index].length > 1) {
                    this.buckets[index].splice(i, 1);
                } else {
                    delete this.buckets[index];
                }
                return true;
            }
        }
        return false;
    } 

    clear(): void {
        this.buckets = new Array(this.buckets.length);
    }
}