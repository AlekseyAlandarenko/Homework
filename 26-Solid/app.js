'use strict';

class Billing {
    amount;
    constructor(amount) {
        this.amount = amount;
    }
}

class FixedBilling extends Billing {
    CalculateTotal(billing) {
        console.log(billing.amount);
    }
}

class HourBilling extends Billing {
    hour;
    constructor(hour) {
        super()
        this.hour = hour
    }

    CalculateTotal(billing) {
        console.log(billing.amount * this.hour);
    }
}

class ItemBilling extends Billing {
    item;
    constructor(item) {
        super()
        this.item = item
    }

    CalculateTotal(billing) {
        console.log(billing.amount * this.item);
    }
}