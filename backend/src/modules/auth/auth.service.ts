// NestJS core decorators and exceptions
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
// JwtService for signing tokens
import { JwtService } from "@nestjs/jwt";
// Prisma service to interact with database
import { PrismaService } from "../prisma/prisma.service";
// Argon2 for password hashing and verification
import * as argon2 from "argon2";
// DTOs
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
// Prisma types (User, Role)
import { User, Role } from "@prisma/client";
// Pino logger for structured logging of critical auth events
import { Logger } from "nestjs-pino";

@Injectable() // Marks this class as injectable in NestJS DI container
export class AuthService {
  // Inject PrismaService, JwtService, and the Pino Logger
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly logger: Logger, // <-- Inject logger
  ) {}

  // ---------- REGISTER ----------
  async register(dto: RegisterDto) {
    this.logger.log(`Registration attempt for email: ${dto.email}`);

    // 1. Check if user already exists with this email
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      this.logger.warn(
        `Registration failed: email ${dto.email} already exists`,
      );
      // throw ConflictException (HTTP 409) because email is already taken
      throw new ConflictException("Email already registered");
    }

    // 2. Hash the plain password using argon2
    // argon2.hash() automatically generates a salt and uses recommended parameters
    const hashedPassword = await argon2.hash(dto.password!);

    // 3. Create the user in the database
    // We set default role to USER, isActive true, emailVerified false
    const user = await this.prisma.user.create({
      data: {
        email: dto.email!,
        password: hashedPassword,
        name: dto.name,
        role: Role.USER,
        isActive: true,
        emailVerified: false,
      },
    });

    // 4. Generate access and refresh tokens for this user
    const tokens = await this.generateTokens(user);

    // 5. Store the refresh token in the user's record (for later validation)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refresh_token },
    });

    this.logger.log(
      `User registered successfully: ${user.email} (ID: ${user.id})`,
    );

    // 6. Remove password and refreshToken from the user object before returning
    // Using destructuring to exclude them
    const { password, refreshToken, ...result } = user;
    // Return user info plus tokens
    return {
      user: result,
      ...tokens,
    };
  }

  // ---------- LOGIN ----------
  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);

    // 1. Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      this.logger.warn(`Login failed: email ${dto.email} not found`);
      // If no user, return generic Unauthorized to avoid leaking info
      throw new UnauthorizedException("Invalid credentials");
    }

    // 2. Check if account is active
    if (!user.isActive) {
      this.logger.warn(`Login failed: account ${dto.email} is disabled`);
      throw new UnauthorizedException("Account is disabled");
    }

    // 3. Verify password using argon2.verify()
    // This compares the provided password with the stored hash
    const isValid = await argon2.verify(user.password, dto.password!);
    if (!isValid) {
      this.logger.warn(`Login failed: invalid password for ${dto.email}`);
      throw new UnauthorizedException("Invalid credentials");
    }

    // 4. Generate new tokens
    const tokens = await this.generateTokens(user);

    // 5. Update user with new refresh token (this replaces any previous one)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refresh_token },
    });

    this.logger.log(`User logged in: ${user.email} (ID: ${user.id})`);

    // 6. Return user info (without sensitive fields) and tokens
    const { password, refreshToken, ...result } = user;
    return {
      user: result,
      ...tokens,
    };
  }

  // ---------- REFRESH TOKEN ----------
  async refreshTokens(userId: string, refreshToken: string) {
    this.logger.log(`Refresh token attempt for user ID: ${userId}`);

    // 1. Find user by ID
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    // If user doesn't exist or has no refresh token stored, reject
    if (!user || !user.refreshToken) {
      this.logger.warn(
        `Refresh failed: no valid refresh token for user ${userId}`,
      );
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 2. Check if the provided refresh token matches the stored one
    if (user.refreshToken !== refreshToken) {
      this.logger.warn(
        `Refresh failed: refresh token mismatch for user ${userId}`,
      );
      throw new UnauthorizedException("Invalid refresh token");
    }

    // 3. Generate new tokens (rotate)
    const tokens = await this.generateTokens(user);

    // 4. Update user with the new refresh token (rotate)
    // This invalidates the old refresh token (one-time use)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: tokens.refresh_token },
    });

    this.logger.log(`Refresh successful for user ${userId}`);

    // 5. Return new tokens
    return tokens;
  }

  // ---------- LOGOUT ----------
  async logout(userId: string) {
    this.logger.log(`Logout for user ID: ${userId}`);

    // Remove the refresh token from the database so it cannot be used again
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    this.logger.log(`User ${userId} logged out successfully`);
    return { success: true };
  }

  // ---------- VALIDATE USER (for LocalStrategy) ----------
  async validateUser(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      this.logger.warn(`Validation failed: user ${email} not found`);
      return null;
    }

    // Verify password
    const isValid = await argon2.verify(user.password, password);
    if (!isValid) {
      this.logger.warn(`Validation failed: password mismatch for ${email}`);
      return null;
    }

    // Return user without password
    const { password: _, ...result } = user;
    return result;
  }

  // ---------- PRIVATE: GENERATE TOKENS ----------
  private async generateTokens(user: User) {
    // Payload contains user id, email, and role (for role-based access)
    const payload = { sub: user.id, email: user.email, role: user.role };

    // Sign access token with shorter expiry and access secret
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET, // Use access secret
        expiresIn: "15m", // 15 minutes
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET, // Different secret for refresh
        expiresIn: "7d", // 7 days
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
    };
  }
}
