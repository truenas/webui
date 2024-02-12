import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';

export interface SearchProperty<T> {
  /**
   * Human-readable name of the property to search, e.g. 'First Name'
   */
  label: string;

  /**
   * Name of the property to search in the API, e.g. 'first_name'.
   * Nested properties are supported: 'user.first_name'.
   */
  // TODO: Add support for nested properties.
  property: keyof T | string;
  propertyType: PropertyType;

  valueSuggestions$?: Observable<Option[]>;
  enumMap?: Map<unknown, string>;
  /**
   * Optional functions to convert value from and to API format.
   */
  formatValue?: (value: unknown) => string;
  parseValue?: (value: string) => unknown;
}

export enum PropertyType {
  Text = 'text',
  Date = 'date',
  Boolean = 'boolean',
  Memory = 'memory',
}
