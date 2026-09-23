import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Znacznik czasu wystąpienia błędu (ISO 8601)',
    example: '2026-09-23T17:45:12.345Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Ścieżka żądania, na której wystąpił błąd',
    example: '/workout/123',
  })
  path: string;

  @ApiProperty({
    description: 'Metoda HTTP żądania',
    example: 'GET',
  })
  method: string;

  @ApiProperty({
    description: 'Kod statusu HTTP',
    example: 404,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Nazwa błędu HTTP',
    example: 'Not Found',
  })
  error: string;

  @ApiProperty({
    description:
      'Komunikat błędu. Dla błędów walidacji (400) jest to tablica komunikatów - po jednym na każde niepoprawne pole.',
    oneOf: [
      { type: 'string', example: 'Workout not found' },
      {
        type: 'array',
        items: { type: 'string' },
        example: [
          'email must be an email',
          'password must be longer than or equal to 8 characters',
        ],
      },
    ],
  })
  message: string | string[];
}

export class BadRequestErrorDto {
  @ApiProperty({ example: '2026-09-23T17:45:12.345Z' })
  timestamp: string;

  @ApiProperty({ example: '/auth/signup' })
  path: string;

  @ApiProperty({ example: 'POST' })
  method: string;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({
    example: [
      'email must be an email',
      'password must be longer than or equal to 8 characters',
    ],
  })
  message: string | string[];
}

export class UnauthorizedErrorDto {
  @ApiProperty({ example: '2026-09-23T17:45:12.345Z' })
  timestamp: string;

  @ApiProperty({ example: '/workout' })
  path: string;

  @ApiProperty({ example: 'GET' })
  method: string;

  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  error: string;

  @ApiProperty({ example: 'Token is wrong' })
  message: string | string[];
}

export class ForbiddenErrorDto {
  @ApiProperty({ example: '2026-09-23T17:45:12.345Z' })
  timestamp: string;

  @ApiProperty({ example: '/auth/5' })
  path: string;

  @ApiProperty({ example: 'PATCH' })
  method: string;

  @ApiProperty({ example: 403 })
  statusCode: number;

  @ApiProperty({ example: 'Forbidden' })
  error: string;

  @ApiProperty({ example: 'Action not allowed' })
  message: string | string[];
}

export class NotFoundErrorDto {
  @ApiProperty({ example: '2026-09-23T17:45:12.345Z' })
  timestamp: string;

  @ApiProperty({ example: '/workout/999' })
  path: string;

  @ApiProperty({ example: 'GET' })
  method: string;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Not Found' })
  error: string;

  @ApiProperty({ example: 'Resource not found' })
  message: string | string[];
}

export class ConflictErrorDto {
  @ApiProperty({ example: '2026-09-23T17:45:12.345Z' })
  timestamp: string;

  @ApiProperty({ example: '/auth/signup' })
  path: string;

  @ApiProperty({ example: 'POST' })
  method: string;

  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Conflict' })
  error: string;

  @ApiProperty({ example: 'User already exists' })
  message: string | string[];
}
