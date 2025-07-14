export interface ITelegramBotController {
	launch(): Promise<void>;
	stop(): Promise<void>;
}
