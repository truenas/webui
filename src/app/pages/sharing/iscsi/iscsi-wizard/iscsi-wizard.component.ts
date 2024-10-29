import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import {
  MatStepper, MatStep, MatStepLabel, MatStepperNext, MatStepperPrevious,
} from '@angular/material/stepper';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  lastValueFrom, forkJoin,
} from 'rxjs';
import { patterns } from 'app/constants/name-patterns.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetType } from 'app/enums/dataset.enum';
import {
  IscsiAuthMethod,
  IscsiExtentRpm,
  IscsiExtentType,
  IscsiExtentUsefor,
} from 'app/enums/iscsi.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import {
  IscsiAuthAccess,
  IscsiAuthAccessUpdate,
  IscsiExtent,
  IscsiExtentUpdate,
  IscsiInitiatorGroup,
  IscsiInitiatorGroupUpdate,
  IscsiInterface,
  IscsiPortal,
  IscsiPortalUpdate,
  IscsiTarget,
  IscsiTargetExtent,
  IscsiTargetExtentUpdate,
  IscsiTargetUpdate,
} from 'app/interfaces/iscsi.interface';
import { newOption } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { forbiddenValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { matchOthersFgValidator } from 'app/modules/forms/ix-forms/validators/password-validation/password-validation';
import {
  UseIxIconsInStepperComponent,
} from 'app/modules/ix-icon/use-ix-icons-in-stepper/use-ix-icons-in-stepper.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { WebSocketService } from 'app/services/ws.service';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { ServicesState } from 'app/store/services/services.reducer';
import { DeviceWizardStepComponent } from './steps/device-wizard-step/device-wizard-step.component';
import { InitiatorWizardStepComponent } from './steps/initiator-wizard-step/initiator-wizard-step.component';
import { PortalWizardStepComponent } from './steps/portal-wizard-step/portal-wizard-step.component';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-wizard',
  templateUrl: './iscsi-wizard.component.html',
  styleUrls: ['./iscsi-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    ReactiveFormsModule,
    MatStepper,
    MatStep,
    MatStepLabel,
    DeviceWizardStepComponent,
    MatButton,
    MatStepperNext,
    TestDirective,
    PortalWizardStepComponent,
    MatStepperPrevious,
    InitiatorWizardStepComponent,
    RequiresRolesDirective,
    TranslateModule,
    UseIxIconsInStepperComponent,
  ],
})
export class IscsiWizardComponent implements OnInit {
  isLoading = false;
  toStop = false;
  namesInUse: string[] = [];

  createdZvol: Dataset;
  createdExtent: IscsiExtent;
  createdAuthgroup: IscsiAuthAccess;
  createdPortal: IscsiPortal;
  createdInitiator: IscsiInitiatorGroup;
  createdTarget: IscsiTarget;
  createdTargetExtent: IscsiTargetExtent;

  form = this.fb.group({
    device: this.fb.group({
      name: ['', [
        Validators.required,
        forbiddenValues(this.namesInUse),
        Validators.pattern(patterns.targetDeviceName),
      ]],
      type: [IscsiExtentType.Disk, [Validators.required]],
      path: [mntPath, [Validators.required]],
      filesize: [0, [Validators.required]],
      disk: [null as string, [Validators.required]],
      dataset: ['', [Validators.required]],
      volsize: [null as number, [Validators.required]],
      usefor: [IscsiExtentUsefor.Vmware, [Validators.required]],
      target: [newOption as typeof newOption | number, [Validators.required]],
    }),
    portal: this.fb.group({
      portal: [null as typeof newOption | number, [Validators.required]],
      discovery_authmethod: [IscsiAuthMethod.None, [Validators.required]],
      discovery_authgroup: [null as typeof newOption | number],
      tag: [0, [Validators.min(0), Validators.required]],
      user: ['', [Validators.required]],
      secret: ['', [Validators.minLength(12), Validators.maxLength(16), Validators.required]],
      secret_confirm: ['', [Validators.required]],
      listen: this.fb.array<string>([]),
    }),
    initiator: this.fb.group({
      initiators: [[] as string[]],
    }),
  }, {
    validators: [
      matchOthersFgValidator(
        'portal.secret_confirm',
        ['portal.secret'],
        this.translate.instant('Secret Confirm must match Secret'),
      ),
    ],
  });

  readonly requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  get isNewZvol(): boolean {
    return this.form.controls.device.enabled && this.form.value.device.disk === newOption;
  }

  get isNewAuthgroup(): boolean {
    return this.form.controls.portal.controls.discovery_authgroup.enabled
      && this.form.value.portal.discovery_authgroup === newOption;
  }

  get isNewPortal(): boolean {
    return this.form.controls.portal.controls.portal.enabled && this.form.value.portal.portal === newOption;
  }

  get isNewTarget(): boolean {
    return this.form.value.device.target === newOption;
  }

