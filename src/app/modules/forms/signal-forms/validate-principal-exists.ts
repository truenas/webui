import { inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { SchemaPath, validateAsync } from '@angular/forms/signals';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  findMissingPrincipals, missingPrincipalsError, PrincipalKind, principalNamesToCheck,
} from 'app/modules/forms/ix-forms/classes/directory-field.base';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import { PrincipalValue, UserDirectoryService } from 'app/services/user-directory.service';

/**
 * The existence check `ix-user-combobox`, `ix-group-combobox` and the chips fields run on their own under
 * `formControlName`, written as a signal form rule. `[formField]` gives those fields no control to attach
 * a validator to, so a field bound that way is unchecked until its schema calls this. Call it inside the
 * `form()` schema, which runs in an injection context: it injects the directory and translations itself.
 */
export function validatePrincipalExists(
  path: SchemaPath<PrincipalValue | PrincipalValue[] | null>,
  options: { kind: PrincipalKind; debounce?: number },
): void {
  const directory = inject(UserDirectoryService);
  const translate = inject(TranslateService);

  validateAsync(path, {
    // `undefined` keeps the resource idle, so an empty or id-valued field never asks.
    params: ({ value }) => {
      const current = value();
      const names = principalNamesToCheck(current, Array.isArray(current));
      return names.length ? names : undefined;
    },
    debounce: options.debounce ?? defaultDebounceTimeMs,
    factory: (names) => rxResource<string[], string[] | undefined>({
      params: names,
      stream: ({ params }) => (params ? findMissingPrincipals(directory, options.kind, params) : of([])),
    }),
    onSuccess: (missing: string[] | undefined, { value }) => {
      if (!missing?.length) {
        return null;
      }
      return missingPrincipalsError(translate, options.kind, Array.isArray(value()), missing);
    },
    // A failed lookup says nothing about the name; `findMissingPrincipals` already answers "exists" for one.
    onError: () => null,
  });
}
