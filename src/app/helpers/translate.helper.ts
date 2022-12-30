import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';

export function translateOptions<T extends Option>(
  translate: TranslateService,
  options: T[],
): T[] {
  return options.map((option) => {
    return {
      ...option,
      label: translate.instant(option.label),
    };
  });
}
