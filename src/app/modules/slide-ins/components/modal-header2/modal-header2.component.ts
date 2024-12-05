import { AsyncPipe } from '@angular/common';
import {
  AfterViewInit, ChangeDetectionStrategy, Component, input,
  signal,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AuthService } from 'app/services/auth/auth.service';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-modal-header2',
  templateUrl: './modal-header2.component.html',
  styleUrls: ['./modal-header2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    MatTooltip,
    IxIconComponent,
    ReadOnlyComponent,
    MatProgressBar,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class ModalHeader2Component implements AfterViewInit {
  readonly title = input<string>();
  readonly loading = input<boolean>();
  readonly disableClose = input(false);
  readonly requiredRoles = input<Role[]>([]);

  protected componentsSize = signal(1);

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles());
  }

  tooltip = this.translate.instant('Close the form');

  constructor(
    private translate: TranslateService,
    private chainedSlideIn: ChainedSlideInService,
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
