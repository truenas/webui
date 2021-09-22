import { Component, Input } from '@angular/core';
import { EntityAction, EntityRowDetails } from 'app/pages/common/entity/entity-table/entity-row-details/entity-row-details.interface';

@Component({
  selector: 'app-entity-row-details',
  styleUrls: ['./entity-row-details.component.scss'],
  templateUrl: './entity-row-details.component.html',
})
export class EntityRowDetailsComponent {
  @Input() conf: EntityRowDetails;

  isActionVisible(action: EntityAction): boolean {
    return this.conf.isActionVisible ? this.conf.isActionVisible(action.id, this.conf.config) : true;
  }
}
