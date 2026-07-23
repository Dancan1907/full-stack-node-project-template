import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsDefined,
} from "class-validator";

export class RegisterDto {
  @IsDefined()
  @IsEmail()
  email?: string;

  @IsDefined()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
