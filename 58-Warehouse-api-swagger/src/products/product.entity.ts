/**
 * @swagger
 * components:
 *   schemas:
 *     ProductResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: Ноутбук HP EliteBook
 *         description:
 *           type: string
 *           example: 15.6", Core i7, 16GB RAM
 *         price:
 *           type: number
 *           format: float
 *           example: 1250.99
 *         quantity:
 *           type: integer
 *           example: 10
 *         category:
 *           type: string
 *           example: Электроника
 *         sku:
 *           type: string
 *           example: NB-HP-ELITE-001
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         createdById:
 *           type: integer
 *           example: 2
 *         updatedById:
 *           type: integer
 *           example: 2
 */
export class Product {
    constructor(
        private readonly _name: string,
        private readonly _description: string | null,
        private readonly _price: number,
        private readonly _quantity: number,
        private readonly _category: string | null,
        private readonly _sku: string | null,
        private readonly _isActive: boolean = true,
        private readonly _createdById: number,
        private readonly _updatedById?: number,
    ) {}

    get name(): string {
        return this._name;
    }

    get description(): string | null {
        return this._description;
    }

    get price(): number {
        return this._price;
    }

    get quantity(): number {
        return this._quantity;
    }

    get category(): string | null {
        return this._category;
    }

    get sku(): string | null {
        return this._sku;
    }

    get isActive(): boolean {
        return this._isActive;
    }

    get createdById(): number {
        return this._createdById;
    }

    get updatedById(): number | undefined {
        return this._updatedById;
    }
}
