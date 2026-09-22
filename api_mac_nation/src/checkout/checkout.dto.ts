import { IsIn, IsOptional, IsString } from 'class-validator';

export class CheckoutDto {
  @IsIn(['boutique', 'abonnement'], { message: 'Commande invalide.' })
  kind: 'boutique' | 'abonnement';

  @IsString({ message: 'Commande invalide.' })
  itemId: string;

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
