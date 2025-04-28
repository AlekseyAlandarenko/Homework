/**
 * @swagger
 * components:
 *   schemas:
 *     PromotionResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         title:
 *           type: string
 *           example: "Summer Sale 2023"
 *         description:
 *           type: string
 *           example: "Special discount for summer collection"
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: "2023-06-01T00:00:00Z"
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: "2023-06-30T23:59:59Z"
 *         status:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *           example: "APPROVED"
 *         supplierId:
 *           type: integer
 *           example: 5
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - title
 *         - description
 *         - startDate
 *         - endDate
 *         - status
 *         - supplierId
 */
export class Promotion {
	constructor(
	  private readonly _title: string,
	  private readonly _description: string,
	  private readonly _startDate: Date,
	  private readonly _endDate: Date,
	  private readonly _status: string = 'PENDING',
	  private readonly _supplierId: number,
	) {}
  
	get title(): string {
	  return this._title;
	}
  
	get description(): string {
	  return this._description;
	}
  
	get startDate(): Date {
	  return this._startDate;
	}
  
	get endDate(): Date {
	  return this._endDate;
	}
  
	get status(): string {
	  return this._status;
	}
  
	get supplierId(): number {
	  return this._supplierId;
	}
  }