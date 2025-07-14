import { Prisma, PrismaClient } from '@prisma/client';
import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { MESSAGES } from '../common/messages';
import { HTTPError } from '../errors/http-error.class';

@injectable()
export class PrismaService {
	client: PrismaClient;

	constructor(@inject(TYPES.ILogger) private logger: ILogger) {
		this.client = new PrismaClient();
	}

	async connect(): Promise<void> {
		try {
			await this.client.$connect();
			this.logger.log(MESSAGES.PRISMA_DB_CONNECT_SUCCESS);
		} catch (e) {
			if (e instanceof Error) {
				this.logger.error(MESSAGES.PRISMA_DB_CONNECT_FAILED);
			}
			throw e;
		}
	}

	async disconnect(): Promise<void> {
		await this.client.$disconnect();
	}

	async validateCity(cityId: number): Promise<void> {
		const city = await this.findCityById(cityId);
		if (!city) {
			throw new HTTPError(422, MESSAGES.CITY_NOT_FOUND);
		}
	}

	async validateCategories(categoryIds: number[]): Promise<void> {
		if (categoryIds.length) {
			const validCategories = await this.findCategoriesByIds(categoryIds);
			if (validCategories.length !== categoryIds.length) {
				throw new HTTPError(422, MESSAGES.INVALID_CATEGORIES);
			}
		}
	}

	async validateAddresses(addressIds: number[], userId: number): Promise<void> {
		if (addressIds.length) {
			const validAddresses = await this.findAddressesById(addressIds, userId);
			if (validAddresses.length !== addressIds.length) {
				throw new HTTPError(422, MESSAGES.INVALID_ADDRESSES);
			}
		}
	}

	handlePrismaError(error: unknown, errorMessage: string): never {
		if (error instanceof Prisma.PrismaClientKnownRequestError) {
			const meta = error.meta as { field_name?: string } | undefined;
			this.logger.error(MESSAGES.PRISMA_ERROR_LOG);
			switch (error.code) {
				case 'P2002':
					throw new HTTPError(409, MESSAGES.UNIQUE_CONSTRAINT_FAILED);
				case 'P2025':
					throw new HTTPError(404, errorMessage);
				case 'P2003':
					throw new HTTPError(
						422,
						meta?.field_name?.includes('cityId')
							? MESSAGES.CITY_NOT_FOUND
							: MESSAGES.INVALID_CATEGORIES,
					);
				case 'P2014':
					throw new HTTPError(409, MESSAGES.REQUIRED_RELATION_VIOLATION);
				case 'P2009':
					throw new HTTPError(400, MESSAGES.INVALID_DATA);
				case 'P1001':
				case 'P1002':
				case 'P1003':
				case 'P1008':
					throw new HTTPError(500, MESSAGES.DATABASE_CONNECTION_ERROR);
				case 'P5000':
					throw new HTTPError(500, MESSAGES.DATABASE_PANIC);
				default:
					throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
			}
		}
		this.logger.error(MESSAGES.PRISMA_ERROR_LOG);
		throw new HTTPError(500, MESSAGES.INTERNAL_SERVER_ERROR);
	}

	async executePrismaOperation<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
		try {
			return await operation();
		} catch (error) {
			this.handlePrismaError(error, errorMessage);
		}
	}

	async findOrThrow<T>(findMethod: () => Promise<T | null>, errorMessage: string): Promise<T> {
		const result = await this.executePrismaOperation(() => findMethod(), errorMessage);
		if (!result) {
			throw new HTTPError(404, errorMessage);
		}
		return result;
	}

	async findCityById(cityId: number): Promise<{ id: number } | null> {
		return this.executePrismaOperation(
			() =>
				this.client.cityModel.findUnique({
					where: { id: cityId },
					select: { id: true },
				}),
			MESSAGES.CITY_NOT_FOUND,
		);
	}

	async findCategoriesByIds(categoryIds: number[]): Promise<{ id: number }[]> {
		if (!categoryIds.length) return [];
		return this.executePrismaOperation(
			() =>
				this.client.categoryModel.findMany({
					where: { id: { in: categoryIds } },
					select: { id: true },
				}),
			MESSAGES.INVALID_CATEGORIES,
		);
	}

	async findAddressesById(
		addressIds: number[],
		userId: number,
	): Promise<{ id: number; address: string; isDefault: boolean }[]> {
		return this.executePrismaOperation(
			() =>
				this.client.addressModel.findMany({
					where: {
						id: { in: addressIds },
						userId,
						isDeleted: false,
					},
					select: { id: true, address: true, isDefault: true },
				}),
			MESSAGES.ADDRESSES_NOT_FOUND,
		);
	}

	async createAddresses(
		userId: number,
		addresses: { address: string; isDefault: boolean }[],
	): Promise<void> {
		await this.executePrismaOperation(
			() =>
				this.client.addressModel.createMany({
					data: addresses.map((a) => ({
						userId,
						address: a.address,
						isDefault: a.isDefault,
					})),
				}),
			MESSAGES.ADDRESSES_CREATION_FAILED,
		);
	}

	async deleteUserAddresses(userId: number): Promise<void> {
		await this.executePrismaOperation(
			() =>
				this.client.addressModel.updateMany({
					where: { userId, isDeleted: false },
					data: { isDeleted: true },
				}),
			MESSAGES.ADDRESSES_UPDATE_FAILED,
		);
	}

	async findUserAddresses(
		userId: number,
	): Promise<{ id: number; address: string; isDefault: boolean }[]> {
		return this.executePrismaOperation(
			() =>
				this.client.addressModel.findMany({
					where: { userId, isDeleted: false },
					select: { id: true, address: true, isDefault: true },
				}),
			MESSAGES.ADDRESSES_NOT_FOUND,
		);
	}
}
