import { Component } from '@angular/core';

@Component({
  selector: 'app-iscsi-wizard',
  template: '<entity-wizard [conf]="this"></entity-wizard>'
})
export class IscsiWizardComponent {
    constructor() {
        
    }
}
