import { IsArray, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterPushDto {
  @IsString()
  @MinLength(20)
  token!: string;

  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: string;
}

export class UnregisterPushDto {
  @IsString()
  @MinLength(20)
  token!: string;
}

export class SendPushDto {
  @IsString()
  @MinLength(2)
  title!: string;

  @IsString()
  @MinLength(2)
  body!: string;

  @IsIn(['general', 'targeted'])
  audience!: 'general' | 'targeted';

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clientIds?: string[];
}
