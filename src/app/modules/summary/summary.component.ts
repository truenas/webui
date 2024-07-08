import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SummarySection } from 'app/modules/summary/summary.interface';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestIdModule,
    TranslateModule,
  ],
})
export class SummaryComponent {
  readonly summary = input.required<SummarySection[]>();
}
