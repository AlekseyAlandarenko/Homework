import axios from 'axios';

interface Response {
    users: User[]
    total: number
    skip: number
    limit: number
}
  
interface User {
    id: number
    firstName: string
    lastName: string
    maidenName: string
    age: number
    gender: Gender
    email: string
    phone: string
    username: string
    password: string
    birthDate: string
    image: string
    bloodGroup: string
    height: number
    weight: number
    eyeColor: string
    hair: Hair
    ip: string
    address: Address
    macAddress: string
    university: string
    bank: Bank
    company: Company
    ein: string
    ssn: string
    userAgent: string
    crypto: Crypto
    role: string
}
  
interface Hair {
    color: string
    type: string
}
  
interface Address {
    address: string
    city: string
    state: string
    stateCode: string
    postalCode: string
    coordinates: Coordinates
    country: string
}
  
interface Coordinates {
    lat: number
    lng: number
}
  
interface Bank {
    cardExpire: string
    cardNumber: string
    cardType: string
    currency: string
    iban: string
}
interface Company {
    department: string
    name: string
    title: string
    address: Address
}
  
interface Crypto {
    coin: string
    wallet: string
    network: string
}

enum Gender {
    Male = 'male',
    Female = 'female',
}

async function getUsers() {
    try {
        const { data } = await axios.get<Response>('https://dummyjson.com/users');
        const users = data.users.map((user: User) => user)
        console.log(users);
    } catch (error) {
        if (error instanceof Error) {
            console.log(error.message);
        }
    }
}
  
getUsers();