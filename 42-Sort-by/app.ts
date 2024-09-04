import { sortBy } from 'sort-by';

const users = [{
    id: 0,
    name: 'A',
    age: '30',
    email: { primary: 'A@email.com' }
}, {
    id: 1,
    name: 'B',
    age: '20',
    email: { primary: 'B@email.com' }
}, {
    id: 2,
    name: 'C',
    age: '10',
    email: { primary: 'C@email.com' }
}];

console.log(users.sort(sortBy('age')));