import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  private readonly SENSITIVE_HEADERS = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-secret',
    'password',
  ];

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    const requestId = req.headers['x-request-id'] || crypto.randomUUID();

    (req as any).requestId = requestId;

    const safeHeaders = this.sanitizeHeaders(req.headers);

    this.logger.log(`[${requestId}] → ${method} ${originalUrl} - ${ip}`);

    if (Logger.isLevelEnabled('debug')) {
      this.logger.debug(
        `[${requestId}] Headers: ${JSON.stringify(safeHeaders)}`,
      );
    }

    res.on('finish', () => {
      const duration = Date.now() - start;
      const { statusCode } = res;
      const level = statusCode >= 400 ? 'error' : 'log';

      this.logger[level](
        `[${requestId}] ← ${method} ${originalUrl} ${statusCode} - ${duration}ms`,
      );
    });

    next();
  }

  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    for (const header of this.SENSITIVE_HEADERS) {
      if (sanitized[header]) sanitized[header] = '[REDACTED]';
    }

    if (process.env.NODE_ENV === 'development') {
      delete sanitized['user-agent'];
      delete sanitized['accept'];
      delete sanitized['accept-encoding'];
    }

    return sanitized;
  }
}
