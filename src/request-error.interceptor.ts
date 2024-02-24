import { Injectable, NestInterceptor, ExecutionContext, CallHandler, HttpException } from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators'; // Importa tu servicio de logger personalizado
import { ApplicationLoggerService } from './common/services/application-logger.service';

@Injectable()
export class ErrorInterceptor implements NestInterceptor {
  constructor(private readonly logger: ApplicationLoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError(error => {
        // Verificar si el error es una excepción relacionada con la validación del DTO
        if (error instanceof HttpException && ((error as any).status === 400)) {
          // Loggear el error utilizando el servicio de logger personalizado
          this.logger.log(`error in dto: ${(error.getResponse() as any).message}`);
        }
        // Propagar el error
        return throwError(() => error);
      }),
    );
  }
}