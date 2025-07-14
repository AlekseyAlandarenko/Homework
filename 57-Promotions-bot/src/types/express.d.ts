import { Role } from '../../common/enums/role.enum';

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: number;
				email: string;
				role: Role;
			};
			targetRole?: Role;
		}
	}
}
