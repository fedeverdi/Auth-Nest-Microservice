import { IsString, IsOptional, IsNotEmpty, Length } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Full name cannot be empty' })
  fullName?: string;

  @IsString()
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @Length(8, 128, { message: 'Password must be between 8 and 128 characters' })
  password?: string;

  @IsString()
  @IsOptional()
  email?: string;
}
