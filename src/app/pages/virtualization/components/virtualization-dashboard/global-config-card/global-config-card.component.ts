import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  GlobalConfigFormComponent,
} from 'app/pages/virtualization/components/virtualization-dashboard/global-config-card/global-config-form/global-config-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-config-card',
  templateUrl: './global-config-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatButton,
    TestDirective,
  ],
})
export class GlobalConfigCardComponent {
  constructor(
    private slideIn: IxChainedSlideInService,
  ) {}

  onEdit(): void {
    this.slideIn
      .open(GlobalConfigFormComponent)
      .pipe(untilDestroyed(this))
      .subscribe(() => {

      });
  }
}
