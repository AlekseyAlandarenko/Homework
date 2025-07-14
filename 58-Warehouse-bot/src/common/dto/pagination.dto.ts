import { IsInt, Min } from 'class-validator';
import { MESSAGES } from '../messages';

export class PaginationDto {
	@IsInt({ message: MESSAGES.PAGE_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.PAGE_INVALID_INTEGER })
	page: number = 1;

	@IsInt({ message: MESSAGES.LIMIT_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.LIMIT_INVALID_INTEGER })
	limit: number = 10;
}
