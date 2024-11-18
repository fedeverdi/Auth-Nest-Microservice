import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class TokenDto {
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  token: string | null;
}
