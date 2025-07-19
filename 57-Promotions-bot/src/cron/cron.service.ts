import { inject, injectable } from 'inversify';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { NotificationService } from '../notification/notification.service';
import { PrismaService } from '../database/prisma.service';
import { PromotionStatus } from '../common/enums/promotion-status.enum';
import { schedule, ScheduledTask } from 'node-cron';
import { ICronService } from './cron.service.interface';

@injectable()
export class CronService implements ICronService {
	private cronJob: ScheduledTask;

	constructor(
		@inject(TYPES.NotificationService) private readonly notificationService: NotificationService,
		@inject(TYPES.PrismaService) private readonly prismaService: PrismaService,
		@inject(TYPES.ILogger) private readonly logger: ILogger,
	) {
		this.cronJob = schedule('* * * * *', () => this.checkScheduledPromotions(), {
			timezone: 'UTC',
		});
	}

	async start(): Promise<void> {
		this.cronJob.start();
		this.logger.log('CronService запущен');
	}

	async stop(): Promise<void> {
		this.cronJob.stop();
		this.logger.log('CronService остановлен');
	}

	async checkScheduledPromotions(): Promise<void> {
		const now = new Date();
		try {
			const promotions = await this.prismaService.client.promotionModel.findMany({
				where: {
					publicationDate: { lte: now },
					status: PromotionStatus.PENDING,
					isDeleted: false,
				},
				select: { id: true },
			});

			for (const promotion of promotions) {
				try {
					await this.prismaService.client.promotionModel.update({
						where: { id: promotion.id },
						data: { status: PromotionStatus.APPROVED },
					});
					await this.notificationService.notifyUsersAboutNewPromotion(promotion.id);
					this.logger.log(`Акция ${promotion.id} опубликована и уведомления отправлены`);
				} catch (error) {
					this.logger.error(`Ошибка обработки акции ${promotion.id}: ${error}`);
				}
			}
		} catch (error) {
			this.logger.error(`Ошибка получения запланированных акций: ${error}`);
		}
	}
}
