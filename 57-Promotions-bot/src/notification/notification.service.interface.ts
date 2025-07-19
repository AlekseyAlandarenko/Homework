import { Telegraf } from 'telegraf';
import { ExtendedContext } from '../telegram/telegram-bot.controller';

export interface INotificationService {
	notifyUsersAboutNewPromotion(promotionId: number): Promise<void>;
	setBotInstance(bot: Telegraf<ExtendedContext>): void;
}
