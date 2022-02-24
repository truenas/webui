import {
  Component,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { filter } from 'rxjs/operators';
import helptext from 'app/helptext/storage/vmware-snapshot/vmware-snapshot';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import {
  VmwareDatastore,
  MatchDatastoresWithDatasetsParams,
  VmwareFilesystem,
  VmwareSnapshotUpdate, VmwareSnapshot,
} from 'app/interfaces/vmware.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { EntityFormComponent } from 'app/modules/entity/entity-form/entity-form.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/modules/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { WebSocketService } from 'app/services';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'app-vmware-snapshot-form',
  template: '<entity-form [conf]="this"></entity-form>',
})

export class VmwareSnapshotFormComponent implements FormConfiguration {
  routeSuccess: string[] = ['storage', 'vmware-snapshots'];
  isEntity = true;
  queryCall = 'vmware.query' as const;
  addCall = 'vmware.create' as const;
  pk: any;
  formGroup: FormGroup;

  protected entityForm: EntityFormComponent;
  private datastore: FormSelectConfig;
  private datastoreList: VmwareDatastore[];
  private dataListComplete: VmwareDatastore[];
  private fileSystemList: VmwareFilesystem[];

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet<this>[] = [
    {
      name: helptext.fieldset_vmsnapshot,
      label: true,
      class: 'general',
      width: '49%',
      config: [
        {
          type: 'input',
          name: 'hostname',
          placeholder: helptext.VMware_snapshot_form_hostname_placeholder,
          tooltip: helptext.VMware_snapshot_form_hostname_tooltip,
          validation: helptext.VMware_snapshot_form_hostname_validation,
          required: true,
        },
        {
          type: 'input',
          name: 'username',
          placeholder: helptext.VMware_snapshot_form_username_placeholder,
          tooltip: helptext.VMware_snapshot_form_username_tooltip,
          validation: helptext.VMware_snapshot_form_username_validation,
          required: true,
        },
        {
          type: 'input',
          name: 'password',
          placeholder: helptext.VMware_snapshot_form_password_placeholder,
          tooltip: helptext.VMware_snapshot_form_password_tooltip,
          inputType: 'password',
          validation: helptext.VMware_snapshot_form_password_validation,
          required: true,
          blurStatus: true,
          parent: this,
          blurEvent: () => this.passwordBlur(),
          togglePw: true,
        },
        {
          type: 'select',
          name: 'filesystem',
          placeholder: helptext.VMware_snapshot_form_filesystem_placeholder,
          tooltip: helptext.VMware_snapshot_form_filesystem_tooltip,
          validation: helptext.VMware_snapshot_form_filesystem_validation,
          required: true,
          options: [],
        },
        {
          type: 'select',
          name: 'datastore',
          placeholder: helptext.VMware_snapshot_form_datastore_placeholder,
          tooltip: helptext.VMware_snapshot_form_datastore_tooltip,
          validation: helptext.VMware_snapshot_form_datastore_validation,
          required: true,
          options: [],
        },
      ],
    },
  ];

  custActions = [
    {
      id: 'FetchDataStores',
      name: this.translate.instant('Fetch DataStores'),
      function: () => {
        this.datastore = _.find(this.fieldConfig, { name: 'datastore' }) as FormSelectConfig;
        this.datastore.type = 'select';

        if (
          this.entityForm.formGroup.controls['hostname'].value === undefined
          || this.entityForm.formGroup.controls['username'].value === undefined
          || this.entityForm.formGroup.controls['password'].value === undefined
        ) { this.dialogService.info(this.translate.instant('VM Snapshot'), this.translate.instant('Enter valid VMware ESXI/vSphere credentials to fetch datastores.')); } else {
          this.passwordBlur();
        }
      },
    },
  ];

