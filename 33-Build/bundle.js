class User {
    constructor(task) {
        this.task = task;
    }
    do() {  
        this.task.run();
    }
}

class Task {
    constructor(message) {
        this.message = message;
    }
    run() {
        alert(this.message);
    }
}

let task = new Task('Hello, world!');
let user = new User(task);

user.do();
