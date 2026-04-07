import { ApiProperty } from '@nestjs/swagger';

export class AdminHealthDto {
  @ApiProperty({ example: true })
  ok!: boolean;

  @ApiProperty({ example: 'admin' })
  scope!: string;
}
