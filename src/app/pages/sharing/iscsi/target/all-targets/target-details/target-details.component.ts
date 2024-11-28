import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';

@Component({
  selector: 'ix-target-details',
  templateUrl: './target-details.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
})
export class TargetDetailsComponent {}
