import { SelectionModel } from '@angular/cdk/collections';
import {
  Component, ChangeDetectionStrategy,
  signal, computed, inject, AfterViewInit,
} from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { InstanceRowComponent } from 'app/pages/virtualization/components/all-instances/instance-list/instance-row/instance-row.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-list',
  templateUrl: './instance-list.component.html',
  styleUrls: ['./instance-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    SearchInput1Component,
    FakeProgressBarComponent,
    InstanceRowComponent,
    MatCheckboxModule,
    RequiresRolesDirective,
    EmptyComponent,
  ],
})

export class InstanceListComponent implements AfterViewInit {
  protected readonly requireRoles = [Role.VirtInstanceWrite];
  protected readonly searchQuery = signal<string>('');
  protected readonly showMobileDetails = signal<boolean>(false);
  protected readonly isMobileView = signal(false);
  protected readonly window = inject<Window>(WINDOW);
  protected readonly selection = new SelectionModel<string>(true, []);

  protected readonly instances = this.store.instances;
  protected readonly isLoading = this.store.isLoading;
  protected readonly selectedInstance = this.store.selectedInstance;

  protected readonly isAllSelected = computed(() => {
    return this.selection.selected.length === this.instances().length;
  });

  protected readonly filteredInstances = computed(() => {
    return this.instances()
      .filter((instance) => {
        return instance?.name?.toLocaleLowerCase()
          .includes(this.searchQuery().toLocaleLowerCase());
      });
  });

  protected readonly emptyConfig = computed<EmptyConfig>(() => {
    if (this.searchQuery()?.length && !this.filteredInstances()?.length) {
      return {
        type: EmptyType.NoSearchResults,
        title: this.translate.instant('No Search Results.'),
        message: this.translate.instant('No matching results found'),
        large: true,
      };
    }
    return {
      type: EmptyType.NoPageData,
      title: this.translate.instant('No instances'),
      message: this.translate.instant('Instances you created will automatically appear here.'),
      large: true,
    };
  });

  constructor(
    private store: VirtualizationInstancesStore,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private ws: WebSocketService,
    private dialog: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngAfterViewInit(): void {
    this.activatedRoute.paramMap.pipe(
      untilDestroyed(this),
    ).subscribe((params) => {
      this.selectForDetails(params.get('id'));
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  toggleAllChecked(checked: boolean): void {
    if (checked) {
      this.instances().forEach((instance) => this.selection.select(instance.id));
    } else {
      this.selection.clear();
    }
  }

  viewDetails(instance: VirtualizationInstance): void {
    this.selectForDetails(instance.id);

    this.router.navigate(['/virtualization', 'view', instance.id]);

    if (this.isMobileView()) {
      this.showMobileDetails.set(true);

      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  private selectForDetails(instanceId: string): void {
    if (!this.instances()?.length) {
      return;
    }

    const selected = instanceId && this.instances().find((instance) => instance.id === instanceId);
    if (selected) {
      this.store.selectInstance(selected.id);
      return;
    }

    this.selectFirstInstance();
  }

  private selectFirstInstance(): void {
    const [first] = this.instances();

    if (first) {
      this.store.selectInstance(first.id);
    }
  }

  closeMobileDetails(): void {
    this.showMobileDetails.set(false);
  }

  restart(instanceId: string): void {
    this.dialog.jobDialog(
      this.ws.job('virt.instance.restart', [instanceId, {}]),
      { title: this.translate.instant('Restarting...') },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }

  start(instanceId: string): void {
    this.dialog.jobDialog(
      this.ws.job('virt.instance.start', [instanceId]),
      { title: this.translate.instant('Starting...') },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }

  stop(instanceId: string): void {
    this.dialog.jobDialog(
      this.ws.job('virt.instance.stop', [instanceId, {}]),
      { title: this.translate.instant('Stopping...') },
    )
      .afterClosed()
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe();
  }
}
