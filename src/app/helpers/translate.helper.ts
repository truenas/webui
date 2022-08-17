import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';

export function translateOptions(
  translate: TranslateService,
  options: Option[],
): Option[] {
  return options.map((option) => {
    return {
      label: translate.instant(option.label),
      value: option.value,
    };
  });
}
