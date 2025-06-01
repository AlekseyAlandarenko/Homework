import { Router, Response, Request } from 'express';
import { ExpressReturnType, IControllerRoute } from './route.interface';
import { ILogger } from '../logger/logger.interface';
import { injectable } from 'inversify';
import { PaginationDto } from './dto/pagination.dto';
import { DEFAULT_PAGINATION } from './pagination.interface';
export { Router } from 'express';
import 'reflect-metadata';

@injectable()
export abstract class BaseController {
	private readonly _router: Router;

	constructor(private logger: ILogger) {
		this._router = Router();
	}

	get router(): Router {
		return this._router;
	}

	public send<T>(res: Response, code: number, message: T): ExpressReturnType {
		res.type('application/json');
		return res.status(code).json(message);
	}

	public ok<T>(res: Response, message: T): ExpressReturnType {
		return this.send<T>(res, 200, message);
	}

	public created<T>(res: Response, message?: T): ExpressReturnType {
		if (message) {
			return this.send<T>(res, 201, message);
		}
		return res.sendStatus(201);
	}

	protected getPagination(req: Request): PaginationDto {
		const { page, limit } = req.query as { page?: string; limit?: string };
		return {
			page: Number(page) || DEFAULT_PAGINATION.page,
			limit: Number(limit) || DEFAULT_PAGINATION.limit,
		};
	}

	protected sendPaginatedResponse<T>(
		res: Response,
		items: T[],
		total: number,
		pagination: PaginationDto,
	): ExpressReturnType {
		return this.ok(res, {
			data: items,
			meta: {
				total,
				page: pagination.page,
				limit: pagination.limit,
				totalPages: Math.ceil(total / pagination.limit),
			},
		});
	}

	protected bindRoutes(routes: IControllerRoute[]): void {
		for (const route of routes) {
			this.logger.log(`[${route.method}] ${route.path}`);
			const middleware = route.middlewares?.map((m) => m.execute.bind(m));
			const handler = route.func.bind(this);
			const pipeline = middleware ? [...middleware, handler] : handler;
			this.router[route.method](route.path, pipeline);
		}
	}
}
