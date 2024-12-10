enum RequestMethods {
  Get = "GET",
  Head = "HEAD",
  Options = "OPTIONS",
  Trace = "TRACE",
  Put = "PUT",
  Delete = "DELETE",
  Post = "POST",
  Patch = "PATCH",
  Connect = "CONNECT",
}

interface IRequest<Headers extends HeadersInit | undefined = undefined, Body = unknown> {
  method: RequestMethods;
  url: string;
  headers?: Headers;
  body?: Body;
}

class RequestBuilder<
  Headers extends HeadersInit | undefined = undefined,
  Body = unknown
> {
  private method!: RequestMethods;
  private url!: string;
  private queryParams: Record<string, string | number | string[]> = {};
  private headers?: Headers;
  private body?: Body;

  addMethod(method: RequestMethods): this {
    this.method = method;
    return this;
  }

  addUrl(url: string): this {
    this.url = url;
    return this;
  }

  addQueryParams(params: Record<string, string | number | string[]>): this {
    Object.keys(params).forEach((key) => {
      const value = params[key];
      if (Array.isArray(value)) {
        value.forEach((v) => {
          this.queryParams[key] = this.queryParams[key]
            ? `${this.queryParams[key]},${v}`
            : `${v}`;
        });
      } else {
        this.queryParams[key] = value;
      }
    });
    return this;
  }
  
  private buildUrlWithQueryParams(): string {
    const url = new URL(this.url);
    const queryParams = new URLSearchParams();
  
    Object.keys(this.queryParams).forEach((key) => {
      const value = this.queryParams[key];
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v.toString()));
      } else {
        queryParams.append(key, value.toString());
      }
    });
  
    url.search = queryParams.toString();
    return url.toString();
  }

  addHeaders(headers: Headers): this {
    this.headers = headers;
    return this;
  }

  addBody(body: Body): this {
    this.body = body;
    return this;
  }

  build(): IRequest<Headers, Body> {
    if (!this.method) throw new Error("Метод запроса должен быть указан!");
    if (!this.url) throw new Error("URL запроса должен быть указан!");

    const result: IRequest<Headers, Body> = {
      method: this.method,
      url: this.buildUrlWithQueryParams(),
    };

    if (this.headers) result.headers = this.headers;
    if (this.body) result.body = this.body;

    return result;
  }
}

class RequestAPI {
  async sendRequest<ResponseData = unknown, Headers extends HeadersInit | undefined = undefined, Body = unknown>(
    request: IRequest<Headers, Body>
  ): Promise<ResponseData | undefined> {
    const options: RequestInit = {
      method: request.method,
      headers: request.headers,
      body: request.body ? JSON.stringify(request.body) : undefined,
    };

    try {
      const response = await fetch(request.url, options);

      if (!response.ok) {
        console.error(`Ошибка HTTP: ${response.status} - ${response.statusText}`);
        return undefined;
      }

      return (await response.json()) as ResponseData;
    } catch (error) {
      console.error("Ошибка выполнения запроса:", error);
      return undefined;
    }
  }
}

class RequestAPIProxy {
  private cache = new Map<string, unknown>();

  constructor(private api: RequestAPI) {}

  idValidator(id: number): boolean {
    return id > 0 && id < 10;
  }

  private generateCacheKey(url: string, params?: Record<string, string | number>): string {
    return JSON.stringify({ url, params });
  }

  async getDataById(id: number, params?: Record<string, string | number>): Promise<unknown | undefined> {
    if (!this.idValidator(id)) {
      console.error("Неверный ID! Проверьте условия.");
      return undefined;
    }

    const url = `https://dummyjson.com/products/${id}`;
    const cacheKey = this.generateCacheKey(url, params);

    if (this.cache.has(cacheKey)) {
      console.log("Возвращаем данные из кэша...");
      return this.cache.get(cacheKey);
    }

    const data = await this.api.sendRequest(
      new RequestBuilder()
        .addMethod(RequestMethods.Get)
        .addUrl(url)
        .addQueryParams(params || {})
        .build()
    );

    if (data) {
      this.cache.set(cacheKey, data);
    }
    return data;
  }
}

async function dataLog(request: RequestAPIProxy, id: number): Promise<void> {
  const data = await request.getDataById(id);
  console.log(data ? data : "Данные отсутствуют");
}