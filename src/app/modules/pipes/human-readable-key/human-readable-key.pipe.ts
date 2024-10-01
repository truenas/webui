import { Pipe, PipeTransform } from '@angular/core';
import { toHumanReadableKey } from 'app/helpers/object-keys-to-human-readable.helper';

@Pipe({
  name: 'humanReadableKey',
  standalone: true,
})
export class HumanReadableKeyPipe implements PipeTransform {
  transform(value: string): string {
    return toHumanReadableKey(value);
  }
}
