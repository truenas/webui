import {
  ApplicationRef,
  Component,
  Injector,
  Input,
  OnDestroy,
  OnInit
} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Subscription} from 'rxjs';

import {RestService, WebSocketService} from '../../../../services/';
import {EntityUtils} from '../../../common/entity/utils';

@Component({
  selector : 'snapshot-rollback',
  templateUrl : './snapshot-rollback.component.html'
})
export class SnapshotRollbackComponent implements OnInit {

  public resource_name: string = 'storage/snapshot';
  public route_success: string[] = [ 'storage', 'snapshots' ];
  public pk: string;
  // add success and error messages
  public error: any;
  public success: any;
  public busy: Subscription;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected _injector: Injector,
              protected _appRef: ApplicationRef) {}

  ngOnInit() {
    this.route.params.subscribe(params => { this.pk = params['pk']; });
  }

  doSubmit() {
    let data = {"force" : true};

    this.rest
        .post(this.resource_name + '/' + this.pk + '/rollback/', {
          body : JSON.stringify(data),
        })
        .subscribe(
            (res) => {
              this.router.navigate(
                  new Array('').concat(this.route_success));
            },
            (res) => { new EntityUtils().handleError(this, res); });
  }

  doCancel() {
    this.router.navigate(new Array('').concat(this.route_success));
  }
}
