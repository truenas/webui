import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { IscsiAuthMethod, IscsiTargetMode } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiTarget, IscsiTargetGroup } from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TargetNameValidationService } from 'app/pages/sharing/iscsi/target/target-name-validation.service';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-target-form',
  templateUrl: './target-form.component.html',
  styleUrls: ['./target-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxListComponent,
    IxListItemComponent,
    IxIpInputWithNetmaskComponent,
    IxSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class TargetFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingTarget;
  }

  get isAsyncValidatorPending(): boolean {
    return this.form.controls.name.status === 'PENDING' && this.form.controls.name.touched;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add ISCSI Target')
      : this.translate.instant('Edit ISCSI Target');
  }

  readonly helptext = helptextSharingIscsi;
  readonly portals$ = this.iscsiService.listPortals().pipe(
    map((portals) => {
      const opts: Option[] = portals.map((portal) => {
        const label = portal.comment ? `${portal.id} (${portal.comment})` : String(portal.id);
        return { label, value: portal.id };
      });

      return opts;
    }),
  );

  readonly initiators$ = this.iscsiService.getInitiators().pipe(
    map((initiators) => {
      const opts: Option[] = [];
      initiators.forEach((initiator) => {
        const initiatorsAllowed = initiator.initiators.length === 0
          ? this.translate.instant('ALL Initiators Allowed')
          : initiator.initiators.toString();
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
      const tags = uniq(auths.map((item) => item.tag));
      tags.forEach((tag) => {
        opts.push({ label: String(tag), value: tag });
      });
      return opts;
    }),
  );

  readonly requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  isLoading = false;

  form = this.formBuilder.group({
    name: [
      '',
      [Validators.required],
      [this.targetNameValidationService.validateTargetName(this.editingTarget?.name)],
    ],
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
    private slideInRef: SlideInRef<TargetFormComponent>,
    private targetNameValidationService: TargetNameValidationService,
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
        this.slideInRef.close(true);
      },
      error: (error: unknown) => {
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
