import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';

import { SystemGeneralService, DialogService } from '../../../services/';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_kmip } from 'app/helptext/system/kmip';
import * as _ from 'lodash';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/pages/common/entity/utils';

@Component({
    selector: `app-system-kmip`,
    template: `<entity-form [conf]="this"></entity-form>`,
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
                }
            ]
        }
    ];

    constructor(
        private systemGeneralService: SystemGeneralService,
        private dialogService: DialogService,
        private dialog: MatDialog) { }

    preInit() {
        const certificateFieldset = _.find(this.fieldSets, { class: 'certificate' });
        const certificateField = _.find(certificateFieldset.config, { name: 'certificate' });
        const certificateAuthorityField = _.find(certificateFieldset.config, { name: 'certificate_authority' });

        this.systemGeneralService.getCA().subscribe((res) => {
            for (let i = 0; i < res.length; i++) {
                certificateField.options.push({ label: res[i].name, value: res[i].id });
            }
        });
        this.systemGeneralService.getCertificates().subscribe((res) => {
            for (let i = 0; i < res.length; i++) {
                certificateAuthorityField.options.push({ label: res[i].name, value: res[i].id });
            }
        });
    }
    afterInit(entityForm) {
        this.entityForm = entityForm;
        this.fieldConfig = entityForm.fieldConfig
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
}