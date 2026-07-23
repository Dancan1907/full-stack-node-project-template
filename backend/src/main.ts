import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
// Import ValidationPipe for DTO validation
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  // Create the Nest application instance
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all routes: /api/v1/...
  app.setGlobalPrefix("api/v1");

  // Use global validation pipe
  // whitelist: strip properties not defined in DTOs
  // transform: automatically transform payloads to DTO instances
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable CORS for frontend (allow requests from different origin)
  app.enableCors();

  // Start server on port 3001
  await app.listen(3001);
  console.log(`🚀 Backend running on http://localhost:3001`);
}
bootstrap();
