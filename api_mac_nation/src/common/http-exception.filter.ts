import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const payload = exception.getResponse();
    let message = exception.message;

    if (typeof payload === 'string') {
      message = payload;
    } else if (payload && typeof payload === 'object') {
      const body = payload as { message?: string | string[]; error?: string };
      if (Array.isArray(body.message)) message = body.message[0];
      else if (typeof body.message === 'string') message = body.message;
      else if (body.error) message = body.error;
    }

    res.status(status).json({ error: message });
  }
}
