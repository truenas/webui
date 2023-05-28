import { TranslateService } from '@ngx-translate/core';
import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { Choices } from 'app/interfaces/choices.interface';
import { MapOption, Option } from 'app/interfaces/option.interface';

export function mapToOptions(optionMap: Map<string, string>, translate: TranslateService): Option[] {
  return Array.from(optionMap.entries()).map(([value, label]) => ({ label: translate.instant(label), value }));
}

/**
 * Convert choices to options
 * @returns Option[]
 */
export function choicesToOptions(): OperatorFunction<Choices, Option[]> {
  return map((choices) => {
    return Object.entries(choices).map(([value, label]) => ({ label, value }));
  });
}

export function arrayToOptions(): OperatorFunction<MapOption[], Option[]> {
  return map((choices) => {
    return choices.map(([value, label]) => ({ label, value }));
  });
}

export function singleArrayToOptions(): OperatorFunction<(string | number)[], Option[]> {
  return map((choices) => {
    return choices.map((choice) => ({ label: String(choice), value: choice }));
  });
}

export function idNameArrayToOptions(): OperatorFunction<{ id: number; name: string }[], Option[]> {
  return map((options) => {
    return options.map((option) => ({ label: option.name, value: option.id }));
  });
}

export function tagArrayToOptions(): OperatorFunction<{ tag: number }[], Option[]> {
  return map((options) => {
    return options.map((option) => ({ label: String(option.tag), value: option.tag }));
  });
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
