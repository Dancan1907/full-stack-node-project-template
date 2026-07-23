import { IsEmail, IsString, IsDefined } from "class-validator";

export class LoginDto {
  @IsDefined()
  @IsEmail()
  email?: string;

  @IsDefined()
  @IsString()
  password?: string;
}
