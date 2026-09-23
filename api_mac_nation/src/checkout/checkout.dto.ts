import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator';

export class CheckoutLineDto {
  @IsString({ message: 'Produit invalide.' })
  itemId: string;

  @IsOptional()
  qty?: number;
}

export class CheckoutDto {
  @IsIn(['boutique', 'abonnement'], { message: 'Commande invalide.' })
  kind: 'boutique' | 'abonnement';

  @IsOptional()
  @IsString({ message: 'Commande invalide.' })
  itemId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutLineDto)
  items?: CheckoutLineDto[];

  /** Free-form on purpose: the service clamps it to 1..10 like the website does. */
  @IsOptional()
  qty?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;
}
