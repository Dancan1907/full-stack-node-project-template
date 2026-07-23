import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request as Req,
} from "@nestjs/common";
import { Request } from "express";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RefreshGuard } from "../../common/guards/refresh.guard";

@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(RefreshGuard)
  @Post("refresh")
  async refresh(@Req() req: Request) {
    const refreshToken = req.body.refresh_token as string;
    // Type assertion because we know the guard attaches this shape
    const user = req.user as { userId: string; email: string; role: string };
    return this.authService.refreshTokens(user.userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@Req() req: Request) {
    const user = req.user as { userId: string; email: string; role: string };
    return this.authService.logout(user.userId);
  }
}
