import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, input, OnChanges, OnInit, output, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { Observable, switchMap } from 'rxjs';
import { containersHelptext } from 'app/helptext/containers/containers';
import { directIdMapping } from 'app/interfaces/user.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxGroupComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-group-combobox/ix-group-combobox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxUserComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-user-combobox/ix-user-combobox.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ViewType,
} from 'app/pages/containers/components/all-containers/all-containers-header/map-user-group-ids-dialog/mapping.types';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-new-mapping-form',
  templateUrl: './new-mapping-form.component.html',
  styleUrl: './new-mapping-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxUserComboboxComponent,
    IxGroupComboboxComponent,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IxCheckboxComponent,
    IxInputComponent,
    TnIconComponent,
    MatButton,
    MatTooltip,
    TestDirective,
    IxFieldsetComponent,
  ],
})
export class NewMappingFormComponent implements OnChanges, OnInit {
  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private formBuilder = inject(NonNullableFormBuilder);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);

  readonly type = input.required<ViewType>();
  readonly mappingAdded = output();

  protected readonly ViewType = ViewType;
  protected readonly helptext = containersHelptext;

  protected form = this.formBuilder.group({
    hostUidOrGid: [null as string | number | null, Validators.required],
    mapDirectly: [true],
    instanceUidOrGid: [null as number | null],
  });

  protected readonly isUserType = computed(() => this.type() === ViewType.Users);

  ngOnChanges(): void {
    this.resetFormOnTypeChanges();
  }

  ngOnInit(): void {
    this.handleMapDirectlyChanges();
  }

  protected submit(): void {
    const values = this.form.value;
    const update = {
      userns_idmap: values.mapDirectly ? directIdMapping : values.instanceUidOrGid,
    };

    let request$: Observable<unknown>;

    if (this.isUserType()) {
      // ix-user-combobox returns username, need to query for user ID
      request$ = this.api.call('user.query', [[['username', '=', values.hostUidOrGid]]]).pipe(
        switchMap((users) => {
          if (!users.length) {
            throw new Error(this.translate.instant('User not found'));
          }
          return this.api.call('user.update', [users[0].id, update]);
        }),
      );
    } else {
      // ix-group-combobox returns group name, need to query for group ID
      request$ = this.api.call('group.query', [[['group', '=', values.hostUidOrGid]]]).pipe(
        switchMap((groups) => {
          if (!groups.length) {
            throw new Error(this.translate.instant('Group not found'));
          }
          return this.api.call('group.update', [groups[0].id, update]);
        }),
      );
    }

    request$
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.resetFormOnTypeChanges();
        this.mappingAdded.emit();
        this.snackbar.success(this.translate.instant('Mapping added'));
      });
  }

  private resetFormOnTypeChanges(): void {
    this.form.setValue({
      mapDirectly: true,
      instanceUidOrGid: null,
      hostUidOrGid: null,
    });
  }

  private handleMapDirectlyChanges(): void {
    this.form.controls.mapDirectly.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((mapDirectly) => {
      if (mapDirectly) {
        this.form.controls.instanceUidOrGid.clearValidators();
      } else {
        this.form.controls.instanceUidOrGid.setValidators(Validators.required);
      }
      this.form.controls.instanceUidOrGid.updateValueAndValidity();
    });
  }
}
