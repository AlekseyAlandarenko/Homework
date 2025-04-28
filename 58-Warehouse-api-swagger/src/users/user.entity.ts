import { compare, hash } from 'bcryptjs';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         email:
 *           type: string
 *           format: email
 *           example: "user@example.com"
 *         name:
 *           type: string
 *           example: "Иван Иванов"
 *         role:
 *           type: string
 *           enum: [SUPERADMIN, ADMIN, WAREHOUSE_MANAGER]
 *           example: "WAREHOUSE_MANAGER"
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       required:
 *         - email
 *         - name
 *         - role
 * 
 *     UserModel:
 *       allOf:
 *         - $ref: '#/components/schemas/UserResponse'
 *         - type: object
 *           properties:
 *             password:
 *               type: string
 *               example: "$2a$10$hashedpassword"
 */
export class User {
	private _password!: string;

	constructor(
		private readonly _email: string,
		private readonly _name: string,
		private readonly _role: string = 'WAREHOUSE_MANAGER',
		passwordHash?: string,
	) {
		if (passwordHash) {
			this._password = passwordHash;
		}
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

	get role(): string {
		return this._role;
	}

	public async setPassword(pass: string, salt: number): Promise<void> {
		this._password = await hash(pass, salt);
	}

	public async comparePassword(pass: string): Promise<boolean> {
		return compare(pass, this._password);
	}
}
