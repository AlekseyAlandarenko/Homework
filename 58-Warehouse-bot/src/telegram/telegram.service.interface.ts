export interface ITelegramBotService {
	launch(): Promise<void>;
	stop(): Promise<void>;
}
