import { ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { setupSwagger } from './common/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_URL'),
    credentials: true
  })

  app.use((req, res, next) => {
    res.removeHeader('x-powered-by')
    res.removeHeader('date')
    next()
  })

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  setupSwagger(app);

  await app.listen(config.getOrThrow<number>('PORT'));
}
bootstrap();
