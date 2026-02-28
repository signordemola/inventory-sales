import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { ip, method, originalUrl } = request;
    const userAgent = request.get('user-agent') || '';
    const start = Date.now();

    response.on('finish', () => {
      const { statusCode } = response;
      const contentLength = response.get('content-length');
      const duration = Date.now() - start;

      // Ensure consistent log format: [METHOD] /url - Status - Duration - ContentLength - IP - UserAgent
      this.logger.log(
        `${method} ${originalUrl} ${statusCode} ${duration}ms - ${contentLength || 0} - ${userAgent} ${ip}`,
      );
    });

    next();
  }
}
