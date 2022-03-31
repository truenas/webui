import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
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
  groups: IscsiTargetGroup[] = [];
  listPrefix = '__';

  form = this.formBuilder.group({
    name: ['', Validators.required],
    alias: [''],
    mode: ['ISCSI' as IscsiTargetMode],
  });

  private editingTarget: IscsiTarget;

  private groupsFromControls = [
    {
      name: 'portal',
      default: null as number,
      validator: [Validators.required],
    },
    {
      name: 'initiator',
      default: null as number,
    },
    {
      name: 'authmethod',
      default: IscsiAuthMethod.None,
    },
    {
      name: 'auth',
      default: null as number,
    },
  ];

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

    Object.values(target.groups).forEach((group, index) => {
      this.groupsFromControls.forEach((fc) => {
        this.form.addControl(`${fc.name}${this.listPrefix}${index}`, new FormControl(fc.name, fc?.validator));
      });
      this.groups.push(group);
    });

    this.form.patchValue({
      ...target,
    });
  }

  onSubmit(): void {
    const values = this.form.value;

    const params = {
      name: values.name,
      alias: values.alias,
      mode: values.mode,
      groups: this.groups,
    };

    this.isLoading = true;
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('iscsi.target.create', [params]);
    } else {
      request$ = this.ws.call('iscsi.target.update', [
        this.editingTarget.id,
        params,
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
    const newIndex = this.groups.length;
    const newListItem: any = {};
    this.groupsFromControls.forEach((fc) => {
      newListItem[fc.name] = fc.default;
      this.form.addControl(`${fc.name}${this.listPrefix}${newIndex}`, new FormControl(fc.default, fc?.validator));
    });

    this.groups.push(newListItem);
  }

  deleteGroup(id: number): void {
    this.groupsFromControls.forEach((fc) => {
      this.form.removeControl(`${fc.name}${this.listPrefix}${id}`);
    });

    this.groups.splice(id, 1);
  }
}
