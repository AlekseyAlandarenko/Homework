'use strict';

export class Task {
    constructor(message) {
        this.message = message;
    }
    run() {
        alert(this.message)
    }
}