'use strict';

export class User {
    constructor(task) {
        this.task = task;
    }
    do() {  
        this.task.run()
    }
}