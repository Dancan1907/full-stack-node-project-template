export class TokenResponseDto {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number; // seconds until access token expires
}
