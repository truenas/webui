import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';

export function mapToOptions(optionMap: Map<string, string>, translate: TranslateService): Option[] {
  return Array.from(optionMap.entries()).map(([value, label]) => ({ label: translate.instant(label), value }));
}

/**
 * @usage
 * valueToLabel(options)(value)
 */
export function findLabelsByValue(options: Option[]): (value: string) => string {
  return (value: string): string => {
    const selectedOption = options.find((option) => option.value === value);
    return selectedOption?.label;
  };
}
