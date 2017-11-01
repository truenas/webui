import {Component} from '@angular/core';
import {
  FormGroup,
} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {RestService, WebSocketService} from '../../../../../services/';

@Component({
  selector : 'app-dataset-delete',
  template : `<entity-delete [conf]="this"></entity-delete>`
})
export class DatasetDeleteComponent {

  protected pk: any;
  protected path: string;
  public sub: Subscription;
  public deleteSnapshot: boolean = true;
  protected route_success: string[] = [ 'storage', 'volumes' ];
  get resource_name(): string {
    return 'storage/volume/' + this.pk + '/datasets/';
  }

  constructor(protected router: Router, protected aroute: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService) {}

  clean_name(value) {
    let start = this.path.split('/').splice(1).join('/');
    if (start != '') {
      return start + '/' + value;
    } else {
      return value;
    }
  }

  getPK(entityDelete, params) {
    this.pk = params['pk'];
    this.path = params['path'];
    entityDelete.pk = this.path.split('/').splice(1).join('/');
  }

  afterInit(entityAdd: any) {
  }
}
