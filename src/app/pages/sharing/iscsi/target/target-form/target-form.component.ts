import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { IscsiAuthMethod, IscsiTargetMode, iscsiTargetModeNames } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSharingIscsi } from 'app/helptext/sharing';
import { IscsiTarget, IscsiTargetGroup } from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  FcPortsControlsComponent,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/fc-ports-controls/fc-ports-controls.component';
import { TargetNameValidationService } from 'app/pages/sharing/iscsi/target/target-name-validation.service';
import { FibreChannelService } from 'app/services/fibre-channel.service';
import { IscsiService } from 'app/services/iscsi.service';

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
    FcPortsControlsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    IxRadioGroupComponent,
  ],
})
export class TargetFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingTarget;
  }

  get isAsyncValidatorPending(): boolean {
    return this.form.controls.name.status === 'PENDING' && this.form.controls.name.touched;
  }

  get showPortControls(): boolean {
    return this.form.value.mode === IscsiTargetMode.Fc || this.form.value.mode === IscsiTargetMode.Both;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant('Add ISCSI Target')
      : this.translate.instant('Edit ISCSI Target');
  }

  hasFibreChannel = toSignal(this.iscsiService.hasFibreChannel());

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

  readonly modeOptions$ = of(mapToOptions(iscsiTargetModeNames, this.translate));

  protected readonly requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  isLoading = false;
  protected editingTarget: IscsiTarget | undefined = undefined;
  protected editingTargetPort: string | undefined = undefined;

  form = this.formBuilder.group({
    name: [
      '',
      [Validators.required],
    ],
    alias: [''],
    mode: [IscsiTargetMode.Iscsi],
    groups: this.formBuilder.array<IscsiTargetGroup>([]),
    auth_networks: this.formBuilder.array<string>([]),
  });

  fcForm = this.formBuilder.group({
    port: [null as string | null],
    host_id: [null as number | null, [Validators.required]],
  });

  constructor(
    protected iscsiService: IscsiService,
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private api: ApiService,
    private fcService: FibreChannelService,
    private targetNameValidationService: TargetNameValidationService,
    public slideInRef: SlideInRef<IscsiTarget | undefined, IscsiTarget>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.editingTarget = slideInRef.getData();

    this.form.controls.name.setAsyncValidators(
      [this.targetNameValidationService.validateTargetName(this.editingTarget?.name)],
    );
  }

  ngOnInit(): void {
    if (this.editingTarget) {
      this.setTargetForEdit(this.editingTarget);

      if ([IscsiTargetMode.Fc, IscsiTargetMode.Both].includes(this.editingTarget.mode)) {
        this.loadFibreChannelPort();
      }
    }
  }

  setTargetForEdit(target: IscsiTarget): void {
    Object.values(target.groups).forEach(() => this.addGroup());
    Object.values(target.auth_networks).forEach(() => this.addNetwork());

    this.form.patchValue({
      ...target,
    });
  }

  onSubmit(): void {
    const values = this.form.getRawValue();

    this.isLoading = true;
    this.cdr.markForCheck();
    let request$: Observable<IscsiTarget>;
    if (this.editingTarget) {
      request$ = this.api.call('iscsi.target.update', [this.editingTarget.id, values]);
    } else {
      request$ = this.api.call('iscsi.target.create', [values]);
    }

    request$.pipe(
      switchMap((target) => {
        if (!this.showPortControls) {
          return of(target);
        }

        return this.fcService.linkFiberChannelToTarget(
          target.id,
          this.fcForm.value.port,
          this.fcForm.value.host_id,
        ).pipe(map(() => target));
      }),
      untilDestroyed(this),
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.slideInRef.close({ response, error: null });
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.errorHandler.handleValidationErrors(error, this.form);
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

  private loadFibreChannelPort(): void {
    this.fcService.loadTargetPort(this.editingTarget.id).pipe(
      untilDestroyed(this),
    ).subscribe((port) => {
      if (port) {
        this.editingTargetPort = port.port;
        this.cdr.markForCheck();
      }
    });
  }
}
