/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       description: Данные пользователя, возвращаемые в ответах API, включая связанные категории, город и адрес доставки(без пароля).
 *       properties:
 *         id:
 *           type: integer
 *           description: Уникальный идентификатор пользователя.
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           description: Электронная почта пользователя. Уникальна.
 *           example: user@example.com
 *         name:
 *           type: string
 *           description: Имя пользователя.
 *           example: Иван Иванов
 *         role:
 *           type: string
 *           enum: [SUPERADMIN, ADMIN, WAREHOUSE_MANAGER]
 *           description: Роль пользователя (SUPERADMIN/ADMIN — административные права, WAREHOUSE_MANAGER — управление товарами).
 *           example: WAREHOUSE_MANAGER
 *         telegramId:
 *           type: string
 *           nullable: true
 *           description: Идентификатор Telegram пользователя.
 *           example: "123456789"
 *         cityId:
 *           type: integer
 *           nullable: true
 *           description: Идентификатор города пользователя.
 *           example: 1
 *         city:
 *           type: object
 *           description: Город пользователя.
 *           nullable: true
 *           properties:
 *             id:
 *               type: integer
 *               description: Уникальный идентификатор города.
 *               example: 1
 *             name:
 *               type: string
 *               description: Название города.
 *               example: Москва
 *           required:
 *             - id
 *             - name
 *         preferredCategories:
 *           type: array
 *           items:
 *             type: object
 *             description: Категория пользователя.
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Уникальный идентификатор категории.
 *                 example: 1
 *               name:
 *                 type: string
 *                 description: Название категории.
 *                 example: Еда
 *             required:
 *               - id
 *               - name
 *           description: Список предпочитаемых категорий пользователя.
 *           example: [{ id: 1, name: "Еда" }, { id: 2, name: "Напитки" }]
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Дата создания пользователя (ISO 8601).
 *           example: "2023-05-01T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Дата последнего обновления пользователя (ISO 8601).
 *           example: "2023-05-02T12:00:00Z"
 *         isDeleted:
 *           type: boolean
 *           description: Флаг мягкого удаления пользователя.
 *           example: false
 *         addresses:
 *           type: array
 *           items:
 *             type: object
 *             description: Адрес доставки пользователя.
 *             properties:
 *               id:
 *                 type: integer
 *                 description: Уникальный идентификатор адреса.
 *                 example: 1
 *               address:
 *                 type: string
 *                 description: Адрес доставки.
 *                 example: ул. Примерная, д. 1, Москва
 *               isDefault:
 *                 type: boolean
 *                 description: Флаг, указывающий, является ли адрес основным.
 *                 example: true
 *             required:
 *               - id
 *               - address
 *               - isDefault
 *           description: Список адресов доставки пользователя.
 *           example: [{ id: 1, address: "ул. Примерная, д. 1, Москва", isDefault: true }]
 *       required:
 *         - id
 *         - email
 *         - name
 *         - role
 *     UserModel:
 *       allOf:
 *         - $ref: '#/components/schemas/UserResponse'
 *         - type: object
 *           description: Полная модель пользователя, включая хешированный пароль (для внутреннего использования).
 *           properties:
 *             password:
 *               type: string
 *               description: Хешированный пароль пользователя.
 *               example: $2a$10$hashedpassword
 *           required:
 *             - password
 */

import { Role } from '../common/enums/role.enum';

export class User {
	private _password: string;

	constructor(
		private readonly _email: string,
		private readonly _name: string,
		private readonly _role: Role = Role.WAREHOUSE_MANAGER,
		passwordHash: string,
		private readonly _telegramId: string | null = null,
		private readonly _cityId: number | null = null,
		private readonly _categoryIds: number[] = [],
		private readonly _id?: number,
		private readonly _isDeleted: boolean = false,
	) {
		this._password = passwordHash;
	}

	get id(): number | undefined {
		return this._id;
	}

	get email(): string {
		return this._email;
	}

	get name(): string {
		return this._name;
	}

	get password(): string {
		return this._password;
	}

	get role(): Role {
		return this._role;
	}

	get telegramId(): string | null {
		return this._telegramId;
	}

	get cityId(): number | null {
		return this._cityId;
	}

	get preferredCategories(): number[] {
		return [...this._categoryIds];
	}

	get isDeleted(): boolean {
		return this._isDeleted;
	}
}