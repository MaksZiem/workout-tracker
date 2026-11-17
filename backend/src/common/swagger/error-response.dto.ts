import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'Kod statusu HTTP', example: 404 })
  statusCode: number;

  @ApiPropertyOptional({
    description:
      'Stały kod błędu. Frontend tłumaczy komunikat na podstawie tego pola, a nie pola message',
  })
  code?: string;

  @ApiProperty({
    description:
      'Komunikat błędu po angielsku. Dla błędów walidacji (400) jest to tablica komunikatów, po jednym na każde niepoprawne pole',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Resource not found',
  })
  message: string | string[];

  @ApiPropertyOptional({
    description: 'Wartości wstawiane do przetłumaczonego komunikatu',
    type: 'object',
    additionalProperties: { oneOf: [{ type: 'string' }, { type: 'number' }] },
    example: {},
  })
  params?: Record<string, string | number>;

  @ApiPropertyOptional({
    description: 'Nazwa błędu HTTP (zwracana przez wbudowane wyjątki Nest)',
    example: 'Not Found',
  })
  error?: string;
}

function errorDto(
  name: string,
  statusCode: number,
  error: string,
  message: string | string[],
  code?: string,
) {
  class Dto extends ErrorResponseDto {
    @ApiProperty({ example: statusCode })
    declare statusCode: number;

    @ApiPropertyOptional({
      example: code,
      description: code
        ? undefined
        : 'Dla tego statusu zwykle nieobecny (wbudowany wyjątek Nest)',
    })
    declare code?: string;

    @ApiProperty({
      oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
      example: message,
    })
    declare message: string | string[];

    @ApiPropertyOptional({ example: error })
    declare error?: string;
  }

  Object.defineProperty(Dto, 'name', { value: name });
  return Dto;
}

export const BadRequestErrorDto = errorDto(
  'BadRequestErrorDto',
  400,
  'Bad Request',
  [
    'email must be an email',
    'password must be longer than or equal to 8 characters',
  ],
);

export const UnauthorizedErrorDto = errorDto(
  'UnauthorizedErrorDto',
  401,
  'Unauthorized',
  'Missing authorization token',
  'MISSING_TOKEN',
);

export const ForbiddenErrorDto = errorDto(
  'ForbiddenErrorDto',
  403,
  'Forbidden',
  'Action not allowed',
  'ACTION_NOT_ALLOWED',
);

export const NotFoundErrorDto = errorDto(
  'NotFoundErrorDto',
  404,
  'Not Found',
  'Workout not found',
  'WORKOUT_NOT_FOUND',
);

export const ConflictErrorDto = errorDto(
  'ConflictErrorDto',
  409,
  'Conflict',
  'Exercise with this name already exists',
  'EXERCISE_NAME_TAKEN',
);

export const BadGatewayErrorDto = errorDto(
  'BadGatewayErrorDto',
  502,
  'Bad Gateway',
  'AI could not pick substitutes, try again later',
  'AI_UNAVAILABLE',
);
