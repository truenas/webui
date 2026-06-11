import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextIscsi } from 'app/helptext/sharing';
import { AssociatedTargetDialogData, IscsiTargetExtentUpdate } from 'app/interfaces/iscsi.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-associated-target-form',
  styleUrls: ['./associated-target-form.component.scss'],
  templateUrl: './associated-target-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    TnDialogShellComponent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class AssociatedTargetFormComponent {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(FormErrorHandlerService);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);
  data = inject<AssociatedTargetDialogData>(DIALOG_DATA);
  dialogRef = inject<DialogRef<unknown, AssociatedTargetFormComponent>>(DialogRef);

  form = this.formBuilder.group({
    lunid: [null as number | null, [
      Validators.min(0),
      Validators.max(1023),
    ]],
    extent: [null as number | null, Validators.required],
  });

  isLoading = signal<boolean>(false);

  extents$ = of(this.data.extents).pipe(idNameArrayToOptions());

  readonly tooltips = {
    lunid: helptextIscsi.lunidTooltip,
    extent: helptextIscsi.existingExtentTooltip,
  };

  protected readonly requiredRoles = [
    Role.SharingIscsiTargetExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  onSubmit(): void {
    const values = {
      ...this.form.value,
      target: this.data.target.id,
    } as IscsiTargetExtentUpdate;

    this.isLoading.set(true);

    this.api.call('iscsi.targetextent.create', [values]).pipe(
      this.loader.withLoader(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.dialogRef.close(response);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
