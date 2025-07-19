import { Role } from '../common/enums/role.enum';

export class User {
	private _password: string;

	constructor(
		private readonly _email: string,
		private readonly _name: string,
		private readonly _role: Role = Role.SUPPLIER,
		passwordHash: string,
		private readonly _telegramId: string | null = null,
		private readonly _cityId: number | null = null,
		private readonly _categoryIds: number[] = [],
		private readonly _notificationsEnabled: boolean = true,
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

	get notificationsEnabled(): boolean {
		return this._notificationsEnabled;
	}

	get isDeleted(): boolean {
		return this._isDeleted;
	}
}
