import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AvailableApp } from 'app/interfaces/available-app.interface';

@UntilDestroy()
@Component({
  selector: 'ix-app-card',
  templateUrl: './app-card.component.html',
  styleUrls: ['./app-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppCardComponent {
  @Input() app: AvailableApp;

  get description(): string {
    const description = this.app.description || '';
    return description.length > 150 ? `${description.substring(0, 150)}...` : description;
  }
}
