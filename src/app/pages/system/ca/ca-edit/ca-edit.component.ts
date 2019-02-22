import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_ca as helptext } from 'app/helptext/system/ca';
import { RestService, WebSocketService } from '../../../../services/';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { EntityUtils } from '../../../common/entity/utils';

@Component({
  selector: 'app-ca-edit',
  template: `<entity-form [conf]="this"></entity-form>`
})
export class CertificateAuthorityEditComponent {

  protected queryCall: string = 'certificateauthority.query';
  protected editCall = 'certificateauthority.update';
  protected route_success: string[] = ['system', 'ca'];
  protected isEntity: boolean = true;
  protected queryCallOption: Array<any> = [["id", "="]];

  protected fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'name',
      placeholder: helptext.edit.name.placeholder,
       tooltip: helptext.edit.name.tooltip,
      required: true,
      validation: helptext.edit.name.validation
    },
    {
      type: 'textarea',
      name: 'certificate',
      placeholder: helptext.edit.certificate.placeholder,
      readonly: true,
    },
    {
      type: 'textarea',
      name: 'privatekey',
      placeholder: helptext.edit.privatekey.placeholder,
      readonly: true,
    },
  ];

  private pk: any;

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService,
    protected loader: AppLoaderService) {}

  preInit() {
    this.route.params.subscribe(params => {
      if (params['pk']) { 
        // fixme: entity-form should do this automatically but the logic appears broken
        // and i don't know what fixing it will break, tbf after release
        this.queryCallOption[0].push(parseInt(params['pk']));
      }
    });
  }

  afterInit(entityEdit: any) {
    this.route.params.subscribe(params => {
      if (params['pk']) {
        // see above, this should just be handled properly by entity-form
        this.pk = parseInt(params['pk']);
      }
    });
  }

  customSubmit(value) {
    let payload = {};
    payload['name'] = value.name;

    this.loader.open();
    this.ws.call(this.editCall, [this.pk, payload]).subscribe(
      (res) => {
        this.loader.close();
        this.router.navigate(new Array('/').concat(this.route_success));
      },
      (res) => {
        this.loader.close();
        new EntityUtils().handleError(this, res);
      }
    );
  }
}
