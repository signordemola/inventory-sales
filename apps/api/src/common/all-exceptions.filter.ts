import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: any = 'Internal server error';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'string' ? res : (res as any).message || res;
    } else if (
      exception &&
      typeof exception === 'object' &&
      (exception as any).name === 'PrismaClientKnownRequestError'
    ) {
      const prismaError = exception as any;
      switch (prismaError.code) {
        case 'P2002':
          httpStatus = HttpStatus.CONFLICT;
          message = `Duplicate entry error. The value provided for ${prismaError.meta?.target} already exists.`;
          break;
        case 'P2025':
          httpStatus = HttpStatus.NOT_FOUND;
          message = 'The requested record was not found in the database.';
          break;
        default:
          httpStatus = HttpStatus.BAD_REQUEST;
          message = `Database error: ${prismaError.message?.split('\\n').pop()}`;
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const responseBody = {
      success: false,
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message,
      error:
        exception instanceof HttpException
          ? exception.getResponse()
          : String(exception),
    };

    if (httpStatus >= 500) {
      this.logger.error(
        `Exception occurred at ${responseBody.path}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(
        `Exception occurred at ${responseBody.path} - ${httpStatus} - ${JSON.stringify(message)}`,
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
