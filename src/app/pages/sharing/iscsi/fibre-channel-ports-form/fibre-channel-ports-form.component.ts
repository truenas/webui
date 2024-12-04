import {
  Component, ChangeDetectionStrategy, computed, inject, signal,
} from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { FibreChannelPort, FibreChannelPortUpdate } from 'app/interfaces/fibre-channel.interface';
import { newOption } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { IscsiService } from 'app/services/iscsi.service';
import { ApiService } from 'app/services/websocket/api.service';

@Component({
  standalone: true,
  selector: 'ix-fibre-channel-ports-form',
  templateUrl: './fibre-channel-ports-form.component.html',
  styleUrls: ['./fibre-channel-ports-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    ReactiveFormsModule,
    TranslateModule,
    RequiresRolesDirective,
  ],
})
export class FibreChannelPortsFormComponent {
  protected requiredRoles: Role[] = [];
  protected fibreChannel = signal(inject<FibreChannelPort>(SLIDE_IN_DATA));
  protected isNew = computed(() => !this.fibreChannel());
  protected isLoading = signal(false);

  protected readonly targetOptions$ = this.iscsiService.getTargets()
    .pipe(
      idNameArrayToOptions(),
      switchMap((options) => of([
        ...options,
        { label: this.translate.instant('Create New'), value: newOption },
      ])),
    );

  protected title = computed(() => {
    return this.isNew()
      ? this.translate.instant('Add Fibre Channel Port')
      : this.translate.instant('Edit Fibre Channel Port');
  });

  protected form = this.fb.group({
    port: [this.fibreChannel().port, [Validators.required]],
    target_id: [this.fibreChannel().target.id, [Validators.required]],
  });

  constructor(
    private api: ApiService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private fb: FormBuilder,
    private iscsiService: IscsiService,
  ) { }

  onSubmit(): void {
    const payload = {} as FibreChannelPortUpdate;
    const request$ = this.isNew()
      ? this.api.call('fcport.create')
      : this.api.call('fcport.update', [this.fibreChannel().id, payload]);

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.snackbar.success(this.translate.instant('Operation is success'));
    });
  }
}
