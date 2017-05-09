import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-storage-delete',
  template: `<entity-delete [conf]="this"></entity-delete>`
})
export class StorageDeleteComponent {

  protected resource_name: string = 'jails/mountpoints';
  protected route_success: string[];
  protected jail: any;

  constructor(protected router: Router, protected aroute: ActivatedRoute) {

  }

  afterInit(entityAdd: any) {
    this.aroute.params.subscribe(params => {
    	this.jail = params['jail'];
        this.route_success = ['jails', this.jail, 'storages'];
    });
  }
}
