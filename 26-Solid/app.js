'use strict';

class Billing {
    constructor(amount) {
        this.amount = amount;
    }

    calculateTotal() {
        alert(this.amount);
    }
}

class FixedBilling extends Billing {   
}

class HourBilling extends Billing {
    constructor(amount, hour) {
        super(amount);
        this.hour = hour;
    }

    calculateTotal() {
        alert(this.amount * this.hour);
    }
}

class ItemBilling extends Billing {
    constructor(amount, item) {
        super(amount);
        this.item = item;
    }

    calculateTotal() {
        alert(this.amount * this.item);
    }
}