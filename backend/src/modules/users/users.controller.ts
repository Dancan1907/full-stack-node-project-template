// backend/src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangeRoleDto } from "./dto/change-role.dto";
import { UserResponseDto } from "./dto/user-response.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "@prisma/client";

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller("users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN) // All endpoints in this controller require ADMIN role
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Get all users (admin only)" })
  @ApiResponse({
    status: 200,
    description: "List of all users",
    type: [UserResponseDto],
  })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a user by ID (admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User found",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a user (admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "User updated",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Patch(":id/role")
  @ApiOperation({ summary: "Change user role (admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({
    status: 200,
    description: "Role changed",
    type: UserResponseDto,
  })
  @ApiResponse({ status: 404, description: "User not found" })
  async changeRole(@Param("id") id: string, @Body() dto: ChangeRoleDto) {
    return this.usersService.changeRole(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT) // 204 No Content
  @ApiOperation({ summary: "Delete a user (admin only)" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiResponse({ status: 204, description: "User deleted" })
  @ApiResponse({ status: 404, description: "User not found" })
  async remove(@Param("id") id: string) {
    await this.usersService.remove(id);
  }
}
