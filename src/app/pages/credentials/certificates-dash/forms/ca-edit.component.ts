import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { WebSocketService, AppLoaderService } from '../../../../services/';
import * as _ from 'lodash';
import { ModalService } from 'app/services/modal.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import { EntityUtils } from '../../../common/entity/utils';
import { helptext_system_ca } from 'app/helptext/system/ca';
import { helptext_system_certificates } from 'app/helptext/system/certificates';

@Component({
  selector: 'app-ca-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class CertificateAuthorityEditComponent {

  protected queryCall: string = 'certificateauthority.query';
  protected editCall = 'certificateauthority.update';
  protected isEntity: boolean = true;
  protected queryCallOption: Array<any>;
  private getRow = new Subscription;
  private rowNum: any;
  private title: string;
  private incomingData: any;

  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: helptext_system_certificates.edit.fieldset_certificate,
      class: 'certificate',
      config: [
        {
        type: 'input',
        name: 'name',
        placeholder: helptext_system_certificates.edit.name.placeholder,
        tooltip: helptext_system_certificates.edit.name.tooltip,
        required: true,
        validation: helptext_system_certificates.edit.name.validation
      }
    ]
  },
  {
    name: 'spacer',
    class: 'spacer',
    config:[]
  },{
    name: 'Subject',
    label: true,
    class: 'subject',
    config: [
      {
        type: 'paragraph',
        name: 'country',
        paraText: `${helptext_system_certificates.add.country.placeholder}: `
      },
      {
        type: 'paragraph',
        name: 'state',
        paraText: `${helptext_system_certificates.add.state.placeholder}: `
      },
      {
        type: 'paragraph',
        name: 'city',
        paraText: `${helptext_system_certificates.add.city.placeholder}: `
      }
    ]
  },{
    name: 'Subject-col-2',
    class: 'subject lowerme',
    config: [
      {
        type: 'paragraph',
        name: 'organization',
        paraText: `${helptext_system_certificates.add.organization.placeholder}: `
      },
      {
        type: 'paragraph',
        name: 'organizational_unit',
        paraText: `${helptext_system_certificates.add.organizational_unit.placeholder}: `
      },
      {
        type: 'paragraph',
        name: 'email',
        paraText: `${helptext_system_certificates.add.email.placeholder}: `
      }
    ]
  }, {
    name: 'Subject Details',
    class: 'subject-details break-all',
    config: [
      {
        type: 'paragraph',
        name: 'common',
        paraText: `${helptext_system_certificates.add.common.placeholder}: `
      },
      {
        type: 'paragraph',
        name: 'san',
        paraText: `${helptext_system_certificates.add.san.placeholder}: `
      },
      {
        type: 'paragraph',
        name: 'DN',
        paraText: `${helptext_system_certificates.add.DN}: `
      }
    ]
  }, {
    name: 'spacer',
    class: 'spacer',
    config:[]
  },
  {
    name: 'Details',
    class: 'details',
    config: [
      {
        type: 'paragraph',
        name: 'cert_type',
        paraText: `${helptext_system_certificates.add.type}: `
      },
      {
        type: 'paragraph',
        name: 'root_path',
        paraText: `${helptext_system_certificates.add.path}: `
      },
      {
        type: 'paragraph',
        name: 'digest_algorithm',
        paraText: `${helptext_system_certificates.add.digest_algorithm.placeholder}: `
      },
      {
        type: 'paragraph',
        name: 'key_length',
        paraText: `${helptext_system_certificates.add.key_length.placeholder}: `
      },
      {
        type: 'paragraph',
        name: 'key_type',
        paraText: `${helptext_system_certificates.add.key_type.placeholder}: `
      },
      {
        name: 'certificate_label',
        type: 'paragraph',
        paraText: 'Certificate',
      },
      {
        type: 'button',
        name: 'certificate_view',
        customEventActionLabel: 'View',
        customEventMethod: () => {
          this.viewCertificate();
        }
      },
      {
        type: 'button',
        name: 'certificate_download',
        customEventActionLabel: 'Download',
        customEventMethod: () => {
          this.exportCertificate();
        }
      }
    ]
  }, {
    name: 'Details-col2',
    class: 'details-col-2',
    config: [
      {
        type: 'paragraph',
        name: 'until',
        paraText: `${helptext_system_certificates.add.unitl}: `
      },
      {
        type: 'paragraph',
        name: 'issuer',
        paraText: `${helptext_system_certificates.add.issuer}: `
      },
      {
        type: 'paragraph',
        name: 'revoked',
        paraText: `${helptext_system_certificates.add.revoked}: `
      },
      {
        type: 'paragraph',
        name: 'signed_by',
        paraText: `${helptext_system_certificates.add.signed_by}: `
      },
      {
        type: 'paragraph',
        name: 'lifetime',
        paraText: `${helptext_system_certificates.add.lifetime.placeholder}: `
      },
      {
        name: 'private_key_label',
        type: 'paragraph',
        paraText: 'Private Key'
      },

      {
        type: 'button',
        name: 'private_key_view',
        customEventActionLabel: 'View',
        customEventMethod: () => {
          this.viewKey();
        }
      },
      {
        type: 'button',
        name: 'private_key_download',
        customEventActionLabel: 'Download',
        customEventMethod: () => {
          this.exportKey();
        }
      }
    ]
    }
  ];

  constructor(protected ws: WebSocketService, protected loader: AppLoaderService,
    private modalService: ModalService) {
      this.getRow = this.modalService.getRow$.subscribe(rowId => {
        this.rowNum = rowId;
        this.queryCallOption = [["id", "=", rowId]];
        this.getRow.unsubscribe();
      })
  }

  resourceTransformIncomingRestData(data) {
    console.log(data);
    this.incomingData = data;
    this.setForm();
    return data;
  }

  setForm() {
    const fields = ['country', 'state', 'city', 'organization', 'organizational_unit', 'email', 'common', 'DN', 'cert_type',
      'root_path', 'digest_algorithm', 'key_length', 'key_type', 'until', 'revoked', 'signed_by', 'lifetime'];
    fields.forEach(field => {
      const paragraph = _.find(this.fieldConfig, { 'name': field });
      this.incomingData[field] || this.incomingData[field] === false ? 
        paragraph.paraText += this.incomingData[field] : paragraph.paraText += '---'; 
    })
    _.find(this.fieldConfig, { 'name': 'san' }).paraText += this.incomingData.san.join(',');
    const issuer = _.find(this.fieldConfig, { 'name': 'issuer' });
    if (_.isObject(this.incomingData.issuer)) {
      issuer.paraText += this.incomingData.issuer.name;
    } else {
      this.incomingData.issuer ? issuer.paraText += this.incomingData.issuer : issuer.paraText += '---';
    }
  }

  afterInit() {
    this.title = helptext_system_ca.edit.title;
  }

  viewCertificate() {

  }

  exportCertificate() {

  }

  viewKey() {

  }

  exportKey() {

  }
  
  customSubmit(value) {
    let payload = {};
    payload['name'] = value.name;

    this.loader.open();
    this.ws.call(this.editCall, [this.rowNum, payload]).subscribe(
      (res) => {
        this.loader.close();
        this.modalService.close('slide-in-form');
        this.modalService.refreshTable();
      },
      (res) => {
        this.loader.close();
        this.modalService.refreshTable();
        new EntityUtils().handleError(this, res);
      }
    );
  }
}
