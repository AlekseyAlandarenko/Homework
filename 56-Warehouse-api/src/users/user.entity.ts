import { compare, hash } from 'bcryptjs';
import { UserRole } from '../common/constants';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       description: Данные пользователя, возвращаемые в ответах API (без пароля).
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
 *           description: Роль пользователя (SUPERADMIN/ADMIN — административные права, WAREHOUSE_MANAGER — управление складскими запасами).
 *           example: WAREHOUSE_MANAGER
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
export class User {
	private _password: string;

	constructor(
		private readonly _email: string,
		private readonly _name: string,
		private readonly _role: UserRole = 'WAREHOUSE_MANAGER',
		passwordHash?: string,
	) {
		this._password = passwordHash || '';
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

	get role(): UserRole {
		return this._role;
	}

	public async setPassword(pass: string, salt: number): Promise<void> {
		this._password = await hash(pass, salt);
	}

	public async comparePassword(pass: string): Promise<boolean> {
		return compare(pass, this._password);
	}
}
