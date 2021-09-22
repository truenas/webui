import { Component, Input } from '@angular/core';
import urls from 'app/helptext/urls';

@Component({
  selector: 'entity-comingsoon',
  templateUrl: './entity-comingsoon.component.html',
  styleUrls: ['./entity-comingsoon.component.scss', '../entity-form/entity-form.component.scss'],
  providers: [],
})
export class EntityComingsoonComponent {
  @Input() conf = { help_path: 'hub/scale/dev-notes/' };
  helpurl: string;

  constructor() {
    this.helpurl = urls.docurl;
    if (this.conf['help_path']) {
      this.helpurl = this.helpurl.concat(this.conf['help_path']);
    }
  }
}
