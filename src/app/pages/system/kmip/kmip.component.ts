import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';

import { SystemGeneralService, DialogService, WebSocketService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_kmip } from 'app/helptext/system/kmip';
import * as _ from 'lodash';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';

@Component({
    selector: `app-system-kmip`,
    templateUrl: './kmip.component.html',
    styleUrls: ['./kmip.component.css']
})
export class KmipComponent {
    protected queryCall = 'kmip.config';
    protected editCall = 'kmip.update';
    public isEntity = false;

    public entityForm: any;

    public fieldConfig: FieldConfig[] = [];
    public fieldSets: FieldSet[] = [
        {
            name: helptext_system_kmip.fieldset_server,
            class: 'server',
            label: true,
            width: '100%',
            config: [
                {
                    type: 'input',
                    name: 'server',
                    placeholder: helptext_system_kmip.server.placeholder,
                    tooltip: helptext_system_kmip.server.tooltip,
                    class: 'inline',
                    width: '50%'
                },
                {
                    type: 'input',
                    inputType: 'number',
                    name: 'port',
                    placeholder: helptext_system_kmip.port.placeholder,
                    tooltip: helptext_system_kmip.port.tooltip,
                    class: 'inline',
                    width: '50%'
                }
            ]
        },
        {
            name: helptext_system_kmip.fieldset_certificate,
            class: 'certificate',
            label: true,
            width: '100%',
            config: [
                {
                    type: 'select',
                    name: 'certificate',
                    placeholder: helptext_system_kmip.certificate.placeholder,
                    tooltip: helptext_system_kmip.certificate.tooltip,
                    options: [
                        { label: '---', value: null },
                    ],
                    class: 'inline',
                    width: '50%'
                },
                {
                    type: 'select',
                    name: 'certificate_authority',
                    placeholder: helptext_system_kmip.certificate_authority.placeholder,
                    tooltip: helptext_system_kmip.certificate_authority.tooltip,
                    options: [
                        { label: '---', value: null },
                    ],
                    class: 'inline',
                    width: '50%'
                }
            ]
        },
        {
            name: helptext_system_kmip.fieldset_management,
            class: 'management',
            label: true,
            width: '100%',
            config: [
                {
                    type: 'checkbox',
                    name: 'manage_sed_disks',
                    placeholder: helptext_system_kmip.manage_sed_disks.placeholder,
                    tooltip: helptext_system_kmip.manage_sed_disks.tooltip
                },
                {
                    type: 'checkbox',
                    name: 'manage_zfs_keys',
                    placeholder: helptext_system_kmip.manage_zfs_keys.placeholder,
                    tooltip: helptext_system_kmip.manage_zfs_keys.tooltip
                },
                {
                    type: 'checkbox',
                    name: 'enabled',
                    placeholder: helptext_system_kmip.enabled.placeholder,
                    tooltip: helptext_system_kmip.enabled.tooltip
                },
                {
                    type: 'checkbox',
                    name: 'change_server',
                    placeholder: helptext_system_kmip.change_server.placeholder,
                    tooltip: helptext_system_kmip.change_server.tooltip
                },
                {
                    type: 'checkbox',
                    name: 'validate',
                    placeholder: helptext_system_kmip.validate.placeholder,
                    tooltip: helptext_system_kmip.validate.tooltip
                },
                {
                    type: 'checkbox',
                    name: 'force_clear',
                    placeholder: helptext_system_kmip.force_clear.placeholder,
                    tooltip: helptext_system_kmip.force_clear.tooltip
                },
            ]
        }
    ];

    public showSpinner = true;
    public kmip_enabled;
    public sync_pending = false;

    constructor(
        private systemGeneralService: SystemGeneralService,
        private dialogService: DialogService,
        private dialog: MatDialog,
        private ws: WebSocketService) {
            this.ws.call(this.queryCall).subscribe(
                (res) => {
                    this.kmip_enabled = res.enabled;
                    if (this.kmip_enabled) {
                        this.ws.call('kmip.kmip_sync_pending').subscribe(
                            (isPending) => {
                                this.showSpinner = false;
                                this.sync_pending = isPending;
                            },
                            (penddingCallErr) => {
                                new EntityUtils().handleWSError(this, penddingCallErr, this.dialogService);
                            }
                        )
                    } else {
                        this.showSpinner = false;
                    }
                },
                (err) => {
                    new EntityUtils().handleWSError(this, err, this.dialogService);
                })
        }

    preInit() {
        const certificateFieldset = _.find(this.fieldSets, { class: 'certificate' });
        const certificateField = _.find(certificateFieldset.config, { name: 'certificate' });
        const certificateAuthorityField = _.find(certificateFieldset.config, { name: 'certificate_authority' });

        this.systemGeneralService.getCA().subscribe((res) => {
            for (let i = 0; i < res.length; i++) {
                certificateAuthorityField.options.push({ label: res[i].name, value: res[i].id });
            }
        });
        this.systemGeneralService.getCertificates().subscribe((res) => {
            for (let i = 0; i < res.length; i++) {
                certificateField.options.push({ label: res[i].name, value: res[i].id });
            }
        });
    }
    afterInit(entityForm) {
        this.entityForm = entityForm;
        this.fieldConfig = entityForm.fieldConfig;
    }

    customSubmit(data) {
        if (data['server'] === null) {
            data['server'] = '';
        }
        const dialogRef = this.dialog.open(EntityJobComponent, { data: { "title": helptext_system_kmip.jobDialog.title }, disableClose: true });
        dialogRef.componentInstance.setCall(this.editCall, [data]);
        dialogRef.componentInstance.submit();
        dialogRef.componentInstance.success.subscribe((res) => {
            dialogRef.close(true);
            this.entityForm.success = true;
            this.entityForm.formGroup.markAsPristine();
        });
        dialogRef.componentInstance.failure.subscribe((err) => {
            dialogRef.close(true);
            if (err.exc_info && err.exc_info.extra) {
                err.extra = err.exc_info.extra;
            }
            new EntityUtils().handleWSError(this, err, this.dialogService);
        });
    }

    syncKeys() {
        this.ws.call('kmip.sync_keys').subscribe(
            (res) => {
                this.dialogService.Info(helptext_system_kmip.syncInfoDialog.title, helptext_system_kmip.syncInfoDialog.info, '500px', 'info', true);
            },
            (err) => {
                new EntityUtils().handleWSError(this, err, this.dialogService);
            }
        )
    }

    clearSyncKeys() {
        this.ws.call('kmip.clear_sync_pending_keys').subscribe(
            (res) => {
                this.dialogService.Info(helptext_system_kmip.clearSyncKeyInfoDialog.title, helptext_system_kmip.clearSyncKeyInfoDialog.info, '500px', 'info', true);
            },
            (err) => {
                new EntityUtils().handleWSError(this, err, this.dialogService);
            }
        )
    }
}