  get isNewInitiator(): boolean {
    return this.form.controls.initiator.enabled;
  }

  get zvolPayload(): DatasetCreate {
    const value = this.form.value;
    return {
      name: value.device.dataset.replace(`${mntPath}/`, '') + '/' + value.device.name,
      type: DatasetType.Volume,
      volsize: value.device.volsize,
    };
  }

  get extentPayload(): IscsiExtentUpdate {
    const value = this.form.value.device;
    const blocksizeDefault = 512;
    const blocksizeModernos = 4096;
    const extentPayload = {
      name: value.name,
      type: value.type,
      blocksize: value.usefor === IscsiExtentUsefor.Modernos ? blocksizeModernos : blocksizeDefault,
      insecure_tpc: true,
      xen: value.usefor === IscsiExtentUsefor.Xen,
      rpm: IscsiExtentRpm.Ssd,
    } as IscsiExtentUpdate;

    if (extentPayload.type === IscsiExtentType.File) {
      const filesize = value.filesize;
      extentPayload.filesize = filesize % blocksizeDefault
        ? (filesize + (blocksizeDefault - filesize % blocksizeDefault))
        : filesize;
      extentPayload.path = value.path;
    } else if (extentPayload.type === IscsiExtentType.Disk) {
      if (value.disk === newOption) {
        extentPayload.disk = 'zvol/' + this.createdZvol.id.replace(' ', '+');
      } else {
        extentPayload.disk = value.disk;
      }
    }
    return extentPayload;
  }

  get authgroupPayload(): IscsiAuthAccessUpdate {
    const value = this.form.value.portal;
    return {
      tag: value.tag,
      user: value.user,
      secret: value.secret,
    } as IscsiAuthAccessUpdate;
  }

  get portalPayload(): IscsiPortalUpdate {
    const value = this.form.value;
    return {
      comment: value.device.name,
      discovery_authmethod: value.portal.discovery_authmethod,
      listen: value.portal.listen.map((ip) => ({ ip } as IscsiInterface)),
      discovery_authgroup: this.isNewAuthgroup ? this.createdAuthgroup.tag : undefined,
    };
  }

  get initiatorPayload(): IscsiInitiatorGroupUpdate {
    const value = this.form.value;
    return {
      comment: value.device.name,
      ...(value.initiator.initiators.length ? { initiators: value.initiator.initiators } : {}),
    };
  }

  get targetPayload(): IscsiTargetUpdate {
    const value = this.form.value;

    return {
      name: value.device.name,
      groups: [{
        portal: this.isNewPortal ? this.createdPortal.id : value.portal.portal,
        initiator: this.isNewInitiator ? this.createdInitiator.id : null,
        authmethod: IscsiAuthMethod.None,
        auth: null,
      }],
    } as IscsiTargetUpdate;
  }

  get targetExtentPayload(): IscsiTargetExtentUpdate {
    const value = this.form.value;

    return {
      target: this.isNewTarget ? this.createdTarget.id : value.device.target,
      extent: this.createdExtent.id,
    } as IscsiTargetExtentUpdate;
  }

  constructor(
    private fb: FormBuilder,
    private slideInRef: SlideInRef<IscsiWizardComponent>,
    private iscsiService: IscsiService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private store$: Store<ServicesState>,
  ) {
    this.iscsiService.getExtents().pipe(untilDestroyed(this)).subscribe((extents) => {
      this.namesInUse.push(...extents.map((extent) => extent.name));
    });
    this.iscsiService.getTargets().pipe(untilDestroyed(this)).subscribe((targets) => {
      this.namesInUse.push(...targets.map((target) => target.name));
    });
  }

  ngOnInit(): void {
    this.form.controls.device.controls.path.disable();
    this.form.controls.device.controls.filesize.disable();
    this.form.controls.device.controls.dataset.disable();
    this.form.controls.device.controls.volsize.disable();
    this.disablePortalGroup();

    this.form.controls.device.controls.target.valueChanges.pipe(untilDestroyed(this)).subscribe((target) => {
      if (target === newOption) {
        this.form.controls.portal.enable();
        this.form.controls.initiator.enable();
      } else {
        this.form.controls.portal.disable();
        this.form.controls.initiator.disable();
        this.disablePortalGroup();
      }
    });
  }

  disablePortalGroup(): void {
    this.form.controls.portal.controls.discovery_authmethod.disable();
    this.form.controls.portal.controls.discovery_authgroup.disable();
    this.form.controls.portal.controls.tag.disable();
    this.form.controls.portal.controls.user.disable();
    this.form.controls.portal.controls.secret.disable();
    this.form.controls.portal.controls.secret_confirm.disable();
    this.form.controls.portal.controls.listen.disable();
  }

  createZvol(payload: DatasetCreate): Promise<Dataset> {
    return lastValueFrom(this.ws.call('pool.dataset.create', [payload]));
  }

