import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  GlobalConfigFormComponent,
} from 'app/pages/virtualization/components/all-instances/all-instances-header/global-config-form/global-config-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-all-instances-header',
  templateUrl: './all-instances-header.component.html',
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
    MatAnchor,
    RouterLink,
  ],
})
export class AllInstancesHeaderComponent {
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
