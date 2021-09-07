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
import { VmwareDatastore, MatchDatastoresWithDatasetsParams, VmwareFilesystem } from 'app/interfaces/vmware.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { WebSocketService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { T } from 'app/translate-marker';

@UntilDestroy()
@Component({
  selector: 'app-vmware-snapshot-form',
  template: '<entity-form [conf]="this"></entity-form>',
})

export class VmwareSnapshotFormComponent implements FormConfiguration {
  route_success: string[] = ['storage', 'vmware-snapshots'];
  isEntity = true;
  queryCall: 'vmware.query' = 'vmware.query';
  addCall: 'vmware.create' = 'vmware.create';
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
          blurEvent: this.passwordBlur,
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
      name: T('Fetch DataStores'),
      function: () => {
        this.datastore = _.find(this.fieldConfig, { name: 'datastore' });
        this.datastore.type = 'select';

        if (
          this.entityForm.formGroup.controls['hostname'].value === undefined
          || this.entityForm.formGroup.controls['username'].value === undefined
          || this.entityForm.formGroup.controls['password'].value === undefined
        ) { this.dialogService.info(T('VM Snapshot'), T('Enter valid VMware ESXI/vSphere credentials to fetch datastores.')); } else {
          this.passwordBlur(this);
        }
      },
    },
  ];

  resourceTransformIncomingRestData(data: any): any {
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
    const queryPayload: any[] = [];
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      queryPayload.push('id');
      queryPayload.push('=');
      queryPayload.push(parseInt(params['pk'], 10));
      this.pk = [queryPayload];
    });
  }

  afterInit(entityForm: EntityFormComponent): void {
    this.datastoreList = [];
    this.entityForm = entityForm;
    this.fieldConfig = entityForm.fieldConfig;

    if (this.entityForm.pk) {
      this.datastore = _.find(this.fieldConfig, { name: 'datastore' });
      this.datastore.options.length = 0;
    }

    this.entityForm.formGroup.controls['datastore'].valueChanges.pipe(untilDestroyed(this)).subscribe((res: any) => {
      this.datastoreList.forEach((e) => {
        if (res === e.name) {
          this.entityForm.formGroup.controls['filesystem'].setValue(e.filesystems[0]);
        }
      });
    });
  }

  beforeSubmit(value: any): void {
    if (value.filesystem !== undefined) {
      value.filesystem = value.filesystem;
    }
  }

  customSubmit(value: any): void {
    const payload = {
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
        secondObj.description = T('(No description)');
      }
      this.dialogService.confirm({
        title: T('Are you sure?'),
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
          this.router.navigate(new Array('/').concat(this.route_success));
        },
        (e_res) => {
          this.loader.close();
          this.dialogService.errorReport(T('Error'), e_res);
        });
      });
    } else {
      this.loader.open();
      this.ws.call(this.addCall, [payload]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (e_res) => {
        this.loader.close();
        this.dialogService.errorReport(T('Error'), e_res);
      });
    }
  }

  customEditCall(body: any): void {
    if (this.entityForm.pk) {
      this.loader.open();
      this.ws.call('vmware.update', [this.entityForm.pk, body]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      }, (error) => {
        this.loader.close();
        this.dialogService.errorReport(error.error, error.reason, error.trace.formatted);
      });
    } else {
      this.loader.open();
      this.ws.call('vmware.create', [body]).pipe(untilDestroyed(this)).subscribe(() => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      }, (error) => {
        this.loader.close();
        this.dialogService.errorReport(error.error, error.reason, error.trace.formatted);
      });
    }
  }

  passwordBlur(parent: this): void {
    if (parent.entityForm) {
      this.datastore = _.find(parent.fieldConfig, { name: 'datastore' });
      const payload: MatchDatastoresWithDatasetsParams = {
        hostname: parent.entityForm.formGroup.value.hostname,
        username: parent.entityForm.formGroup.value.username,
        password: parent.entityForm.formGroup.value.password,
      };

      if (payload['password'] !== '' && typeof (payload['password']) !== 'undefined') {
        parent.loader.open();
        parent.ws.call('vmware.match_datastores_with_datasets', [payload]).pipe(untilDestroyed(parent)).subscribe((res) => {
          res.filesystems.forEach((filesystem_item) => {
            const config: FormSelectConfig = _.find(parent.fieldConfig, { name: 'filesystem' });
            config.options.push(
              {
                label: filesystem_item.name, value: filesystem_item.name,
              },
            );
          });

          res.datastores.forEach((i) => {
            if (i.filesystems.length > 0) {
              parent.datastoreList.push(i);
            }
          });
          if (this.datastore.options.length > 0) {
            this.datastore.options.length = 0;
          }
          for (const key in res.datastores) {
            const datastores = res.datastores[key];
            this.datastore.options.push({ label: datastores.name, value: datastores.name });
          }

          parent.fileSystemList = res.filesystems;
          parent.dataListComplete = res.datastores;
          parent.loader.close();
        },
        (error: WebsocketError) => {
          this.datastore.options.length = 0;
          parent.loader.close();
          if (error.reason && error.reason.includes('[ETIMEDOUT]')) {
            parent.dialogService.errorReport(helptext.connect_err_dialog.title, helptext.connect_err_dialog.msg, '');
          } else {
            new EntityUtils().handleWSError(this, error, this.dialogService);
          }
        });
      }
    }
  }
}
