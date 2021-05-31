import {
  Component, Input,
} from '@angular/core';

@Component({
  selector: 'wizard-summary',
  templateUrl: './wizard-summary.component.html',
  styleUrls: ['../../entity-wizard.component.scss'],
})
export class WizardSummaryComponent {
  @Input('data') data: any;
  @Input('isRoot') isRoot: boolean;

  isArray(value: any): boolean {
    return Array.isArray(value);
  }

  originalOrder(): void {

  }
}
