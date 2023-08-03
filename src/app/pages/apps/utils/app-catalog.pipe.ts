import { Pipe, PipeTransform } from '@angular/core';
import { officialCatalog } from 'app/constants/catalog.constants';
import { capitalizeFirstLetter } from 'app/helpers/text.helpers';

@Pipe({
  name: 'appCatalog',
  standalone: true,
})
export class AppCatalogPipe implements PipeTransform {
  transform(value: string): string {
    if (value.toLowerCase() === officialCatalog.toLowerCase()) {
      return 'TrueNAS';
    }

    return capitalizeFirstLetter(value);
  }
}
