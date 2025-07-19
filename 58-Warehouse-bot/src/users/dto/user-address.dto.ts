import {
	IsString,
	IsNotEmpty,
	MaxLength,
	IsBoolean,
	IsInt,
	Min,
	IsOptional,
} from 'class-validator';
import { MESSAGES } from '../../common/messages';

export class AddressDto {
	@IsString({ message: MESSAGES.ADDRESS_INVALID_FORMAT })
	@IsNotEmpty({ message: MESSAGES.ADDRESS_REQUIRED_FIELD })
	@MaxLength(255, { message: MESSAGES.ADDRESS_INVALID_LENGTH })
	address!: string;

	@IsBoolean({ message: MESSAGES.ADDRESS_INVALID_DEFAULT })
	isDefault!: boolean;

	@IsInt({ message: MESSAGES.CITY_ID_INVALID_INTEGER })
	@Min(1, { message: MESSAGES.CITY_ID_INVALID_INTEGER })
	@IsOptional()
	cityId?: number;
}
