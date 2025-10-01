import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardActions, MatCardContent, MatCardHeader,
  MatCardTitle,
} from '@angular/material/card';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { containerCapabilitiesPolicyLabels } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-general-info',
  templateUrl: './instance-general-info.component.html',
  styleUrls: ['./instance-general-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardTitle,
    MatCardHeader,
    MatCardActions,
    MatCardContent,
    TranslateModule,
    YesNoPipe,
    MapValuePipe,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class InstanceGeneralInfoComponent {
  protected formatter = inject(IxFormatterService);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private router = inject(Router);
  private loader = inject(LoaderService);

  instance = input.required<VirtualizationInstance>();

  protected readonly Role = Role;
  protected readonly containerCapabilitiesPolicyLabels = containerCapabilitiesPolicyLabels;

  editInstance(): void {
    this.router.navigate(['/containers/edit', this.instance().id]);
  }

  deleteInstance(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Delete {name}?', { name: this.instance().name }),
      buttonColor: 'warn',
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        this.loader.open();
        return this.api.call('container.delete', [this.instance().id]);
      }),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.loader.close();
        this.router.navigate(['/containers'], { state: { hideMobileDetails: true } });
      },
      error: () => {
        this.loader.close();
      },
    });
  }
}
