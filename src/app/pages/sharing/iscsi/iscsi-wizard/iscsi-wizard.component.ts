import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { lastValueFrom } from 'rxjs';
import {
  IscsiAuthMethod,
  IscsiExtentRpm,
  IscsiExtentType,
  IscsiExtentUsefor,
  IscsiNewOption,
} from 'app/enums/iscsi.enum';
import { mntPath } from 'app/enums/mnt-path.enum';
import {
  IscsiExtent,
  IscsiExtentUpdate,
  IscsiInitiatorGroup,
  IscsiInitiatorGroupUpdate,
  IscsiTarget,
  IscsiTargetExtent,
  IscsiTargetExtentUpdate,
  IscsiTargetUpdate,
} from 'app/interfaces/iscsi.interface';
import { forbiddenValues } from 'app/modules/entity/entity-form/validators/forbidden-values-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, IscsiService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './iscsi-wizard.component.html',
  styleUrls: ['./iscsi-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IscsiWizardComponent implements OnInit {
  isLoading = false;
  namesInUse: string[] = [];

  createdExtent: IscsiExtent;
  createdInitiator: IscsiInitiatorGroup;
  createdTarget: IscsiTarget;
  createdTargetExtent: IscsiTargetExtent;

  form = this.fb.group({
    device: this.fb.group({
      name: ['', [Validators.required, forbiddenValues(this.namesInUse)]],
      type: [IscsiExtentType.Disk, [Validators.required]],
      path: [mntPath, [Validators.required]],
      filesize: [0, [Validators.required]],
      disk: [null as string, [Validators.required]],
      usefor: [IscsiExtentUsefor.Vmware, [Validators.required]],
      target: [IscsiNewOption.New as IscsiNewOption | number, [Validators.required]],
    }),
    portal: this.fb.group({
      portal: [null as number, [Validators.required]],
    }),
    initiator: this.fb.group({
      initiators: [[] as string[]],
    }),
  });

  get isNewTarget(): boolean {
    return this.form.value.device.target === IscsiNewOption.New;
  }

  get isNewInitiator(): boolean {
    return this.form.controls.initiator.enabled && !!this.form.value.initiator.initiators.length;
  }

  get extentPayload(): IscsiExtentUpdate {
    const value = this.form.value.device;
    const extentPayload = {
      name: value.name,
      type: value.type,
      blocksize: value.usefor === IscsiExtentUsefor.Modernos ? 4096 : 512,
      insecure_tpc: true,
      xen: value.usefor === IscsiExtentUsefor.Xen,
      rpm: IscsiExtentRpm.Ssd,
    } as IscsiExtentUpdate;

    if (extentPayload.type === IscsiExtentType.File) {
      const filesize = value.filesize;
      extentPayload.filesize = filesize % 512 ? (filesize + (512 - filesize % 512)) : filesize;
      extentPayload.path = value.path;
    } else if (extentPayload.type === IscsiExtentType.Disk) {
      extentPayload.disk = value.disk;
    }
    return extentPayload;
  }

  get initiatorPayload(): IscsiInitiatorGroupUpdate {
    const value = this.form.value;
    return {
      initiators: value.initiator.initiators,
      comment: value.device.name,
    };
  }

  get targetPayload(): IscsiTargetUpdate {
    const value = this.form.value;

    return {
      name: value.device.name,
      groups: [{
        portal: value.portal.portal,
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
    private slideInService: IxSlideInService,
    private iscsiService: IscsiService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
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

    this.form.controls.device.controls.target.valueChanges.pipe(untilDestroyed(this)).subscribe((target) => {
      if (target === IscsiNewOption.New) {
        this.form.controls.portal.enable();
        this.form.controls.initiator.enable();
      } else {
        this.form.controls.portal.disable();
        this.form.controls.initiator.disable();
      }
    });
  }

  createExtent(): Promise<IscsiExtent> {
    return lastValueFrom(this.ws.call('iscsi.extent.create', [this.extentPayload]));
  }

  createInitiator(): Promise<IscsiInitiatorGroup> {
    return lastValueFrom(this.ws.call('iscsi.initiator.create', [this.initiatorPayload]));
  }

  createTarget(): Promise<IscsiTarget> {
    return lastValueFrom(this.ws.call('iscsi.target.create', [this.targetPayload]));
  }

  createTargetExtent(): Promise<IscsiTargetExtent> {
    return lastValueFrom(this.ws.call('iscsi.targetextent.create', [this.targetExtentPayload]));
  }

  async onSubmit(): Promise<void> {
    this.isLoading = true;
    let toStop = false;
    this.createdExtent = undefined;
    this.createdInitiator = undefined;
    this.createdTarget = undefined;
    this.createdTargetExtent = undefined;

    await this.createExtent().then(
      (createdExtent) => this.createdExtent = createdExtent,
      (err) => {
        toStop = true;
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    );

    if (toStop) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    if (this.isNewInitiator) {
      await this.createInitiator().then(
        (createdInitiator) => this.createdInitiator = createdInitiator,
        (err) => {
          toStop = true;
          new EntityUtils().handleWsError(this, err, this.dialogService);
        },
      );
    }

    if (toStop) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    if (this.isNewTarget) {
      await this.createTarget().then(
        (createdTarget) => this.createdTarget = createdTarget,
        (err) => {
          toStop = true;
          new EntityUtils().handleWsError(this, err, this.dialogService);
        },
      );
    }

    if (toStop) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    await this.createTargetExtent().then(
      (createdTargetExtent) => this.createdTargetExtent = createdTargetExtent,
      (err) => {
        toStop = true;
        new EntityUtils().handleWsError(this, err, this.dialogService);
      },
    );

    if (toStop) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = false;
    this.cdr.markForCheck();
    this.slideInService.close();
  }
}
