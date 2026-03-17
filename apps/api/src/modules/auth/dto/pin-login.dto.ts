import { IsString, IsOptional } from 'class-validator';

export class PinLoginDto {
  @IsString()
  pin: string;

  @IsString()
  @IsOptional()
  branchId?: string;
}
