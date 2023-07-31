import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
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
import { Option } from 'app/interfaces/option.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './target-form.component.html',
  styleUrls: ['./target-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TargetFormComponent implements OnInit {
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
      const opts: Option[] = [];
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
      const opts: Option[] = [];
      initiators.forEach((initiator) => {
        const initiatorsAllowed = initiator.initiators.length === 0 ? 'ALL Initiators Allowed' : initiator.initiators.toString();
        const optionLabel = `${initiator.id} (${initiatorsAllowed})`;
        opts.push({ label: optionLabel, value: initiator.id });
      });
      return opts;
    }),
  );
  readonly authmethods$ = of(this.helptext.target_form_enum_authmethod);
  readonly auths$ = this.iscsiService.getAuth().pipe(
    map((auths) => {
      const opts: Option[] = [];
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
    mode: [IscsiTargetMode.Iscsi],
    groups: this.formBuilder.array<IscsiTargetGroup>([]),
    auth_networks: this.formBuilder.array<string>([]),
  });

  constructor(
    protected iscsiService: IscsiService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<TargetFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingTarget: IscsiTarget,
  ) {}

  ngOnInit(): void {
    if (this.editingTarget) {
      this.setTargetForEdit();
    }
  }

  setTargetForEdit(): void {
    Object.values(this.editingTarget.groups).forEach(() => this.addGroup());
    Object.values(this.editingTarget.auth_networks).forEach(() => this.addNetwork());

    this.form.patchValue({
      ...this.editingTarget,
    });
  }

  onSubmit(): void {
    const values = this.form.value;

    this.isLoading = true;
    this.cdr.markForCheck();
    let request$: Observable<unknown>;
    if (this.isNew) {
      request$ = this.ws.call('iscsi.target.create', [values]);
    } else {
      request$ = this.ws.call('iscsi.target.update', [this.editingTarget.id, values]);
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

  addGroup(): void {
    this.form.controls.groups.push(
      this.formBuilder.group({
        portal: [null as number, Validators.required],
        initiator: [null as number],
        authmethod: [IscsiAuthMethod.None, Validators.required],
        auth: [null as number],
      }),
    );
  }

  deleteGroup(index: number): void {
    this.form.controls.groups.removeAt(index);
  }

  addNetwork(): void {
    this.form.controls.auth_networks.push(
      this.formBuilder.control(''),
    );
  }

  deleteNetwork(index: number): void {
    this.form.controls.auth_networks.removeAt(index);
  }
}
