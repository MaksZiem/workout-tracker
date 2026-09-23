import { ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true
  })

  app.use((req, res, next) => {
    res.removeHeader('x-powered-by')
    res.removeHeader('date')
    next()
  })

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Workout Tracker API')
    .setDescription(
      `REST API aplikacji do śledzenia treningów siłowych.

## Autoryzacja
Większość endpointów wymaga tokenu JWT przesłanego w nagłówku \`Authorization: Bearer <token>\`.
Token uzyskuje się z endpointu **POST /auth/signin** lub **POST /auth/signup**.
Kliknij przycisk **Authorize** i wklej sam token (bez słowa "Bearer") aby przetestować chronione endpointy bezpośrednio z tego widoku.

## Role
- **USER** - domyślna rola, dostęp do własnych zasobów (treningi, szablony, plany, statystyki).
- **ADMIN** - dodatkowo zarządza globalną bazą ćwiczeń oraz może usuwać dowolnych użytkowników.

## Format błędów
Każdy błąd zwracany jest w spójnym formacie JSON:
\`\`\`json
{
  "timestamp": "2026-09-23T17:45:12.345Z",
  "path": "/workout/123",
  "method": "GET",
  "statusCode": 404,
  "error": "Not Found",
  "message": "Workout not found"
}
\`\`\`
Błędy walidacji danych wejściowych (400) zwracają w polu \`message\` tablicę komunikatów - po jednym na każde niepoprawne pole.`,
    )
    .setVersion('1.0.0')
    .setContact('Workout Tracker', '', 'mtziembicki@gmail.com')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Wklej token JWT otrzymany z /auth/signin lub /auth/signup',
      },
      'access-token',
    )
    .addTag('auth', 'Rejestracja, logowanie i zarządzanie kontem użytkownika')
    .addTag('exercise', 'Globalna baza ćwiczeń (katalog dostępny dla wszystkich użytkowników)')
    .addTag('workout', 'Zarejestrowane treningi użytkownika wraz z ćwiczeniami i seriami')
    .addTag('template', 'Szablony treningowe wielokrotnego użytku')
    .addTag('plan', 'Plany treningowe grupujące szablony (np. plan tygodniowy)')
    .addTag('planner', 'Harmonogram treningów w kalendarzu')
    .addTag('stats', 'Statystyki, rekordy życiowe i postępy użytkownika')
    .addTag('ai', 'Funkcje wspierane sztuczną inteligencją (Gemini)')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'Workout Tracker API Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  await app.listen(3000);
}
bootstrap();
