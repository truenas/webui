import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';

/**
 * @deprecated Prefer keeping options as a map and using mapToOptions instead.
 */
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
