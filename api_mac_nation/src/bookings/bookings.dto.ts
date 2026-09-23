import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBookingDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  dateLabel?: string;

  @IsString()
  dateIso: string;

  @Matches(/^\d{2}:\d{2}$/, { message: 'Indique un créneau (HH:MM).' })
  time: string;

  @IsOptional()
  @IsIn(['salon', 'domicile', 'home'])
  place?: 'salon' | 'domicile' | 'home';

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  payNow?: boolean;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  useMembership?: boolean;
}

export class SlotsQueryDto {
  @IsString()
  date: string;

  @IsOptional()
  @IsString()
  service?: string;
}
