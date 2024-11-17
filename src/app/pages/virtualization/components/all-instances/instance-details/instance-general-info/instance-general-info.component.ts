import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
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
import { virtualizationStatusLabels } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { InstanceEditFormComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-edit-form/instance-edit-form.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-general-info',
  templateUrl: './instance-general-info.component.html',
  styleUrls: ['./instance-general-info.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardTitle,
    MatCardHeader,
    MatCardActions,
    TranslateModule,
    MatCardContent,
    YesNoPipe,
    RequiresRolesDirective,
    KeyValuePipe,
    TestDirective,
    MapValuePipe,
  ],
})
export class InstanceGeneralInfoComponent {
  instance = input.required<VirtualizationInstance>();

  protected readonly Role = Role;
  protected readonly virtualizationStatusLabels = virtualizationStatusLabels;

  constructor(
    protected formatter: IxFormatterService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private ws: ApiService,
    private errorHandler: ErrorHandlerService,
    private router: Router,
    private slideInService: SlideInService,
    private instancesStore: VirtualizationInstancesStore,
  ) {}

  editInstance(): void {
    this.slideInService.open(InstanceEditFormComponent, { data: this.instance() });
  }

  deleteInstance(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Delete {name}?', { name: this.instance().name }),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.dialogService.jobDialog(
          this.ws.job('virt.instance.delete', [this.instance().id]),
        ).afterClosed();
      }),
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.instancesStore.selectInstance(null);
      this.router.navigate(['/virtualization'], { state: { hideMobileDetails: true } });
    });
  }
}
