import { NgForOf } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
    NgForOf,
    TestIdModule,
    TranslateModule,
  ],
})
export class SummaryComponent {
  @Input() summary: SummarySection[];
}
