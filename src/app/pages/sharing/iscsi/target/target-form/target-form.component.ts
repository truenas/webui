import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { IscsiAuthMethod, IscsiTargetMode } from 'app/enums/iscsi.enum';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiTarget, IscsiTargetGroup } from 'app/interfaces/iscsi.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IscsiService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './target-form.component.html',
  styleUrls: ['./target-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetFormComponent {
  get isNew(): boolean {
    return !this.editingTarget;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add ISCSI Target')
      : this.translate.instant('Edit ISCSI Target');
  }

  readonly helptext = helptextSharingIscsi;
  readonly modes$ = of(this.helptext.target_form_enum_mode);
  readonly portals$ = this.iscsiService.listPortals().pipe(
    map((portals) => {
      const opts = [];
      opts.push({ label: '---', value: null });
      portals.forEach((portal) => {
        let label = String(portal.tag);
        if (portal.comment) {
          label += ' (' + portal.comment + ')';
        }
        opts.push({ label, value: portal.id });
      });
      return opts;
    }),
  );
  readonly initiators$ = this.iscsiService.listInitiators().pipe(
    map((initiators) => {
      const opts = [];
      opts.push({ label: 'None', value: null });
      initiators.forEach((initiator) => {
        const optionLabel = initiator.id
          + ' ('
          + (initiator.initiators.length === 0 ? 'ALL Initiators Allowed' : initiator.initiators.toString())
          + ')';
        opts.push({ label: optionLabel, value: initiator.id });
      });
      return opts;
    }),
  );
  readonly authmethods$ = of(this.helptext.target_form_enum_authmethod);
  readonly auths$ = this.iscsiService.getAuth().pipe(
    map((auths) => {
      const opts = [];
      opts.push({ label: 'None', value: null });
      const tags = _.uniq(auths.map((item) => item.tag));
      tags.forEach((tag) => {
        opts.push({ label: String(tag), value: tag });
      });
      return opts;
    }),
  );

  isLoading = false;

  form = this.formBuilder.group({
    name: ['', Validators.required],
    alias: [''],
    mode: ['ISCSI' as IscsiTargetMode],
    groups: [[] as IscsiTargetGroup[]],
    groupsForm: this.formBuilder.array([]),
  });

  private editingTarget: IscsiTarget;

  constructor(
    protected iscsiService: IscsiService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
  ) {}

  setTargetForEdit(target: IscsiTarget): void {
    this.editingTarget = target;
    this.form.patchValue(target);

    for (const group of target.groups) {
      this.form.controls.groupsForm.push(
        this.formBuilder.group({
          portal: [group.portal, Validators.required],
          initiator: [group.initiator],
          authmethod: [group.authmethod],
          auth: [group.auth],
        }),
      );
    }
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
    };
    delete (values.groupsForm);

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('iscsi.target.create', [values]);
    } else {
      request$ = this.ws.call('iscsi.target.update', [
        this.editingTarget.id,
        values,
      ]);
    }

    request$.pipe(untilDestroyed(this)).subscribe(() => {
      this.isLoading = false;
      this.slideInService.close();
    }, (error) => {
      this.isLoading = false;
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }

  addGroup(): void {
    this.form.controls.groups.value.push({
      portal: null,
      initiator: null,
      authmethod: IscsiAuthMethod.None,
      auth: null,
    });
    this.form.controls.groupsForm.push(
      this.formBuilder.group({
        portal: ['', Validators.required],
        initiator: [''],
        authmethod: [''],
        auth: [''],
      }),
    );
  }

  deleteGroup(id: number): void {
    this.form.controls.groups.value.splice(id, 1);
    this.form.controls.groupsForm.removeAt(id);
  }
}
