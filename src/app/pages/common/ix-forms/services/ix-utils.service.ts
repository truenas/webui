import { Injectable } from '@angular/core';
import { ParseAndFormatIxInput } from 'app/interfaces/parsed-and-formatted.interface';
import { StorageService } from 'app/services';

@Injectable()
export class IxFormatterService {
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
    const memoryInNumbers = this.storageService.convertHumanStringToNum(value);
    if (Number.isNaN(memoryInNumbers)) {
      console.error(memoryInNumbers);
    } else if (value.replace(/\s/g, '').match(/[^0-9]/g) === null) {
      formatted = this.storageService.convertBytestoHumanReadable(value.replace(/\s/g, ''), 0);
    } else {
      formatted = this.storageService.humanReadable;
    }
    parsed = memoryInNumbers.toString();
    return { parsed, formatted };
  };
}
