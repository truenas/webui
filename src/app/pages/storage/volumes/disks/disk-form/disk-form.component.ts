import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { RestService } from '../../../../../services/';
import filesize from 'filesize';
import { debug } from 'util';
import { EntityUtils } from '../../../../common/entity/utils';

@Component({
  selector : 'app-disk-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DiskFormComponent {

  constructor(
    private _router: Router
  ) {}
}
