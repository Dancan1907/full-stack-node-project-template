import { Module } from "@nestjs/common";
// Import ConfigModule for global configuration
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./modules/prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";

@Module({
  imports: [
    // ConfigModule loads .env variables globally
    ConfigModule.forRoot({
      isGlobal: true, // makes ConfigService available everywhere
    }),
    PrismaModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
