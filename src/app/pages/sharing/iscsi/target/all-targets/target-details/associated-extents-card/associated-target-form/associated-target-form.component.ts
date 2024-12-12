import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject,
  signal,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { AssociatedTargetDialogData, IscsiTargetExtentUpdate } from 'app/interfaces/iscsi.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-associated-target-form',
  styleUrls: ['./associated-target-form.component.scss'],
  templateUrl: './associated-target-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    MatDialogTitle,
    MatDialogClose,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    MatDialogActions,
  ],
})
export class AssociatedTargetFormComponent {
  form = this.formBuilder.group({
    lunid: [null as number, [
      Validators.min(0),
      Validators.max(1023),
    ]],
    extent: [null as number, Validators.required],
  });

  isLoading = signal<boolean>(false);

  extents$ = of(this.data.extents).pipe(idNameArrayToOptions());

  readonly tooltips = {
    lunid: helptextSharingIscsi.associated_target_tooltip_lunid,
    extent: helptextSharingIscsi.associated_target_tooltip_extent,
  };

  readonly requiredRoles = [
    Role.SharingIscsiTargetExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private loader: AppLoaderService,
    @Inject(MAT_DIALOG_DATA) public data: AssociatedTargetDialogData,
    public dialogRef: MatDialogRef<AssociatedTargetFormComponent>,
  ) {}

  onSubmit(): void {
    const values = {
      ...this.form.value,
      target: this.data.target.id,
    } as IscsiTargetExtentUpdate;

    this.isLoading.set(true);

    this.api.call('iscsi.targetextent.create', [values]).pipe(
      this.loader.withLoader(),
      untilDestroyed(this),
    ).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.dialogRef.close(response);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
