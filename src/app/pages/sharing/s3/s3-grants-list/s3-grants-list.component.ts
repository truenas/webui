import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  S3PrincipalType, s3AccessLabels, s3PrincipalTypeLabels,
} from 'app/enums/s3.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { createS3GrantFormGroup, S3GrantFormGroup } from 'app/pages/sharing/s3/s3-grants-list/s3-grant-form-group';
import { S3PrincipalComboboxProvider } from 'app/pages/sharing/s3/s3-grants-list/s3-principal-combobox-provider';

interface GrantProviders {
  user: S3PrincipalComboboxProvider;
  group: S3PrincipalComboboxProvider;
}

/**
 * Editor for a list of S3 grants, shared by the bucket form and the service config form.
 * The parent owns the FormArray; this component adds and removes rows in it.
 */
@Component({
  selector: 'ix-s3-grants-list',
  templateUrl: './s3-grants-list.component.html',
  styleUrls: ['./s3-grants-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxListComponent,
    IxListItemComponent,
    IxSelectComponent,
    IxComboboxComponent,
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

  protected readonly S3PrincipalType = S3PrincipalType;
  protected readonly principalTypeOptions$ = of(mapToOptions(s3PrincipalTypeLabels, this.translate));
  protected readonly accessOptions$ = of(mapToOptions(s3AccessLabels, this.translate));

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
   * the first time it is rendered rather than when it is added.
   */
  protected providersFor(group: S3GrantFormGroup): GrantProviders {
    let providers = this.providers.get(group);
    if (providers) {
      return providers;
    }

    // Seed only the picker for the grant's own principal type, so a group name never shows up
    // in the user list after the type is switched.
    const { principal_type: currentType, xid, name } = group.getRawValue();
    const seed = xid !== null && name ? [{ label: name, value: xid }] : [];
    const seedFor = (type: S3PrincipalType): typeof seed => (currentType === type ? seed : []);
    providers = {
      user: new S3PrincipalComboboxProvider(this.api, S3PrincipalType.User, seedFor(S3PrincipalType.User)),
      group: new S3PrincipalComboboxProvider(this.api, S3PrincipalType.Group, seedFor(S3PrincipalType.Group)),
    };
    this.providers.set(group, providers);

    group.controls.principal_type.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((principalType) => {
      const xidControl = group.controls.xid;
      xidControl.setValue(null);
      group.controls.name.setValue('');
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
