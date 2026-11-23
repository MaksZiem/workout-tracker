import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ description: 'Kod statusu HTTP', example: 404 })
  statusCode: number;

  @ApiProperty({
    description:
      'Stały kod błędu. Frontend tłumaczy komunikat na podstawie tego pola, a nie pola message',
    example: 'WORKOUT_NOT_FOUND',
  })
  code: string;

  @ApiProperty({
    description:
      'Komunikat błędu po angielsku. Dla błędów walidacji (400) jest to tablica komunikatów, po jednym na każde niepoprawne pole',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: 'Resource not found',
  })
  message: string | string[];

  @ApiProperty({
    description: 'Wartości wstawiane do przetłumaczonego komunikatu',
    type: 'object',
    additionalProperties: { oneOf: [{ type: 'string' }, { type: 'number' }] },
    example: {},
  })
  params: Record<string, string | number>;
}

function errorDto(
  name: string,
  statusCode: number,
  message: string | string[],
  code: string,
) {
  class Dto extends ErrorResponseDto {
    @ApiProperty({ example: statusCode })
    declare statusCode: number;

    @ApiProperty({ example: code })
    declare code: string;

    @ApiProperty({
      oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
      example: message,
    })
    declare message: string | string[];
  }

  Object.defineProperty(Dto, 'name', { value: name });
  return Dto;
}

export const BadRequestErrorDto = errorDto(
  'BadRequestErrorDto',
  400,
  [
    'email must be an email',
    'password must be longer than or equal to 8 characters',
  ],
  'VALIDATION_FAILED',
);

export const UnauthorizedErrorDto = errorDto(
  'UnauthorizedErrorDto',
  401,
  'Missing authorization token',
  'MISSING_TOKEN',
);

export const ForbiddenErrorDto = errorDto(
  'ForbiddenErrorDto',
  403,
  'Action not allowed',
  'ACTION_NOT_ALLOWED',
);

export const NotFoundErrorDto = errorDto(
  'NotFoundErrorDto',
  404,
  'Workout not found',
  'WORKOUT_NOT_FOUND',
);

export const ConflictErrorDto = errorDto(
  'ConflictErrorDto',
  409,
  'Exercise with this name already exists',
  'EXERCISE_NAME_TAKEN',
);

export const BadGatewayErrorDto = errorDto(
  'BadGatewayErrorDto',
  502,
  'AI could not pick substitutes, try again later',
  'AI_UNAVAILABLE',
);
