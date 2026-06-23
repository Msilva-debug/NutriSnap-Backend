import { ApiProperty } from '@nestjs/swagger';

export class SaveMealHistoryNoteDto {
  @ApiProperty({
    example: '2026-06-23',
    description: 'Fecha de la nota en formato YYYY-MM-DD',
  })
  date: string;

  @ApiProperty({
    example: 'Hoy senti mas hambre despues del almuerzo.',
    description: 'Nota del usuario sobre sus comidas del dia',
  })
  note: string;
}
