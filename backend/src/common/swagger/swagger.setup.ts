import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const BEARER_AUTH = 'access-token';

const TITLE = 'Workout Tracker API';

const DESCRIPTION = `REST API aplikacji do śledzenia treningów siłowych: treningi, szablony, plany, kalendarz, statystyki i funkcje AI.

## Autoryzacja
Większość endpointów wymaga tokenu JWT w nagłówku \`Authorization: Bearer <token>\`.
Token zwracają **POST /auth/signup** i **POST /auth/signin**.
Kliknij **Authorize** i wklej sam token (bez słowa "Bearer"), aby wywoływać chronione endpointy z tego widoku.

## Role
- **USER**: domyślna rola, dostęp do własnych zasobów (treningi, szablony, plany, statystyki).
- **ADMIN**: dodatkowo zarządza globalną bazą ćwiczeń i może usuwać dowolnych użytkowników.

## Format błędów
Każdy błąd ma spójny format JSON:
\`\`\`json
{
  "statusCode": 404,
  "code": "WORKOUT_NOT_FOUND",
  "message": "Workout not found",
  "params": {}
}
\`\`\`
- \`code\` to stały identyfikator błędu, na podstawie którego frontend wyświetla przetłumaczony komunikat (PL/EN), a \`params\` zawiera wartości do wstawienia w ten komunikat.
- \`message\` jest po angielsku i służy do debugowania.
- Błędy walidacji danych wejściowych mają kod \`VALIDATION_FAILED\` i zwracają w \`message\` tablicę komunikatów, po jednym na każde niepoprawne pole.
- Identyfikator w ścieżce, który nie jest UUID, daje błąd 400 z kodem \`INVALID_ID\` (\`params.param\` to nazwa parametru).
- Błędy bez własnego kodu (np. nieistniejąca ścieżka) dostają kod z nazwy statusu HTTP, np. \`NOT_FOUND\`.

## Język AI
Generowanie planu przyjmuje pole \`language\` (\`pl\` lub \`en\`), w którym AI nazywa plan i treningi.`;

const TAGS: [string, string][] = [
  ['auth', 'Rejestracja, logowanie i zarządzanie kontem użytkownika'],
  [
    'exercise',
    'Globalna baza ćwiczeń (katalog dostępny dla wszystkich użytkowników)',
  ],
  [
    'workout',
    'Zarejestrowane treningi użytkownika wraz z ćwiczeniami i seriami',
  ],
  ['template', 'Szablony treningowe wielokrotnego użytku'],
  ['plan', 'Plany treningowe grupujące szablony (np. plan tygodniowy)'],
  ['planner', 'Harmonogram treningów w kalendarzu'],
  ['stats', 'Statystyki, rekordy życiowe i postępy użytkownika'],
  ['ai', 'Funkcje wspierane sztuczną inteligencją (Gemini)'],
  ['health', 'Stan aplikacji dla monitoringu i reverse proxy'],
];

export function setupSwagger(app: INestApplication): void {
  const builder = new DocumentBuilder()
    .setTitle(TITLE)
    .setDescription(DESCRIPTION)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT z /auth/signin lub /auth/signup',
      },
      BEARER_AUTH,
    );

  for (const [name, description] of TAGS) {
    builder.addTag(name, description);
  }

  const document = SwaggerModule.createDocument(app, builder.build(), {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });

  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: `${TITLE} Docs`,
    jsonDocumentUrl: 'api/docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
