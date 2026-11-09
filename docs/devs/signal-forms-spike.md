# Signal forms spike (NAS-145110)

Part of epic NAS-145108. Tested on Angular 22.2.1 and `@truenas/ui-components` 0.8.17.

## Decision: adopt in stages, pilot first

Signal forms work, and they make conditional forms nicer to write, but they fix no user-visible problem today. A full
migration up front isn't justified: it needs a library release and about 25 engineer-weeks across existing forms, and
Reactive Forms is not deprecated. The spike's first recommendation was to defer on those grounds. We decided to go ahead
in stages instead, so the cost only grows if a pilot on real forms shows it's worth paying.

- **First:** ship library support (NAS-145170), then the webui infrastructure (NAS-145112).
- **Then decide:** pilot on 3-5 painful conditional forms (NAS-145171), and compare real bug counts and diff sizes before
  committing to more.
- **Don't plan** a bulk migration of simple forms (NAS-145113), or a full ban on Reactive Forms. The epic rules out
  rewrites with no benefit, and a simple form gains nothing. NAS-145117 is rescoped to cover new forms only.
- **Independent:** NAS-145111 (`Required<>` casts) doesn't depend on any of this.

## The questions

### Do tn-* controls work unchanged?

**Values yes, field chrome no.**

| Behaviour with `[formField]` | Result |
|---|---|
| Value, dirty, touched and disabled, on all 18 library CVAs | Works unchanged |
| webui composite CVAs (`ix-star-rating`, `ix-permissions`; 2 of 10 tried) | Work unchanged |
| `tn-form-field` error message | **Never shows.** It re-syncs from `control.events ?? statusChanges`, which `InteropNgControl` lacks |
| `data-test` derived from the control name | **Disappears.** `input-name` is gone because the interop control has no `name`, and removing one is an E2E breaking change |
| Dismissing a server error | Needs `setErrors`, which the interop control also lacks |
| `tn-form-list` / `tn-form-errors` `[control]` | Takes an `AbstractControl`, so list-level errors have no signal path |
| `<input name>` | Overwritten with a generated `ng.form0.name` |

The library fix looks small: the interop getters are signal-backed, so an `effect` in `tn-form-field` can replace the
subscription, and the field name is available for `controlTestId`. `SignalFieldBridgeDirective` (20 lines) proves the
behaviour is reachable, but it mutates an Angular object, so it isn't the fix to ship.

### How do ix-form, the Save button and server errors map?

| Piece | Mapping | Cost |
|---|---|---|
| Side-panel Save (`canSubmit`, `submit`, `isBusy`, `isSubmitting`) | Plain callables, so it fits as is | None |
| `<ix-form>` | Works **unchanged** given an empty `FormGroup`, with validity through `[extraDisabled]` and `hasUnsavedChanges` overridden. Snackbar, loading, retry and close all keep working | A shim. It needs a real API before wide use, and `changedValues` is empty on this path |
| `FormErrorHandlerService` | Takes a `FormGroup`, so it needs a signal equivalent | About 75 lines (`SignalServerErrors`) |
| `ix-form-renderer` | A schema can be generated, and `visibleWhen` maps to `hidden()`. Definitions carry `ValidatorFn`s, which need adapting | Moderate. Only the schema shape was tried, not the component |

Angular's own `submit()` errors are not a drop-in: they clear only when their own field changes. That brings back the
stuck-Save bug `retirePinnedErrorsOnNextEdit` fixed, where a verdict is answered from another field (Force on an
unreachable NTP server). Validation message keys also differ: a raw `minLength` reaches the user, because the resolver
translates `minlength`, so `tn-form-field-errors.provider.ts` needs new cases.

### Do the harnesses and Jest setup work zoneless?

**Yes.** Spectator, `TnInputHarness`, `TnSelectHarness`, `TnFormFieldHarness`, `TnFormControlHarness` and `whenStable()`
all work, including async validators. The exception is selector-based lookups: **151 spec files mention
`formControlName`**, and `[formField]` leaves no such attribute. `IxFormHarness` indexes the same controls and `<ix-form>`
still renders a `<form>`, so it should keep working, but it wasn't run.

### What does each form type cost?

Counts come from a heuristic scan of 232 components (the epic says about 160), so treat them as approximate. Effort is
my **estimate** from writing the fixture, including its spec. It was not measured on real forms.

| Type | Forms | Avg LOC | Estimate each | Total | Benefit |
|---|---|---|---|---|---|
| Simple | 57 | 169 | 1-2 h | ~85 h | None |
| Conditional | 85 | 384 | 3-6 h | ~380 h | **Highest** |
| List rows | 18 | 455 | 4-8 h | ~110 h | Medium: row state follows object rows, errors could target a row |
| Dialog | 46 | 189 | 1-3 h | ~90 h | Low |
| Wizard | 26 | 341 | 1-2 days | ~310 h | Medium: one model, and steps take a `FieldTree` input |

That is about 975 hours, or roughly 25 engineer-weeks, plus 1-2 weeks of infrastructure. 48 files that call
`setValidators`-style APIs at runtime are likely the slowest, and `ix-dynamic-form` was not tried at all.

