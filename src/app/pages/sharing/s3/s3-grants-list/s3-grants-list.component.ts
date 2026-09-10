import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnAutocompleteComponent, TnFormFieldComponent, TnFormListComponent, TnFormListItemComponent,
  TnOptionsFetchFn, TnSelectComponent,
} from '@truenas/ui-components';
import { startWith, switchMap } from 'rxjs';
import {
  S3PrincipalType, s3AccessLabels, s3PrincipalTypeLabels,
} from 'app/enums/s3.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { Option } from 'app/interfaces/option.interface';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { createS3GrantFormGroup, S3GrantFormGroup } from 'app/pages/sharing/s3/s3-grants-list/s3-grant-form-group';
import {
  s3PrincipalOptions, s3PrincipalPageSize,
} from 'app/pages/sharing/s3/s3-grants-list/s3-principal-options';

interface GrantProviders {
  user: TnOptionsFetchFn<Option>;
  group: TnOptionsFetchFn<Option>;
  /**
   * The option naming the grant's own principal, pinned through the picker's `[options]` so an
   * id-valued field reads as a name on a form that has only been loaded — the first page is not
   * fetched until the panel opens.
   */
  seed: Option[];
}

/**
 * Editor for a list of S3 grants, shared by the bucket form and the service config form.
 * The parent owns the FormArray; this component adds and removes rows in it.
 */
@Component({
  selector: 'ix-s3-grants-list',
  templateUrl: './s3-grants-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormListComponent,
    TnFormListItemComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnAutocompleteComponent,
    TranslateModule,
  ],
})
export class S3GrantsListComponent {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private destroyRef = inject(DestroyRef);

  readonly formArray = input.required<FormArray<S3GrantFormGroup>>();
  readonly label = input<TranslatedString>(this.translate.instant('Grants'));
  readonly tooltip = input<TranslatedString>();

  /**
   * The parent pushes rows into the array after this view first renders (a config form loads its
   * grants asynchronously) while the `formArray` input reference never changes, which under OnPush
   * would leave the `@for` stale. Reading the rows through a signal fed by the array's own
   * `valueChanges` marks this view whenever a row is added or removed.
   */
  private readonly arrayChanged = toSignal(
    toObservable(this.formArray).pipe(switchMap((array) => array.valueChanges.pipe(startWith(null)))),
  );

  protected readonly rows = computed(() => {
    this.arrayChanged();
    return [...this.formArray().controls];
  });

  protected readonly S3PrincipalType = S3PrincipalType;
  protected readonly principalTypeOptions = mapToOptions(s3PrincipalTypeLabels, this.translate);
  protected readonly accessOptions = mapToOptions(s3AccessLabels, this.translate);
  protected readonly principalPageSize = s3PrincipalPageSize;

  /**
   * Keyed by form group rather than index, so rows keep their providers when an earlier row is removed.
   */
  private providers = new WeakMap<S3GrantFormGroup, GrantProviders>();

  protected addGrant(): void {
    this.formArray().push(createS3GrantFormGroup());
  }

  protected removeGrant(index: number): void {
    this.formArray().removeAt(index);
  }

  /**
   * Rows may be pushed by the parent (e.g. when loading an existing bucket), so each row is wired up
   * the first time it is rendered rather than when it is added. The template resolves this for every
   * row, not only those showing a picker, so the `principal_type` subscription below exists for an
   * `EVERYONE` row as well and can re-enable `xid` when the type changes.
   */
  protected providersFor(group: S3GrantFormGroup): GrantProviders {
    const existing = this.providers.get(group);
    if (existing) {
      return existing;
    }

    // The seed only NAMES a value — with `[dataSource]` bound it never fills the dropdown — and
    // only the picker matching the row's current type is rendered, so pinning it on both is safe.
    // It describes the type the row was loaded with, so the subscription below drops it when the
    // type changes, along with the `xid`/`name` it was built from.
    const { xid, name } = group.getRawValue();
    const providers: GrantProviders = {
      user: s3PrincipalOptions(this.api, S3PrincipalType.User),
      group: s3PrincipalOptions(this.api, S3PrincipalType.Group),
      seed: xid !== null && name ? [{ label: name, value: xid }] : [],
    };
    this.providers.set(group, providers);

    group.controls.principal_type.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((principalType) => {
      const xidControl = group.controls.xid;
      xidControl.setValue(null);
      group.controls.name.setValue('');
      providers.seed = [];
      // The picker for the principal is only rendered on the next change detection, and Angular's own
      // `required` directive on it is detached at the same time. Disabling the control keeps the row's
      // validity independent of that timing.
      if (principalType === S3PrincipalType.Everyone) {
        xidControl.disable();
      } else {
        xidControl.enable();
      }
    });

    return providers;
  }
}
