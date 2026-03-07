import { IsString } from 'class-validator';

export class PinLoginDto {
  @IsString()
  pin: string;

  @IsString()
  branchId: string;
}
