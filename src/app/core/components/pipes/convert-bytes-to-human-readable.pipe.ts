import { Pipe, PipeTransform } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';

@UntilDestroy()
@Pipe({
  name: 'convertBytestoHumanReadable',
  pure: false,
})
export class ConvertBytesToHumanReadablePipe implements PipeTransform {
  constructor(private formatter: IxFormatterService) {}

  transform(value: number): string {
    return this.formatter.convertBytestoHumanReadable(value);
  }
}
