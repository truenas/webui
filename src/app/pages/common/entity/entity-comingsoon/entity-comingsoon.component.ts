import { Component, Input } from '@angular/core';
import * as _ from 'lodash';
import urls from '../../../../helptext/urls';

@Component({
  selector: 'entity-comingsoon',
  templateUrl: './entity-comingsoon.component.html',
  styleUrls: ['./entity-comingsoon.component.css', '../entity-form/entity-form.component.scss'],
  providers: []
})
export class EntityComingsoonComponent {
  @Input('conf') conf = {help_path:'hub/scale/dev-notes/'};
  public helpurl: any; 

  constructor() {

    this.helpurl = urls.docurl;
    if (this.conf['help_path']) {
      this.helpurl = this.helpurl.concat(this.conf['help_path']);
    }
  }

}
