import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ReceivePurchaseOrderItemDto {
  @IsString()
  id: string; // The orderItem ID

  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  receivedQty: number;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderItemDto)
  items: ReceivePurchaseOrderItemDto[];
}
