import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  templateUrl: './add-vdevs.component.html',
  styleUrls: ['./add-vdevs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddVdevsComponent {
}
