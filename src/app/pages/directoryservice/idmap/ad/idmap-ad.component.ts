import { ApplicationRef, Component, Injector, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-idmap-ad',
  template: `<entity-form [conf]="this"></entity-form>`,
})

export class IdmapAdComponent implements OnInit {
  protected resource_name: string = 'directoryservice/idmap/ad';
  public route_success: string[] = ['directoryservice', 'activedirectory'];
  protected service: any;

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'idmap_ad_range_low',
      placeholder: 'Range Low',
    },
    { type: 'input',
      name: 'idmap_ad_range_high',
      placeholder: 'Range High'
    },
    {
      type: 'checkbox',
      name: 'idmap_ad_schema_mode',
      placeholder: 'Schema mode',
    }
  ];

  protected targetDS: any;
  protected idmap: any;
  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService, protected ws: WebSocketService) {}

  ngOnInit() {
    this.route.params.subscribe((res)=>{
      if (res['service']) {
        this.service = res['service'];
        if (this.service === 'activedirectory') {
          this.targetDS = 1;
        }
      }
    })
    this.rest.get(this.resource_name, {}).subscribe((res) => {
      for (let i in res.data) {
        if (res.data[i].idmap_ds_type === this.targetDS) {
          this.idmap = res.data[i];
          console.log(this.idmap);
        }
      }
    });

  }

  goBack() {
    this.router.navigate(new Array('').concat(this.route_success));
  }

  onSubmit(event: Event) {}
}
