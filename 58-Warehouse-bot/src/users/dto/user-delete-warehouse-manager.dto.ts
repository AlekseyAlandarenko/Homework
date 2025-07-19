import { IsInt, Min, IsOptional } from 'class-validator';
import { MESSAGES } from '../../common/messages';

export class WarehouseManagerDeleteDto {
	@IsInt({ message: MESSAGES.USER_ID_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.USER_ID_INVALID_INTEGER })
	@IsOptional()
	newResponsibleId?: number;
}
