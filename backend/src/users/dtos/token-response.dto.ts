import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({
    description: 'Token JWT służący do autoryzacji kolejnych żądań (nagłówek Authorization: Bearer <token>)',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJqYW4ua293YWxza2lAZXhhbXBsZS5jb20iLCJyb2xlIjoiVVNFUiIsIm5hbWUiOiJKYW4iLCJzdXJuYW1lIjoiS293YWxza2kiLCJpYXQiOjE3NTg2MzY3MTJ9.abcdefghijklmnopqrstuvwxyz1234567890',
  })
  access_token: string;
}
