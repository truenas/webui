import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, inject, viewChild,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnDialogShellComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
  TnSelectComponent, InputType,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextIscsi } from 'app/helptext/sharing';
import {
  AssociatedTargetDialogData, IscsiTargetExtent, IscsiTargetExtentUpdate,
} from 'app/interfaces/iscsi.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { tnSelectLabels } from 'app/modules/forms/ix-forms/constants/tn-select-labels.constant';
import { ApiService } from 'app/modules/websocket/api.service';

interface AssociatedTargetFormValues {
  lunid: number | null;
  extent: number | null;
}

@Component({
  selector: 'ix-associated-target-form',
  styleUrls: ['./associated-target-form.component.scss'],
  templateUrl: './associated-target-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    TnDialogShellComponent,
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
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
  protected readonly InputType = InputType;
  protected readonly tnSelectLabels = tnSelectLabels;

  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  protected data = inject<AssociatedTargetDialogData>(DIALOG_DATA);
  protected dialogRef = inject<DialogRef<unknown, AssociatedTargetFormComponent>>(DialogRef);

  /** The dialog's action slot owns Save, so it drives the wrapper's `canSubmit()`/`submit()`. */
  protected readonly formRef = viewChild(IxFormComponent<AssociatedTargetFormValues, IscsiTargetExtent>);

  protected form = this.formBuilder.group({
    lunid: [null as number | null, [
      Validators.min(0),
      Validators.max(1023),
    ]],
    extent: [null as number | null, Validators.required],
  });

  protected extents$ = of(this.data.extents).pipe(idNameArrayToOptions());

  protected readonly tooltips = {
    lunid: helptextIscsi.lunidTooltip,
    extent: helptextIscsi.existingExtentTooltip,
  };

  protected readonly requiredRoles = [
    Role.SharingIscsiTargetExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  protected handleSubmit = (
    event: FormSubmitEvent<AssociatedTargetFormValues>,
  ): SubmitResult<IscsiTargetExtent, IscsiTargetExtent> => {
    const values = {
      ...event.allValues,
      target: this.data.target.id,
    } as IscsiTargetExtentUpdate;

    return {
      request$: this.api.call('iscsi.targetextent.create', [values]),
      successMessage: this.translate.instant('Extent associated with target'),
      closeWith: (extent) => extent,
    };
  };
}
