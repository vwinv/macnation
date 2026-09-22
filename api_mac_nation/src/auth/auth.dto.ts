import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Indique ton nom.' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Indique ton téléphone.' })
  phone: string;

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined,
  )
  @ValidateIf((_, value) => Boolean(value))
  @IsEmail({}, { message: 'Indique un e-mail valide.' })
  email?: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
  @MaxLength(72, { message: 'Le mot de passe est trop long.' })
  password: string;
}

export class LoginDto {
  @IsString()
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'Indique ton mot de passe.' })
  password: string;
}
