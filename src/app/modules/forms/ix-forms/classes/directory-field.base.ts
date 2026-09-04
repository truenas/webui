/* eslint-disable max-classes-per-file, angular-file-naming/directive-filename-suffix --
   `@Directive()` here is not a directive anyone applies to an element: it is how an
   abstract base gets Angular's DI in its field initializers. The three classes are one
   inheritance chain (a shared base plus its single- and list-valued halves), so splitting
   them across `*.directive.ts` files would name them for something they are not. */
import {
  DestroyRef, Directive, Injector, computed, effect, inject, input, output, signal, untracked,
} from '@angular/core';
import type { OnInit, Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { AsyncValidatorFn, ControlValueAccessor, ValidationErrors } from '@angular/forms';
import { NgControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import {
  controlTestId, type TnAsyncOptionsHost, type TnOptionsFetchFn, type TnTestIdValue,
} from '@truenas/ui-components';
import { Observable, forkJoin, of, timer } from 'rxjs';
import { catchError, first, map, switchMap, tap } from 'rxjs/operators';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import {
  DirectoryQueryOptions, PrincipalOption, PrincipalValue, UserDirectoryService,
} from 'app/services/user-directory.service';

/**
 * The value the create row carries. Never reaches a form control — the field
 * intercepts the row before anything is committed — but `tn-autocomplete`
 * requires every option to have one.
 */
const createSentinel = '__ix_create_user__';

/** Which side of the directory a field reads. */
export type PrincipalKind = 'user' | 'group';

/**
 * Shared behaviour of the four user/group fields — `ix-user-combobox`,
 * `ix-group-combobox`, `ix-user-chips`, `ix-group-chips`: reaching
 * {@link UserDirectoryService}, building the `[dataSource]` the inner tn-*
 * control consumes, running existence validation, and forwarding the
 * `ControlValueAccessor` contract to that inner control.
 *
 * A `Directive` rather than a plain class so Angular's DI works in its field
 * initializers; it is never applied to an element itself.
 *
 * **On the CVA forwarding.** Each field is the `ControlValueAccessor` its
 * `formControlName` binds to, and delegates to the `tn-autocomplete` /
 * `tn-chip-input` it renders. Angular hands a CVA its value and callbacks while
 * setting up the directive, which is *before* the inner view exists — so all
 * four are buffered here and replayed the moment the child registers itself.
 * Without that, the first `writeValue` of every edit form would land on nothing
 * and the field would render empty.
 */
@Directive()
export abstract class DirectoryFieldBase implements ControlValueAccessor {
  /** Which directory call this field reads. Fixed by each concrete field. */
  protected abstract readonly kind: PrincipalKind;

  /** Whether the value is a list (chips) or a single principal (combobox). */
  protected abstract readonly multiple: boolean;

  /**
   * The inner `tn-autocomplete` / `tn-chip-input`, declared by each concrete
   * field.
   *
   * It has to be declared *there* rather than here: a view query on an abstract
   * `@Directive()` never runs, because a directive has no view of its own for
   * Angular to query, and inheriting it does not attach it to the derived
   * component's view either. Declared on the base, this silently resolves to
   * `undefined` forever — every field renders, and nothing a user does ever
   * reaches the form control.
   */
  protected abstract readonly innerControl: Signal<DirectoryInnerControl | undefined>;

  protected readonly directory = inject(UserDirectoryService);
  protected readonly translate = inject(TranslateService);

  /** The `NgControl` this field is bound to, when it is in a form at all. */
  protected readonly ngControl = inject(NgControl, { optional: true, self: true });

  private readonly injector = inject(Injector);
  protected readonly destroyRef = inject(DestroyRef);

  /**
   * Modifiers handed to the directory verbatim — how this particular field
   * narrows the list. See {@link DirectoryQueryOptions}.
   */
  readonly directoryOptions = input<DirectoryQueryOptions>({});

  /** Placeholder for the text field; falls back to a generic "type to search". */
  readonly placeholder = input<TranslatedString | undefined>(undefined);

  /** Whether the field is disabled independently of its form control. */
  readonly disabled = input<boolean>(false);

  /**
   * Reject a typed name that no user or group actually has.
   *
   * On by default: these fields accept free text, so a typo would otherwise
   * reach the API as a valid-looking name. Turn it off where the control is
   * restricted to the dropdown anyway and the extra lookups are waste.
   */
  readonly validateExistence = input<boolean>(true);

  /** Debounce before a lookup goes out, both for search and for validation. */
  readonly debounce = input<number>(defaultDebounceTimeMs);

  /**
   * Options merged ahead of whatever the directory returns, deduplicated by
   * value.
   *
   * For a value the search cannot produce but the field must still name: an id
   * already on the record, resolved to its display name elsewhere. Without it
   * such a field shows the raw id until the user happens to search for it.
   *
   * They reach the display two ways, because the directory's first page is not
   * fetched until the field is focused: pinned ahead of that page once it is,
   * and handed to the chips fields as known labels straight away, so a chip on
   * an edit form reads its name without anyone touching the field.
   */
  readonly extraOptions = input<PrincipalOption[]>([]);

  /** Test-id base, forwarded to the inner control. */
  readonly testId = input<TnTestIdValue>(undefined);

  /**
   * The base the inner control stamps its ids from.
   *
   * `controlTestId` is `self`-scoped so that a composite control cannot leak
   * its name onto the children it embeds — which means the inner
   * `tn-autocomplete` / `tn-chip-input`, having no `NgControl` of its own (this
   * field claimed it), would resolve to nothing and drop every `data-test`.
   * Resolving here, where the `NgControl` actually is, and passing the result
   * down is what keeps `formControlName="owner"` emitting an id.
   */
  protected readonly resolvedTestId = controlTestId(this.testId);

  /** Accessible name, forwarded to the inner control. */
  readonly ariaLabel = input<TranslatedString | undefined>(undefined);

  /** Rows per page, as the directory reports them. */
  protected readonly pageSize = computed(() => this.directory.pageSize);

  protected readonly resolvedPlaceholder = computed(() => this.placeholder()
    ?? (this.kind === 'user'
      ? this.translate.instant('Type to search users...')
      : this.translate.instant('Type to search groups...')));

  /**
   * The `[dataSource]` the inner control consumes. A stable function identity —
   * it reads `directoryOptions()` when called rather than closing over it, so
   * changing that input does not swap the source out from under a live search.
   *
   * Stability alone is only half of it: nothing inside the inner control
   * observes these inputs, so a change to them would take effect no earlier
   * than the next keystroke. The effect in the constructor, keyed on
   * {@link directoryQueryKey}, is the other half.
   */
  protected readonly optionsSource: TnOptionsFetchFn<PrincipalOption> = (search: string, page: number) => {
    const options = this.directoryOptions();
    const rows$ = this.kind === 'user'
      ? this.directory.queryUsers(search, page, options)
      : this.directory.queryGroups(search, page, options);

    return rows$.pipe(tap({
      // Both directions: a page that lands clears a previous failure, so the
      // panel stops claiming the directory is unreachable the moment it is
      // reachable again. Without the success half the flag latches for the
      // life of the field and every later empty result is mislabelled.
      next: () => this.lookupFailed.set(false),
      error: () => this.lookupFailed.set(true),
    }), map((rows) => {
      // Only ahead of the FIRST page: later pages append, and re-inserting
      // these each time would push duplicates through the paging dedupe.
      //
      // The pinned rows do inflate the length the engine measures exhaustion
      // by, so a genuinely-last first page topped up to `pageSize` reads as a
      // full one and costs a page-1 request that can only come back empty. The
      // alternative is holding server rows back to make room, which loses them
      // for good — the paging is by page index, so the next page starts past
      // them. One wasted round trip, after which exhaustion latches correctly.
      const extra = page === 0 ? this.extraOptions() : [];
      if (extra.length === 0) {
        return rows;
      }
      const pinned = new Set(extra.map((option) => option.value));
      return [...extra, ...rows.filter((row) => !pinned.has(row.value))];
    }));
  };

  /**
   * Whether the LAST directory lookup failed — not whether one ever has.
   * Cleared by the next page that lands, which is what keeps the panel's
   * wording honest after a transient failure.
   */
  protected readonly lookupFailed = signal(false);

  /**
   * The {@link directoryQueryKey} the inner control's current pages were
   * fetched under. `undefined` until the first one is recorded.
   */
  private lastQueryKey: string | null | undefined;

  // ── CVA forwarding ──

  /** The inner control, once its view exists. */
  private inner = signal<ControlValueAccessor | null>(null);

  /**
   * The instance {@link registerInner} last replayed into.
   *
   * The registering effect re-runs whenever change detection re-reads its view
   * query — which is often — and replaying `writeValue` on each of those runs
   * overwrites whatever the user is currently typing with the last committed
   * value. The draft is then blank at blur, so nothing is ever committed and
   * the field silently refuses every typed value. Replay only on a genuinely
   * new instance.
   */
  private registeredInner: ControlValueAccessor | null = null;

  private pendingValue: unknown;
  private hasPendingValue = false;
  private pendingChange?: (value: unknown) => void;
  private pendingTouched?: () => void;
  private pendingDisabled?: boolean;

  constructor() {
    // Claiming the accessor here rather than through NG_VALUE_ACCESSOR keeps the
    // field from also being discovered as an accessor for its own inner control.
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }

    // An effect rather than ngAfterViewInit, so a control recreated by a
    // structural directive in a parent template re-registers and comes back
    // holding the current value. Reading `innerControl` lazily is also what
    // lets an abstract member be driven from here: by the time an effect first
    // runs, the subclass field that declares the query exists.
    effect(() => {
      const control = this.innerControl();
      if (control) {
        this.registerInner(control);
      }
    });

    // `[directoryOptions]` / `[extraOptions]` are signal inputs and neither is
    // init-only, so a value that flips after init — `[directoryOptions]="{
    // queryType: smbType() }"` — has to reach the rows on screen. The source
    // function reads them at call time, but nothing calls it until the user
    // types again, so without this the panel keeps serving the previous
    // narrowing's results and a pick commits a value it was meant to exclude.
    effect(() => {
      const control = this.innerControl();
      const key = directoryQueryKey(this.directoryOptions(), this.extraOptions());
      if (!control) {
        return;
      }
      // A `null` key is one that could not be compared — treated as a change,
      // so an unserializable bag costs a redundant refetch rather than going
      // unnoticed.
      const unchanged = key !== null && key === this.lastQueryKey;
      const isFirstKey = this.lastQueryKey === undefined;
      this.lastQueryKey = key;
      // Untracked because `refreshOptions` reads the inner control's own option
      // and loading signals; tracking those would make every page that lands
      // re-run this effect — and refresh again.
      if (!unchanged && !isFirstKey) {
        untracked(() => control.refreshOptions());
      }
    });
  }

  /**
   * Called once the inner control exists. Replays whatever the forms layer
   * already handed us.
   */
  protected registerInner(control: ControlValueAccessor): void {
    if (this.registeredInner === control) {
      return;
    }
    this.registeredInner = control;
    this.inner.set(control);

    if (this.pendingChange) {
      control.registerOnChange(this.pendingChange);
    }
    if (this.pendingTouched) {
      control.registerOnTouched(this.pendingTouched);
    }
    if (this.pendingDisabled !== undefined) {
      control.setDisabledState?.(this.pendingDisabled);
    }
    if (this.hasPendingValue) {
      control.writeValue(this.pendingValue);
    }
  }

  writeValue(value: unknown): void {
    // Kept even after forwarding: the inner control can be recreated (an @if in
    // a parent template), and it must come back holding the current value.
    this.pendingValue = value;
    this.hasPendingValue = true;
    this.inner()?.writeValue(value);
  }

  registerOnChange(fn: (value: unknown) => void): void {
    this.pendingChange = fn;
    this.inner()?.registerOnChange(fn);
  }

  registerOnTouched(fn: () => void): void {
    this.pendingTouched = fn;
    this.inner()?.registerOnTouched(fn);
  }

  setDisabledState(isDisabled: boolean): void {
    this.pendingDisabled = isDisabled;
    this.inner()?.setDisabledState?.(isDisabled);
  }

  /**
   * Commits a value the field chose itself, rather than one the user picked
   * from the dropdown — currently only the freshly created user. Goes through
   * the bound control so the form sees it as a real edit; falls back to the
   * accessor callbacks when the field is used outside a form.
   */
  protected writeValueAndNotify(value: PrincipalValue): void {
    const control = this.ngControl?.control;
    if (control) {
      control.setValue(value);
      control.markAsDirty();
      return;
    }
    this.writeValue(value);
    this.pendingChange?.(value);
  }

  // ── Existence validation ──

  /**
   * Keeps the existence validator on the bound control in step with
   * {@link validateExistence}, for as long as this field exists.
   *
   * Mirrored rather than attached once, because the control is not this field's
   * to keep:
   *
   * - `[validateExistence]` is a signal input, so a value that flips after init
   *   — `[validateExistence]="showAdvanced()"` — has to take effect. Attaching
   *   once from `ngOnInit` silently ignored every later value, and nothing in
   *   the API surface said the input was init-only.
   * - The control outlives the field whenever a parent `@if` (or a stepper
   *   page) re-creates it. Each re-creation added another validator to the same
   *   control — N duplicate directory lookups per validation pass — while the
   *   validator from the destroyed instance kept flagging a value from a
   *   component nobody can see or correct.
   *
   * On attach, `updateValueAndValidity` is deliberately NOT called: an edit
   * form would otherwise open with every loaded value already flagged, before
   * the user has touched anything. Validation runs on the first change, or on
   * submit. On detach it *is* called, so a verdict — or a PENDING state — from
   * a validator that is gone does not outlive it.
   */
  protected attachExistenceValidator(): void {
    const control = this.ngControl?.control;
    if (!control) {
      return;
    }

    let attached: AsyncValidatorFn | undefined;

    const detach = (): void => {
      if (!attached) {
        return;
      }
      control.removeAsyncValidators(attached);
      attached = undefined;
      control.updateValueAndValidity({ emitEvent: false });
    };

    effect(() => {
      const wanted = this.validateExistence();
      if (wanted === !!attached) {
        return;
      }
      if (wanted) {
        attached = this.existenceValidator();
        control.addAsyncValidators(attached);
        return;
      }
      detach();
    }, { injector: this.injector });

    this.destroyRef.onDestroy(detach);
  }

  private existenceValidator(): AsyncValidatorFn {
    return (control): Observable<ValidationErrors | null> => {
      const names = this.namesToCheck(control.value);
      if (names.length === 0) {
        return of(null);
      }

      // Debounce inside the validator, separately from the search debounce: a
      // typed name that matches nothing still has to be checked, and the two
      // have different lifecycles.
      return timer(this.debounce()).pipe(
        first(),
        switchMap(() => {
          // The value can move while the timer runs; a verdict about a name the
          // control no longer holds would be a stale error.
          // Compared as JSON rather than joined on a separator: any separator
          // is a character some name could contain.
          if (JSON.stringify(this.namesToCheck(control.value)) !== JSON.stringify(names)) {
            return of<ValidationErrors | null>(null);
          }
          return this.findMissing(names).pipe(
            map((missing) => (missing.length ? this.existenceError(missing) : null)),
          );
        }),
      );
    };
  }

  /** Normalizes either shape of control value to the names worth checking. */
  private namesToCheck(value: unknown): string[] {
    let candidates: unknown[] = [value];
    if (this.multiple) {
      candidates = Array.isArray(value) ? value : [];
    }
    return candidates
      // Only a typed name can be wrong. A numeric value came from an option the
      // directory itself returned, so checking it by name would be meaningless.
      .filter((candidate): candidate is string => typeof candidate === 'string' && candidate.trim() !== '');
  }

  private findMissing(names: string[]): Observable<string[]> {
    const checks = names.map((name) => this.exists(name).pipe(
      // `first()` on this pipe rather than only inside `forkJoin`, so the
      // one-name branch below gets it too: Angular wraps even a single async
      // validator in `forkJoin`, which emits only when its source COMPLETES. A
      // lookup answered from a cache that never completes would park the
      // control in PENDING forever, and any submit button gated on validity
      // would stay disabled. Ahead of `catchError` so an empty completion is
      // caught as "cannot say" too.
      first(),
      // A lookup that fails is not evidence the name is wrong — treat the
      // transport error as "cannot say" rather than flagging a real user.
      catchError(() => of(true)),
      map((exists) => ({ name, exists })),
    ));

    return checks.length === 1
      ? checks[0].pipe(map((result) => (result.exists ? [] : [result.name])))
      : forkJoin(checks).pipe(
          map((results) => results.filter((result) => !result.exists).map((result) => result.name)),
        );
  }

  private exists(name: string): Observable<boolean> {
    return this.kind === 'user'
      ? this.directory.userExists(name)
      : this.directory.groupExists(name);
  }

  private existenceError(missing: string[]): ValidationErrors {
    const isUser = this.kind === 'user';

    if (this.multiple && isUser) {
      return {
        usersDoNotExist: {
          message: this.translate.instant(
            'The following users do not exist: {users}',
            { users: missing.join(', ') },
          ),
        },
      };
    }

    if (this.multiple) {
      return {
        groupsDoNotExist: {
          message: this.translate.instant(
            'The following groups do not exist: {groups}',
            { groups: missing.join(', ') },
          ),
        },
      };
    }

    if (isUser) {
      return {
        userDoesNotExist: {
          message: this.translate.instant('User "{username}" does not exist', { username: missing[0] }),
        },
      };
    }

    return {
      groupDoesNotExist: {
        message: this.translate.instant('Group "{groupName}" does not exist', { groupName: missing[0] }),
      },
    };
  }
}

/**
 * The single-valued fields, `ix-user-combobox` and `ix-group-combobox`. Adds
 * the inputs that only make sense for one principal, and the optional create
 * row.
 */
@Directive()
export abstract class DirectoryComboboxBase extends DirectoryFieldBase implements OnInit {
  protected readonly multiple = false;

  /** Whether this field can offer a create row at all. Only users can. */
  protected readonly supportsCreate: boolean = false;

  /**
   * Commit a typed name that matched nothing. On by default, because a name
   * from a directory the search cannot reach is still a legitimate value —
   * {@link DirectoryFieldBase.validateExistence} is what catches typos.
   */
  readonly allowCustomValue = input<boolean>(true);

  /** Restrict the value to the dropdown; an unmatched term reverts on blur. */
  readonly requireSelection = input<boolean>(false);

  /**
   * Text shown when nothing matched. Left unset, the inner control's own
   * default applies — except after a failed lookup, which the field words for
   * itself. See {@link resolvedNoResultsText}.
   */
  readonly noResultsText = input<TranslatedString | undefined>(undefined);

  /**
   * What an empty panel says.
   *
   * A lookup that FAILED is not an empty directory, and saying "No results
   * found" reads as "no such user". The field knows which of the two it is —
   * it owns the fetch — so no consumer has to track it, and none can leave the
   * message stuck on the failure wording after the directory comes back.
   */
  protected readonly resolvedNoResultsText = computed<TranslatedString | undefined>(() => (this.lookupFailed()
    ? this.translate.instant('Options cannot be loaded')
    : this.noResultsText()));

  /** Offer a row above the results that opens the create-user side panel. */
  readonly allowCreate = input<boolean>(false);

  /** Emits the newly created principal after it has been selected. */
  readonly created = output<PrincipalOption>();

  /**
   * Emits a failed directory lookup, for a host that wants to log or report it.
   *
   * Not needed to keep the panel honest — the field already words that for
   * itself, and a host that latches this into `[noResultsText]` gets it wrong,
   * because nothing tells it the directory came back. See
   * {@link resolvedNoResultsText}.
   */
  readonly directoryError = output<unknown>();

  ngOnInit(): void {
    this.attachExistenceValidator();
  }

  /** The pinned create row, or undefined when this field does not offer one. */
  protected readonly createOption = computed<PrincipalOption | undefined>(() => {
    if (!this.supportsCreate || !this.allowCreate()) {
      return undefined;
    }
    return { label: this.translate.instant('Add New'), value: createSentinel };
  });

  /**
   * The create row was chosen. Nothing is committed until the flow resolves, so
   * a dismissed panel leaves the previous selection exactly as it was.
   */
  protected onCreate(): void {
    // Tied to the field's lifetime like everything else here, and here it is
    // load-bearing rather than tidiness: the create flow is the one call that
    // can stay open for minutes, so a parent `@if` or a stepper page can tear
    // the field down while the panel is still up — after which this would write
    // and dirty a control on behalf of a field nobody can see.
    this.directory.createUser(this.directoryOptions()).pipe(
      first(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((created) => {
      if (!created) {
        return;
      }
      this.writeValueAndNotify(created.value);
      // The value alone reaches the inner control through `writeValue`, which
      // has no way to know the label and drops the remembered one. Handing the
      // whole option over keeps the field showing the new user's NAME rather
      // than the id it was just given, for an id-valued field.
      this.innerControl()?.setSelectedOption?.(created);
      this.created.emit(created);
    });
  }
}

/** The list-valued fields, `ix-user-chips` and `ix-group-chips`. */
@Directive()
export abstract class DirectoryChipsBase extends DirectoryFieldBase implements OnInit {
  protected readonly multiple = true;

  /** Commit typed names that matched nothing, as the single-valued fields do. */
  readonly allowCustomValue = input<boolean>(true);

  /** Maximum number of chips; unset means no limit. */
  readonly maxChips = input<number | undefined>(undefined);

  /** Emits a failed directory lookup; the field recovers on its own. */
  readonly directoryError = output<unknown>();

  ngOnInit(): void {
    this.attachExistenceValidator();
  }
}

/**
 * Identity of everything `optionsSource` reads, so a change to any of it can
 * invalidate what the inner control has already fetched.
 *
 * Serialized rather than compared by reference on purpose: a template that
 * rebuilds the bag each cycle — `[directoryOptions]="buildQuery()"`, a getter —
 * would otherwise read as a change on every tick and re-query the directory
 * forever. These are a handful of fields and a few pinned options; stringifying
 * them is far cheaper than the request it prevents.
 *
 * Returning `null` for something JSON refuses costs a redundant refetch;
 * letting the throw out of an effect would break the field for good.
 */
function directoryQueryKey(
  query: DirectoryQueryOptions,
  extraOptions: readonly PrincipalOption[],
): string | null {
  try {
    return JSON.stringify([query, extraOptions]);
  } catch {
    return null;
  }
}

/**
 * What a directory field needs from the `tn-autocomplete` / `tn-chip-input` it
 * wraps, beyond the `ControlValueAccessor` contract it forwards.
 */
export interface DirectoryInnerControl extends ControlValueAccessor, TnAsyncOptionsHost {
  /**
   * Commit an option, label included. Present on `tn-autocomplete` only — a
   * chips field has no single selection to label.
   */
  setSelectedOption?(option: PrincipalOption): void;
}
