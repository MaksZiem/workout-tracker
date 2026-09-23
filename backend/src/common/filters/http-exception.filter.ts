import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (isHttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const typed = body as { message?: string | string[]; error?: string };
        message = typed.message ?? exception.message;
        error = typed.error ?? HttpStatus[statusCode] ?? error;
      }
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    if (isHttpException && error === 'Internal Server Error') {
      error = HttpStatus[statusCode] ?? exception.constructor.name;
    }

    response.status(statusCode).json({
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      statusCode,
      error,
      message,
    });
  }
}
