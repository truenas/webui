import { TranslateService } from '@ngx-translate/core';
import { Option } from 'app/interfaces/option.interface';

export function mapToOptions<T>(optionMap: Map<T, string>, translate: TranslateService): Option<T>[] {
  return Array.from(optionMap.entries()).map(([value, label]) => ({ label: translate.instant(label), value }));
}

export function mapToOptionsWithTooltips<T>(
  optionMap: Map<T, string>,
  tooltipMap: Map<T, string>,
  translate: TranslateService,
): Option<T>[] {
  return Array.from(optionMap.entries()).map(([value, label]) => {
    const rawTooltip = tooltipMap.get(value);
    return {
      label: translate.instant(label),
      value,
      tooltip: rawTooltip ? translate.instant(rawTooltip) : undefined,
    };
  });
}

export function mapToOptionsWithHoverTooltips<T>(
  optionMap: Map<T, string>,
  tooltipMap: Map<T, string>,
  translate: TranslateService,
): Option<T>[] {
  return Array.from(optionMap.entries()).map(([value, label]) => {
    const rawTooltip = tooltipMap.get(value);
    return {
      label: translate.instant(label),
      value,
      hoverTooltip: rawTooltip ? translate.instant(rawTooltip) : undefined,
    };
  });
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
