'use strict';

import {User} from './user.js';
import {Task} from './task.js';

let task = new Task('Hello, world!');
let user = new User(task)

user.do();

