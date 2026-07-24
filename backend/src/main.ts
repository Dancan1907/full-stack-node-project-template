import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { Logger } from "nestjs-pino"; // Import the logger type
import * as express from "express";
import * as path from "path";

async function bootstrap() {
  // Create the app with the Pino logger enabled
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // Don't log until the logger is ready
  });

  // Use the Pino logger for all NestJS internal logs
  app.useLogger(app.get(Logger));

  // Serve static files from uploads folder
  const uploadsPath = path.join(process.cwd(), "uploads");
  app.use("/uploads", express.static(uploadsPath));

  // ─── Global prefix ──────────────────────────────────────────────
  app.setGlobalPrefix("api/v1");

  // ─── Global validation pipe ──────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // ─── CORS ──────────────────────────────────────────────────────
  app.enableCors();

  // ─── Swagger / OpenAPI documentation ─────────────────────────
  const config = new DocumentBuilder()
    .setTitle("Full-Stack Template API")
    .setDescription("Authentication and user management API")
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // ─── Start server ─────────────────────────────────────────────
  const port = process.env.PORT || 3001;
  await app.listen(port);
  // Use the injected logger instead of console.log
  const logger = app.get(Logger);
  logger.log(`🚀 Backend running on http://localhost:${port}`);
  logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
