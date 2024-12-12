class HashMap<K, V> {
    private buckets: Array<Array<[K, V]>>;

    constructor(length: number) {
        this.buckets = Array.from({ length }, () => []);
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
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] === key) {
                bucket[i][1] = value;
                return;
            }
        }

        bucket.push([key, value]);
    }

    get(key: K): V | undefined {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] === key) {
                return bucket[i][1];
            }
        }

        return undefined;
    }

    delete(key: K): boolean {
        const index = this.hash(key);
        const bucket = this.buckets[index];

        for (let i = 0; i < bucket.length; i++) {
            if (bucket[i][0] === key) {
                if (bucket.length > 1) {
                    bucket.splice(i, 1);
                } else {
                    delete this.buckets[index];
                }
                return true;
            }  
        }
        
        return false;
    }

    clear(): void {
        this.buckets = Array.from({ length: this.buckets.length }, () => []);
    }
}