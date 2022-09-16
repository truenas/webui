import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiTargetExtent, IscsiTargetExtentUpdate } from 'app/interfaces/iscsi.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IscsiService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './associated-target-form.component.html',
  styleUrls: ['./associated-target-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociatedTargetFormComponent {
  get isNew(): boolean {
    return !this.editingTarget;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add Authorized Target')
      : this.translate.instant('Edit Authorized Target');
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

  private editingTarget: IscsiTargetExtent;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private iscsiService: IscsiService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
  ) {}

  setTargetForEdit(target: IscsiTargetExtent): void {
    this.editingTarget = target;
    this.form.patchValue(target);
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
        this.slideInService.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