  createExtent(payload: IscsiExtentUpdate): Promise<IscsiExtent> {
    return lastValueFrom(this.ws.call('iscsi.extent.create', [payload]));
  }

  createAuthgroup(payload: IscsiAuthAccessUpdate): Promise<IscsiAuthAccess> {
    return lastValueFrom(this.ws.call('iscsi.auth.create', [payload]));
  }

  createPortal(payload: IscsiPortalUpdate): Promise<IscsiPortal> {
    return lastValueFrom(this.ws.call('iscsi.portal.create', [payload]));
  }

  createInitiator(payload: IscsiInitiatorGroupUpdate): Promise<IscsiInitiatorGroup> {
    return lastValueFrom(this.ws.call('iscsi.initiator.create', [payload]));
  }

  createTarget(payload: IscsiTargetUpdate): Promise<IscsiTarget> {
    return lastValueFrom(this.ws.call('iscsi.target.create', [payload]));
  }

  createTargetExtent(payload: IscsiTargetExtentUpdate): Promise<IscsiTargetExtent> {
    return lastValueFrom(this.ws.call('iscsi.targetextent.create', [payload]));
  }

  rollBack(): void {
    const requests = [];

    if (this.createdZvol) {
      requests.push(this.ws.call('pool.dataset.delete', [this.createdZvol.id, { recursive: true, force: true }]));
    }

    if (this.createdExtent) {
      requests.push(this.ws.call('iscsi.extent.delete', [this.createdExtent.id, true, true]));
    }

    if (this.createdAuthgroup) {
      requests.push(this.ws.call('iscsi.auth.delete', [this.createdAuthgroup.id]));
    }

    if (this.createdPortal) {
      requests.push(this.ws.call('iscsi.portal.delete', [this.createdPortal.id]));
    }

    if (this.createdInitiator) {
      requests.push(this.ws.call('iscsi.initiator.delete', [this.createdInitiator.id]));
    }

    if (this.createdTarget) {
      requests.push(this.ws.call('iscsi.target.delete', [this.createdTarget.id]));
    }

    if (this.createdTargetExtent) {
      requests.push(this.ws.call('iscsi.targetextent.delete', [this.createdTargetExtent.id]));
    }

    if (requests.length) {
      forkJoin(requests).pipe(untilDestroyed(this)).subscribe(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      });
    } else {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  handleError(err: unknown): void {
    this.toStop = true;
    this.dialogService.error(this.errorHandler.parseError(err));
  }

  async onSubmit(): Promise<void> {
    this.isLoading = true;
    this.toStop = false;

    this.createdZvol = undefined;
    this.createdExtent = undefined;
    this.createdAuthgroup = undefined;
    this.createdPortal = undefined;
    this.createdInitiator = undefined;
    this.createdTarget = undefined;
    this.createdTargetExtent = undefined;

    if (this.isNewZvol) {
      await this.createZvol(this.zvolPayload).then(
        (createdZvol) => this.createdZvol = createdZvol,
        (err: unknown) => this.handleError(err),
      );
    }

    if (this.toStop) {
      this.rollBack();
      return;
    }

    await this.createExtent(this.extentPayload).then(
      (createdExtent) => this.createdExtent = createdExtent,
      (err: unknown) => this.handleError(err),
    );

    if (this.toStop) {
      this.rollBack();
      return;
    }

    if (this.isNewAuthgroup) {
      await this.createAuthgroup(this.authgroupPayload).then(
        (createdAuthgroup) => this.createdAuthgroup = createdAuthgroup,
        (err: unknown) => this.handleError(err),
      );
    }

    if (this.toStop) {
      this.rollBack();
      return;
    }

    if (this.isNewPortal) {
      await this.createPortal(this.portalPayload).then(
        (createdPortal) => this.createdPortal = createdPortal,
        (err: unknown) => this.handleError(err),
      );
    }

    if (this.toStop) {
      this.rollBack();
      return;
    }

    if (this.isNewInitiator) {
      await this.createInitiator(this.initiatorPayload).then(
        (createdInitiator) => this.createdInitiator = createdInitiator,
        (err: unknown) => this.handleError(err),
      );
    }

    if (this.toStop) {
      this.rollBack();
      return;
    }

    if (this.isNewTarget) {
      await this.createTarget(this.targetPayload).then(
        (createdTarget) => this.createdTarget = createdTarget,
        (err: unknown) => this.handleError(err),
      );
    }

    if (this.toStop) {
      this.rollBack();
      return;
    }

    await this.createTargetExtent(this.targetExtentPayload).then(
      (createdTargetExtent) => this.createdTargetExtent = createdTargetExtent,
      (err: unknown) => this.handleError(err),
    );

    if (this.toStop) {
      this.rollBack();
      return;
    }

    this.store$.dispatch(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));

    this.loader.close();
    this.isLoading = false;
    this.cdr.markForCheck();
    this.slideInRef.close(true);
  }
}
