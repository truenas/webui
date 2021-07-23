import { Bootenv } from 'app/interfaces/bootenv.interface';

export type BootenvRow = {
  hideCheckbox: boolean;
  rawspace: string;
} & Bootenv;
