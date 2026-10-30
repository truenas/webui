import { Rule, RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import untypedRule from './no-unmarked-async-field-write.mjs';

// The rule is plain JavaScript, so it comes in untyped.
const rule = untypedRule as Rule.RuleModule;

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser },
});

function component(body: string): string {
  return `@Component({ template: '' })\nclass TestComponent {\n${body}\n}`;
}

ruleTester.run('no-unmarked-async-field-write', rule, {
  valid: [
    // Marked for check in the same callback.
    component(`
      protected value = '';
      load(): void {
        this.api.call('x').subscribe((value) => {
          this.value = value;
          this.cdr.markForCheck();
        });
      }
    `),
    // A signal write re-renders the view too.
    component(`
      protected value = '';
      protected isLoading = signal(true);
      load(): void {
        this.api.call('x').subscribe((value) => {
          this.value = value;
          this.isLoading.set(false);
        });
      }
    `),
    // Marked in a sibling observer handler (`complete` runs straight after the last `next`).
    component(`
      protected value = '';
      load(): void {
        this.api.call('x').subscribe({
          next: (value) => { this.value = value; },
          complete: () => this.cdr.markForCheck(),
        });
      }
    `),
    // A field typed as a writable signal counts as a signal.
    component(`
      protected value = '';
      protected isLoading: WritableSignal<boolean>;
      load(): void {
        this.api.call('x').subscribe((value) => {
          this.value = value;
          this.isLoading.set(false);
        });
      }
    `),
    // Marked through a method of the same class.
    component(`
      protected value = '';
      load(): void {
        this.api.call('x').subscribe((value) => {
          this.value = value;
          this.refresh();
        });
      }
      private refresh(): void {
        this.cdr.markForCheck();
      }
    `),
    // Private fields are never read by the template.
    component(`
      private value = '';
      load(): void {
        setTimeout(() => { this.value = 'x'; });
      }
    `),
    // A form control changes because of a template event, which already marks the view.
    component(`
      protected showField = false;
      listen(): void {
        this.form.controls.mode.valueChanges.pipe(take(1)).subscribe((mode) => {
          this.showField = mode === 'custom';
        });
      }
    `),
    // A synchronous write is picked up by the change detection already running.
    component(`
      protected value = '';
      set(): void {
        this.value = 'x';
      }
    `),
    // Not a component.
    '@Injectable()\nclass TestService {\n  value = 0;\n  load(): void { this.api.call(method).subscribe((v) => { this.value = v; }); }\n}',
  ],
  invalid: [
    {
      // `error` never runs after a successful `next`, so marking there does not cover `next`.
      code: component(`
        protected value = '';
        load(): void {
          this.api.call('x').subscribe({
            next: (value) => { this.value = value; },
            error: () => this.cdr.markForCheck(),
          });
        }
      `),
      errors: [{ messageId: 'unmarkedWrite', data: { field: 'value' } }],
    },
    {
      code: component(`
        protected count = 0;
        listen(): void {
          this.events$.subscribe(() => { this.count++; });
        }
      `),
      errors: [{ messageId: 'unmarkedWrite', data: { field: 'count' } }],
    },
    {
      // `.set()` on a Map is not a signal write.
      code: component(`
        protected value = '';
        private cache = new Map();
        load(): void {
          this.api.call('x').subscribe((value) => {
            this.value = value;
            this.cache.set('x', value);
          });
        }
      `),
      errors: [{ messageId: 'unmarkedWrite', data: { field: 'value' } }],
    },
    {
      code: component(`
        protected value = '';
        load(): void {
          this.api.call('x').subscribe((value) => {
            this.value = value;
          });
        }
      `),
      errors: [{ messageId: 'unmarkedWrite', data: { field: 'value' } }],
    },
    {
      code: component(`
        isOpen = false;
        open(): void {
          setTimeout(() => { this.isOpen = true; }, 100);
        }
      `),
      errors: [{ messageId: 'unmarkedWrite', data: { field: 'isOpen' } }],
    },
    {
      code: component(`
        protected width = 0;
        listen(): void {
          document.addEventListener('mousemove', (event) => { this.width = event.clientX; });
        }
      `),
      errors: [{ messageId: 'unmarkedWrite', data: { field: 'width' } }],
    },
    {
      code: component(`
        protected data = null;
        load(): void {
          fetch('/x').then((response) => { this.data = response; });
        }
      `),
      errors: [{ messageId: 'unmarkedWrite', data: { field: 'data' } }],
    },
  ],
});
