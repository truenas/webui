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

import {AppLoaderService} from '../../../../services/app-loader/app-loader.service';
import {RestService} from '../../../../services/rest.service';
import {EntityUtils} from '../utils';

@Component({
  selector : 'entity-delete',
  templateUrl : './entity-delete.component.html',
  styleUrls : [ './entity-delete.component.css' ]
})
export class EntityDeleteComponent implements OnInit, OnDestroy {

  @Input('conf') conf: any;

  protected pk: any;
  public sub: any;
  public error: string;
  public data: Object = {};

  public busy: Subscription;

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected _injector: Injector,
              protected _appRef: ApplicationRef,
              protected loader: AppLoaderService) {}

  ngOnInit() {
    this.sub = this.route.params.subscribe(params => {
      if (this.conf.afterInit) {
        this.conf.afterInit(this);
      }
      if (this.conf.getPK) {
        this.conf.getPK.bind(this.conf)(this, params);
      } else {
        this.pk = params['pk'];
      }
      if (!this.conf.skipGet) {
        this.rest.get(this.conf.resource_name + '/' + this.pk + '/', {})
            .subscribe((res) => { this.data = res.data; },
                       () => { alert("Ooops! Failed to get!"); });
      }
    });
  }

  ngOnDestroy() { this.sub.unsubscribe(); }

  doSubmit() {
    let data = {};
    if (this.conf.clean) {
      data = this.conf.clean.bind(this.conf)(data);
    }
    this.loader.open();
    this.busy = this.rest.delete(this.conf.resource_name + '/' + this.pk, data)
                    .subscribe(
                        (res) => {
                          this.loader.close();
                          this.router.navigate(new Array('/').concat(
                              this.conf.route_success));
                        },
                        (res) => {
                          this.loader.close(); 
                          new EntityUtils().handleError(this, res); });
  }

  doCancel() {
    let route = this.conf.route_cancel;
    if (!route) {
      route = this.conf.route_success;
    }
    this.router.navigate(new Array('/').concat(route));
  }
}
