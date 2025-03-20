import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  OnChanges,
  output,
} from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { directIdMapping } from 'app/interfaces/user.interface';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ViewType,
} from 'app/pages/instances/components/all-instances/all-instances-header/map-user-group-ids-dialog/mapping.types';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  selector: 'ix-new-mapping-form',
  templateUrl: './new-mapping-form.component.html',
  styleUrl: './new-mapping-form.component.scss',
  imports: [
    IxComboboxComponent,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,
    IxCheckboxComponent,
    IxInputComponent,
    MatButton,
    TestDirective,
    IxFieldsetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewMappingFormComponent implements OnChanges {
  readonly type = input.required<ViewType>();
  readonly mappingAdded = output();

  protected form = this.formBuilder.group({
    hostUidOrGid: [null as number, Validators.required],
    mapDirectly: [true],
    instanceUidOrGid: [null as number | null],
  });

  protected readonly userProvider = new UserComboboxProvider(this.userService, 'id');
  protected readonly groupProvider = new GroupComboboxProvider(this.userService, 'id');

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private formBuilder: NonNullableFormBuilder,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private userService: UserService,
  ) {}

  protected readonly isUserType = computed(() => this.type() === ViewType.Users);

  ngOnChanges(): void {
    this.resetFormOnTypeChanges();
  }

  private resetFormOnTypeChanges(): void {
    this.form.setValue({
      mapDirectly: true,
      instanceUidOrGid: null,
      hostUidOrGid: null,
    });
  }

  protected submit(): void {
    const values = this.form.value;
    const update = {
      userns_idmap: values.mapDirectly ? directIdMapping : values.instanceUidOrGid,
    };
    let request$: Observable<unknown>;

    if (this.isUserType()) {
      request$ = this.api.call('user.update', [values.hostUidOrGid, update]);
    } else {
      request$ = this.api.call('group.update', [values.hostUidOrGid, update]);
    }

    request$
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.mappingAdded.emit();
        this.snackbar.success(this.translate.instant('Mapping added'));
      });
  }

  protected readonly ViewType = ViewType;
  protected readonly containersHelptext = instancesHelptext;
}
