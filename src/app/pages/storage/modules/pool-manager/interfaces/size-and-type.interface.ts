import { DiskType } from 'app/enums/disk-type.enum';
import { SelectOption } from 'app/interfaces/option.interface';

export type SizeAndType = [string, DiskType];

export interface SizeAndTypeOption extends Omit<SelectOption, 'value'> {
  value: SizeAndType;
}
