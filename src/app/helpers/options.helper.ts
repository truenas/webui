import { OperatorFunction } from 'rxjs';
import { map } from 'rxjs/operators';
import { Choices } from 'app/interfaces/choices.interface';
import { MapOption, Option } from 'app/interfaces/option.interface';

export function mapToOptions(map: Map<string, string>): Option[] {
  return Array.from(map.entries()).map(([value, label]) => ({ label, value }));
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

export function singleArrayToOptions(): OperatorFunction<string[], Option[]> {
  return map((choices) => {
    return choices.map((choice) => ({ label: choice, value: choice }));
  });
}

export function idNameArrayToOptions(): OperatorFunction<{ id: number; name: string }[], Option[]> {
  return map((options) => {
    return options.map((option) => ({ label: option.name, value: option.id }));
  });
}
