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
import { TokenResponseDto } from "./dto/token.dto";
import { Public } from "../../common/decorators/public.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RefreshGuard } from "../../common/guards/refresh.guard";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from "@nestjs/swagger";

@ApiTags("Authentication") // Groups endpoints under "Authentication" in Swagger
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({
    status: 201,
    description: "User registered successfully",
    type: TokenResponseDto, // Swagger will show the shape of the response
  })
  @ApiResponse({ status: 409, description: "Email already registered" })
  @ApiResponse({ status: 400, description: "Validation failed" })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({
    status: 200,
    description: "Login successful",
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(RefreshGuard)
  @Post("refresh")
  @ApiOperation({ summary: "Refresh access token using refresh token" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        refresh_token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "New tokens generated",
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refresh(@Req() req: Request) {
    const refreshToken = req.body.refresh_token as string;
    const user = req.user as { userId: string; email: string; role: string };
    return this.authService.refreshTokens(user.userId, refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  @ApiBearerAuth("JWT-auth") // This tells Swagger to require Bearer token
  @ApiOperation({ summary: "Logout and invalidate refresh token" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async logout(@Req() req: Request) {
    const user = req.user as { userId: string; email: string; role: string };
    return this.authService.logout(user.userId);
  }
}
