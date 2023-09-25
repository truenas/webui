import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiTargetExtent, IscsiTargetExtentUpdate } from 'app/interfaces/iscsi.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './associated-target-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private iscsiService: IscsiService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private slideInRef: IxSlideInRef<AssociatedTargetFormComponent>,
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
        this.slideInRef.close();
      },
      error: (error) => {
        this.isLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
