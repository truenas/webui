import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';

export function mapToOptions(optionMap: Map<string, string>, translate: TranslateService): Option[] {
  return Array.from(optionMap.entries()).map(([value, label]) => ({ label: translate.instant(label), value }));
}

/**
 * @usage
 * valueToLabel(options)(value)
 */
export function findLabelsByValue(options: Option[]): (value: string) => string | undefined {
  return (value: string): string | undefined => {
    const selectedOption = options.find((option) => option.value === value);
    return selectedOption?.label;
  };
}

export function generateOptionsRange(start: number, end: number): Option[] {
  return Array.from({ length: end - start + 1 }, (_, index) => {
    const value = start + index;
    return { label: String(value), value };
  });
}
