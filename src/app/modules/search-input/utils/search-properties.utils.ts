import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

export function searchProperties<T>(properties: SearchProperty<T>[]): SearchProperty<T>[] {
  return properties;
}

export function textProperty<T>(
  property: keyof T | string,
  label: string,
  valueSuggestions$?: Observable<Option[]>,
): SearchProperty<T> {
  return { label, property, valueSuggestions$ };
}

export function booleanProperty<T>(
  property: keyof T,
  label: string,
): SearchProperty<T> {
  return { label, property };
}

export function memoryProperty<T>(property: keyof T, label: string): SearchProperty<T> {
  // TODO: Is this better or worse than making all of this a service?
  const formatter = inject(IxFormatterService);

  return {
    label,
    property,
    formatValue: (value) => formatter.memorySizeFormatting(value as string),
    parseValue: (value) => formatter.memorySizeParsing(value),
  };
}
