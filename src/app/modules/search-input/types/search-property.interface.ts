import { EventEmitter } from '@angular/core';
import { Class } from 'utility-types';

export interface SearchProperty<T, S extends SearchSuggestionsComponent = null> {
  /**
   * Human-readable name of the property to search, e.g. 'First Name'
   */
  label: string;

  /**
   * Name of the property to search in the API, e.g. 'first_name'.
   * Nested properties are supported: 'user.first_name'.
   */
  // TODO: Add support for nested properties.
  property: keyof T;

  /**
   * Optional component to be rendered to provide suggestions.
   */
  suggestionComponent?: Class<S>;

  suggestionComponentInputs?: Partial<S>;

  /**
   * Optional functions to convert value from and to API format.
   */
  formatValue?: (value: unknown) => string;
  parseValue?: (value: string) => unknown;
}

export interface SearchSuggestionsComponent {
  suggestionSelected: EventEmitter<unknown>;
}


