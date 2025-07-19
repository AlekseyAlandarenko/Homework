import { inject, injectable } from 'inversify';
import { IPromotionsService } from '../promotions/promotions.service.interface';
import { TYPES } from '../types';
import { ILogger } from '../logger/logger.interface';
import { Telegraf } from 'telegraf';
import { PromotionWithRelations } from '../promotions/promotions.repository.interface';
import { PrismaService } from '../database/prisma.service';
import { INotificationService } from './notification.service.interface';
import { ExtendedContext } from '../telegram/telegram-bot.controller';

@injectable()
export class NotificationService implements INotificationService {
	private bot: Telegraf<ExtendedContext> | null = null;

	constructor(
		@inject(TYPES.PromotionsService) private readonly promotionsService: IPromotionsService,
		@inject(TYPES.ILogger) private readonly logger: ILogger,
		@inject(TYPES.PrismaService) private readonly prismaService: PrismaService,
	) {}

	setBotInstance(bot: Telegraf<ExtendedContext>): void {
		this.bot = bot;
	}

	async notifyUsersAboutNewPromotion(promotionId: number): Promise<void> {
		if (!this.bot) {
			this.logger.error('Экземпляр бота не установлен в NotificationService');
			return;
		}

		const promotion = await this.promotionsService.getPromotionById(
			promotionId,
			undefined,
			undefined,
		);

		if (!promotion || promotion.status !== 'APPROVED' || promotion.isDeleted) {
			this.logger.warn(`Акция ${promotionId} не подходит для уведомления`);
			return;
		}

		const users = await this.prismaService.client.userModel.findMany({
			where: {
				notificationsEnabled: true,
				cityId: promotion.cityId,
				preferredCategories: { some: { id: { in: promotion.categories.map((c) => c.id) } } },
				telegramId: { not: null },
				isDeleted: false,
			},
			select: { telegramId: true },
		});

		const message = this.formatPromotionMessage(promotion);

		for (const user of users) {
			if (user.telegramId) {
				try {
					await this.bot.telegram.sendMessage(user.telegramId, message, {
						parse_mode: 'Markdown',
					});
					this.logger.log(
						`Уведомление отправлено пользователю ${user.telegramId} об акции ${promotionId}`,
					);
				} catch (error) {
					this.logger.error(
						`Ошибка отправки уведомления пользователю ${user.telegramId}: ${error}`,
					);
					await new Promise((resolve) => setTimeout(resolve, 1000));
				}
			}
		}
	}

	private formatPromotionMessage(promotion: PromotionWithRelations): string {
		let message =
			`*${promotion.title.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1')}*\n` +
			`${promotion.description?.replace(/([_*[\]()~`>#+\-=|{}.!])/g, '\\$1') ?? ''}\n` +
			`С ${promotion.startDate.toLocaleDateString('ru-RU')} по ${promotion.endDate.toLocaleDateString('ru-RU')}`;

		if (promotion.imageUrl) {
			message += `\n[Изображение](${promotion.imageUrl})`;
		}
		if (promotion.linkUrl) {
			message += `\n[Подробнее](${promotion.linkUrl})`;
		}
		return message;
	}
}