  resourceTransformIncomingRestData(data: VmwareSnapshot): VmwareSnapshot {
    data.password = '';
    return data;
  }

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    private translate: TranslateService,
  ) { }

  preInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = [['id', '=', parseInt(params['pk'], 10)]];
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.datastoreList = [];
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;

    if (this.entityForm.pk) {
      this.datastore = _.find(this.fieldConfig, { name: 'datastore' }) as FormSelectConfig;
      this.datastore.options.length = 0;
    }

    this.entityForm.formGroup.controls['datastore'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.datastoreList.forEach((datastore) => {
        if (res === datastore.name) {
          this.entityForm.formGroup.controls['filesystem'].setValue(datastore.filesystems[0]);
        }
      });
    });
  }

  customSubmit(value: VmwareSnapshotUpdate): void {
    const payload: VmwareSnapshotUpdate = {
      datastore: value.datastore,
      filesystem: value.filesystem,
      hostname: value.hostname,
      username: value.username,
      password: value.password,
    };
    // Looks for a mismatch and raises a confirm dialog if there is one; otherwise saves w/o the dialog
    const dataStoreMatch = this.datastoreList.find((item) => item.name === value.datastore);
    if (
      !dataStoreMatch
      || (dataStoreMatch.name === value.datastore && dataStoreMatch.filesystems[0] !== value.filesystem)
    ) {
      const firstObj = this.fileSystemList.find((item) => item.name === value.filesystem);
      const secondObj = this.dataListComplete.find((item) => item.name === value.datastore);
      if (secondObj.description === '') {
        secondObj.description = this.translate.instant('(No description)');
      }
      this.dialogService.confirm({
        title: this.translate.instant('Are you sure?'),
        message: this.translate.instant(
          'The filesystem {filesystemName} is {filesystemDescription}, but datastore {datastoreName} is {datastoreDescription}. Is this correct?',
          {
            filesystemName: firstObj.name,
            filesystemDescription: firstObj.description,
            datastoreName: secondObj.name,
            datastoreDescription: secondObj.description,
          },
        ),
        hideCheckBox: true,
      }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
        this.loader.open();
        this.ws.call(this.addCall, [payload]).pipe(untilDestroyed(this)).subscribe(() => {
          this.loader.close();
          this.router.navigate(new Array('/').concat(this.routeSuccess));
        },
        (error) => {
          this.loader.close();
          this.dialogService.errorReport(this.translate.instant('Error'), error);
        });
      });
    } else {
      this.loader.open();
      this.ws.call(this.addCall, [payload]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.routeSuccess));
      },
      (error) => {
        this.loader.close();
        this.dialogService.errorReport(this.translate.instant('Error'), error);
      });
    }
  }

  customEditCall(body: VmwareSnapshotUpdate): void {
    if (this.entityForm.pk) {
      this.loader.open();
      this.ws.call('vmware.update', [this.entityForm.pk, body]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.routeSuccess));
      }, (error) => {
        this.loader.close();
        this.dialogService.errorReport(error.error, error.reason, error.trace.formatted);
      });
    } else {
      this.loader.open();
      this.ws.call('vmware.create', [body]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.routeSuccess));
      }, (error) => {
        this.loader.close();
        this.dialogService.errorReport(error.error, error.reason, error.trace.formatted);
      });
    }
  }

  passwordBlur(): void {
    if (this.entityForm) {
      this.datastore = _.find(this.fieldConfig, { name: 'datastore' }) as FormSelectConfig;
      const payload: MatchDatastoresWithDatasetsParams = {
        hostname: this.entityForm.formGroup.value.hostname,
        username: this.entityForm.formGroup.value.username,
        password: this.entityForm.formGroup.value.password,
      };

      if (payload['password'] !== '' && typeof (payload['password']) !== 'undefined') {
        this.loader.open();
        this.ws.call('vmware.match_datastores_with_datasets', [payload]).pipe(untilDestroyed(this)).subscribe((res) => {
          res.filesystems.forEach((vmFilesystem) => {
            const config = _.find(this.fieldConfig, { name: 'filesystem' }) as FormSelectConfig;
            config.options.push(
              {
                label: vmFilesystem.name, value: vmFilesystem.name,
              },
            );
          });

          res.datastores.forEach((i) => {
            if (i.filesystems.length > 0) {
              this.datastoreList.push(i);
            }
          });
          if (this.datastore.options.length > 0) {
            this.datastore.options.length = 0;
          }
          res.datastores.forEach((datastore) => {
            this.datastore.options.push({ label: datastore.name, value: datastore.name });
          });

          this.fileSystemList = res.filesystems;
          this.dataListComplete = res.datastores;
          this.loader.close();
        },
        (error: WebsocketError) => {
          this.datastore.options.length = 0;
          this.loader.close();
          if (error.reason && error.reason.includes('[ETIMEDOUT]')) {
            this.dialogService.errorReport(helptext.connect_err_dialog.title, helptext.connect_err_dialog.msg, '');
          } else {
            new EntityUtils().handleWsError(this, error, this.dialogService);
          }
        });
      }
    }
  }
}
