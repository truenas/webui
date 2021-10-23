import { Injectable } from '@angular/core';
import { ParseAndFormatIxInput } from 'app/interfaces/parsed-and-formatted.interface';
import { StorageService } from 'app/services';

@Injectable()
export class IxUtilsService {
  constructor(
    private storageService: StorageService,
  ) {}

  memorySizeParsingAndFormatting: ParseAndFormatIxInput = (value: string) => {
    value = value.toString();
    if (!value) {
      return { parsed: '', formatted: '' };
    }
    let parsed = '';
    let formatted = '';
    const vm_memory_requested = this.storageService.convertHumanStringToNum(value);
    if (Number.isNaN(vm_memory_requested)) {
      console.error(vm_memory_requested);
    } else if (value.replace(/\s/g, '').match(/[^0-9]/g) === null) {
      formatted = this.storageService.convertBytestoHumanReadable(value.replace(/\s/g, ''), 0);
    } else {
      formatted = this.storageService.humanReadable;
    }
    parsed = vm_memory_requested.toString();
    return { parsed, formatted };
  };
}