## Benefits measured

From the same form written both ways:

- **Less form code:** 69 lines against 49 (-29%), not counting the shared bridge code above.
- **Less wiring:** 7 `pipe`/`subscribe`/`toSignal`/`enable`/`disable` calls against 0. `hidden()` replaces the
  `valueChanges` plus enable/disable pattern, and removes the need for the `revalidateAfterRender` workaround (5 files).
- **Reactive state:** `fields().invalid()` is a signal, so zoneless forms need no `statusChanges` bridge.

No user-visible behaviour improved. That is the core of the recommendation: the gain is in maintainability, and it is
concentrated in conditional forms.

## Risks found

| Risk | Detail |
|---|---|
| **Field-targeted errors don't compile** | `fieldTree: form.name` is a type error under the repo's `strict: false` and compiles under `strictNullChecks`. Cross-field rules and server errors need casts until then |
| **Frozen rows throw** | Array rows get a symbol assigned to them. A frozen row throws a `TypeError`, also from an internal effect. NgRx freezes store state in dev mode, and 32 form files touch a store |
| **Row objects are mutated** | That symbol is enumerable, so `lodash.isEqual` and Jest `toEqual` see it. JSON doesn't, so the wire payload is safe, but specs asserting array payloads need changing |
| **Disabled values stay in the value** | Unlike `FormGroup.value`, the model keeps them, and `extractValue({ enabled: true })` keeps hidden ones. Each payload must exclude them by hand, and a miss sends stale data |
| **Primitive rows track by index** | With `string[]`, per-row state stays behind when a row above is removed |
| **Bundle** | +37.7 KB minified (before compression) on top of Reactive Forms' 44.7 KB, with no shared chunk, until the last reactive form is gone. A partial migration pays both |
| **API still moving** | Stable since 22.0, yet `hidden(path, fn)` and `disabled(path, fn)` are already deprecated in 22.2 in favour of `{ when }` |
| **`SignalFormControl`** | Works under `formControlName`, keeping chrome and `data-test`, but fails strict templates under `[formControl]`. It is a cheap bridge, but gains little alone since the form is still a `FormGroup` |

## Blockers and how each is handled

1. **`tn-*` chrome (must be fixed first):** `@truenas/ui-components` makes `tn-form-field`, `controlTestId` and error
   dismissal work with `[formField]`, and gives `tn-form-list` a signal path (NAS-145170).
2. **Field-targeted errors (can be contained):** a shared helper holds the cast until `strictNullChecks` is on across the
   app (528 files are listed today, out of about 2,060) or Angular fixes the types. Cross-field rules in individual forms
   still need a cast until then.
3. **Frozen rows (can be contained):** clone store data into the model when loading the form. This is a rule people have
   to remember, so forms with store-backed rows need a spec covering it.

## Migration order

This changes the epic's original order, which started with simple forms, because those give the least back.

1. **Library support (NAS-145170).**
2. **Infrastructure (NAS-145112):** a real `<ix-form>` path, a server-error service, resolver keys, a harness pattern.
3. **Pilot (NAS-145171):** 3-5 conditional forms that already have bugs or `revalidateAfterRender`, run through the E2E
   suite on a real appliance. Stop here if the results don't justify going on. A partial migration keeps both form
   systems and the extra bundle cost, so decide whether that end state is acceptable.
4. **If the pilot pays off:** use signal forms for new forms (NAS-145117), then the remaining conditional forms
   (NAS-145114), list forms with object rows (NAS-145115), and wizards one at a time (NAS-145116).
5. **Simple forms and dialogs (NAS-145113):** only if they are being changed anyway.
6. **`ix-dynamic-form` (NAS-145172):** evaluate separately. It may stay on Reactive Forms.

## Evidence

Nothing under `src/app/modules/forms/signal-forms-spike/` is imported by the app, and no production file changed.

- `signal-forms-parity.spec.ts`: one 25-test behaviour contract run against the form in both versions, through the real
  side-panel container, Save button and `<ix-form>`, with the real `FormErrorHandlerService` on the reactive side.
- `signal-forms-compat.spec.ts`: 46 tests on what the unmodified stack does. Tests named `gap:` assert a current gap, so
  a failure after an Angular or library bump means the gap may have closed.
- `signal-forms-spike.fixtures.ts`: the form written both ways, plus the prototype bridge and server-error helper.

Also checked, by hand:

- **Mutation checks:** removing the bridge, the conditional logic, the error retirement or the validity binding each
  failed the expected tests. Without the bridge, 7 contract tests fail.
- **Production compile:** `ngc` with strict templates is clean, and an optimized AOT build ran in a real browser. Both versions
  matched on errors, Save gating, focus and payload, with no console errors.

**Not tested:** a real appliance, the E2E suite, a real form from the app, `ix-dynamic-form`, and 8 of the 10 composite
CVAs (`ix-code-editor` reads `control.value` directly, so it may differ).

To delete this spike, remove that directory and this file.
