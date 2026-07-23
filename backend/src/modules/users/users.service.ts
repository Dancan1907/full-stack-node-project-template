// backend/src/modules/users/users.service.ts
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { User } from "@prisma/client";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find all users (excluding passwords and refresh tokens)
   */
  async findAll(): Promise<Omit<User, "password" | "refreshToken">[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password and refreshToken
      },
    });
  }

  /**
   * Find a single user by ID (exclude sensitive fields)
   */
  async findOne(id: string): Promise<Omit<User, "password" | "refreshToken">> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Update a user (only provided fields)
   */
  async update(
    id: string,
    dto: UpdateUserDto,
  ): Promise<Omit<User, "password" | "refreshToken">> {
    // Check if user exists
    await this.findOne(id); // will throw if not found

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        // Only include fields that are provided
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.role !== undefined && { role: dto.role }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  /**
   * Change a user's role (convenience method)
   */
  async changeRole(
    id: string,
    dto: ChangeRoleDto,
  ): Promise<Omit<User, "password" | "refreshToken">> {
    return this.update(id, { role: dto.role });
  }

  /**
   * Delete (soft delete) a user – set isActive to false
   * Or we can hard delete (remove from DB). We'll do hard delete for simplicity.
   */
  async remove(id: string): Promise<void> {
    // Check if user exists
    await this.findOne(id);

    await this.prisma.user.delete({
      where: { id },
    });
  }
}
