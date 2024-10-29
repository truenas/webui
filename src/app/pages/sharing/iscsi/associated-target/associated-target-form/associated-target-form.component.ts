import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiTargetExtent, IscsiTargetExtentUpdate } from 'app/interfaces/iscsi.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-associated-target-form',
  templateUrl: './associated-target-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class AssociatedTargetFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingTarget;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Associated Target')
      : this.translate.instant('Edit Associated Target');
  }

  form = this.formBuilder.group({
    target: [null as number, Validators.required],
    lunid: [null as number, [
      Validators.min(0),
      Validators.max(1023),
    ]],
    extent: [null as number, Validators.required],
  });

  isLoading = false;

  targets$ = this.iscsiService.getTargets().pipe(idNameArrayToOptions());
  extents$ = this.iscsiService.getExtents().pipe(idNameArrayToOptions());

  readonly tooltips = {
    target: helptextSharingIscsi.associated_target_tooltip_target,
    lunid: helptextSharingIscsi.associated_target_tooltip_lunid,
    extent: helptextSharingIscsi.associated_target_tooltip_extent,
  };

  readonly requiredRoles = [
    Role.SharingIscsiTargetExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private iscsiService: IscsiService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private slideInRef: SlideInRef<AssociatedTargetFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingTarget: IscsiTargetExtent,
  ) {}

  ngOnInit(): void {
    if (this.editingTarget) {
      this.setTargetForEdit();
    }
  }

  setTargetForEdit(): void {
    this.form.patchValue(this.editingTarget);
  }

  onSubmit(): void {
    const values = this.form.value as IscsiTargetExtentUpdate;

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('iscsi.targetextent.create', [values]);
    } else {
      request$ = this.ws.call('iscsi.targetextent.update', [
        this.editingTarget.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
