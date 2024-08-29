import {
  AfterViewInit, ChangeDetectionStrategy, Component, Input,
  signal,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ChainedRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/chained-component-ref';
import { AuthService } from 'app/services/auth/auth.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { AsyncPipe } from '@angular/common';
import { MatProgressBar } from '@angular/material/progress-bar';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { MatTooltip } from '@angular/material/tooltip';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { MatIconButton } from '@angular/material/button';

@UntilDestroy()
@Component({
  selector: 'ix-modal-header2',
  templateUrl: './ix-modal-header2.component.html',
  styleUrls: ['./ix-modal-header2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    TestIdModule,
    MatTooltip,
    IxIconModule,
    ReadOnlyComponent,
    MatProgressBar,
    AsyncPipe,
    TranslateModule,
  ],
})
export class IxModalHeader2Component implements AfterViewInit {
  @Input() title: string;
  @Input() loading: boolean;
  @Input() disableClose = false;
  @Input() requiredRoles: Role[] = [];

  protected componentsSize = signal(1);

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles);
  }

  tooltip = this.translate.instant('Close the form');

  constructor(
    private translate: TranslateService,
    private chainedSlideIn: IxChainedSlideInService,
    private chainedSlideInRef: ChainedRef<unknown>,
    private authService: AuthService,
  ) {}

  ngAfterViewInit(): void {
    this.chainedSlideIn.components$.pipe(
      untilDestroyed(this),
    ).subscribe((components) => {
      this.componentsSize.set(components.length);
      if (components.length > 1) {
        this.tooltip = this.translate.instant('Go back to the previous form');
      } else {
        this.tooltip = this.translate.instant('Close the form');
      }
    });
  }

  close(): void {
    this.chainedSlideInRef.close({ response: false, error: null });
  }
}
