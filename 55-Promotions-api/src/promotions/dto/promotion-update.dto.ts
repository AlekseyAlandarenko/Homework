import { IsString, IsDateString, IsOptional } from 'class-validator';
import { IsEndDateAfterStartDate } from './validators/end-date-after-start-date.validator';
import { MESSAGES } from '../../common/messages';

export class PromotionUpdateDto {
	@IsString({ message: MESSAGES.INVALID_TITLE })
	@IsOptional()
	title?: string;

	@IsString({ message: MESSAGES.INVALID_DESCRIPTION })
	@IsOptional()
	description?: string;

	@IsDateString({}, { message: MESSAGES.INVALID_DATE_FORMAT })
	@IsOptional()
	startDate?: string;

	@IsDateString({}, { message: MESSAGES.INVALID_DATE_FORMAT })
	@IsOptional()
	@IsEndDateAfterStartDate({ message: MESSAGES.INVALID_DATES })
	endDate?: string;
}