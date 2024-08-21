import {makeOrdinal} from './makeOrdinal';
import {isFinite} from './isFinite';
import {isSafeNumber} from './isSafeNumber';

let ten: number = 10;
let oneHundred: number = 100;
let oneThousand: number = 1000;
let oneMillion: number = 1000000;
let oneBillion: number = 1000000000;           
let oneTrillion: number = 1000000000000;       
let oneQuadrillion: number = 1000000000000000; 
let max: number = 9007199254740991;             

let lessThanTwenty: string[] = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
];

let tenthsLessThanHundred: string[] = [
    'zero', 'ten', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'
];

function toWordsOrdinal(number: string, asOrdinal: boolean): string {
    let words: string;
    let num: number = parseInt(number, 10);

    if (!isFinite(num)) {
        throw new TypeError(
            'Not a finite number: ' + number + ' (' + typeof number + ')'
        );
    }
    if (!isSafeNumber(num)) {
        throw new RangeError(
            'Input is not a safe number, its either too large or too small.'
        );
    }
    words = generateWords(num);
    return asOrdinal ? makeOrdinal(words) : words;
}

function generateWords(number: number, words: string[] = []): string {
    let remainder: number = 0, word: string = '';

    if (number === 0) {
        return !words ? 'zero' : words.join(' ').replace(/,$/, '');
    }

    if (!words) {
        words = [];
    }

    if (number < 0) {
        words.push('minus');
        number = Math.abs(number);
    }

    if (number < 20) {
        remainder = 0;
        word = lessThanTwenty[number];

    } else if (number < oneHundred) {
        remainder = number % ten;
        word = tenthsLessThanHundred[Math.floor(number / ten)];
        if (remainder) {
            word += '-' + lessThanTwenty[remainder];
            remainder = 0;
        }

    } else if (number < oneThousand) {
        remainder = number % oneHundred;
        word = generateWords(Math.floor(number / oneHundred)) + ' hundred';

    } else if (number < oneMillion) {
        remainder = number % oneThousand;
        word = generateWords(Math.floor(number / oneThousand)) + ' thousand,';

    } else if (number < oneBillion) {
        remainder = number % oneMillion;
        word = generateWords(Math.floor(number / oneMillion)) + ' million,';

    } else if (number < oneTrillion) {
        remainder = number % oneBillion;
        word = generateWords(Math.floor(number / oneBillion)) + ' billion,';

    } else if (number < oneQuadrillion) {
        remainder = number % oneTrillion;
        word = generateWords(Math.floor(number / oneTrillion)) + ' trillion,';

    } else if (number <= max) {
        remainder = number % oneQuadrillion;
        word = generateWords(Math.floor(number / oneQuadrillion)) + ' quadrillion,';
    }

    words.push(word);
    return generateWords(remainder, words);
}

export default toWordsOrdinal;