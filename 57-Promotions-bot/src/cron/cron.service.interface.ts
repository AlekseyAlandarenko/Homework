export interface ICronService {
	start(): Promise<void>;
	stop(): Promise<void>;
	checkScheduledPromotions(): Promise<void>;
}
