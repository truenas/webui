import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { Role } from 'app/enums/role.enum';
import { AlertCategory, AlertClass, AlertClasses } from 'app/interfaces/alert.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-alert-settings2',
  templateUrl: './alert-settings2.component.html',
  styleUrls: ['./alert-settings2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    MatButton,
    TestDirective,
    RouterLink,
    MatCard,
    MatToolbarRow,
    RequiresRolesDirective,
    MatCardContent,
    MatList,
    MatListItem,
    IxIconComponent,
    IxInputComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class AlertSettings2Component implements OnInit {
  protected readonly requiredRoles = [Role.FullAdmin];

  categories: AlertCategory[] = [];
  alertClasses: AlertClasses;

  searchControl = this.fb.control('');
  searchOptions: Option[] = [];

  policyOptions: string[] = [];

  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService,
  ) { }

  ngOnInit(): void {
    this.loadCategories();
    this.loadClassesConfig();
    this.loadPolicyOptions();
    this.handleSearchControl();
  }

  loadCategories(): void {
    this.ws.call('alert.list_categories').pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (categories) => {
        this.categories = categories;
        this.updateSearchOption();
        this.cdr.markForCheck();
      },
    });
  }

  loadClassesConfig(): void {
    this.ws.call('alertclasses.config').pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (alertConfig) => {
        this.alertClasses = alertConfig;
        this.cdr.markForCheck();
      },
    });
  }

  loadPolicyOptions(): void {
    this.ws.call('alert.list_policies').pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (policies) => {
        this.policyOptions = policies;
        this.cdr.markForCheck();
      },
    });
  }

  getPolicy(cls: AlertClass): AlertPolicy {
    return this.alertClasses?.classes[cls.id]?.policy || AlertPolicy.Immediately;
  }

  getLevel(cls: AlertClass): AlertLevel {
    return this.alertClasses?.classes[cls.id]?.level || cls.level;
  }

  updateSearchOption(): void {
    this.searchOptions = [];
    for (const category of this.categories) {
      this.searchOptions.push({
        label: category.title,
        value: category.id,
      } as Option);
    }
  }

  categoryClick(categoryId: string): void {
    document.getElementById(categoryId)?.scrollIntoView();
    this.cdr.markForCheck();
  }

  private handleSearchControl(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((value) => {
      const option = this.searchOptions.find((opt) => opt.value === value)
        || this.searchOptions.find((opt) => opt.label.toLocaleLowerCase() === value.toLocaleLowerCase());

      if (option) {
        const path = option.value.toString();
        const nextElement: HTMLElement = document.getElementById(path);
        nextElement?.scrollIntoView();
      }
    });
  }

  getLevelColor(level: AlertLevel): string {
    switch (level) {
      case AlertLevel.Info:
      case AlertLevel.Notice:
        return this.themeService.getActiveTheme().primary;
      case AlertLevel.Alert:
        return this.themeService.getActiveTheme().yellow;
      case AlertLevel.Warning:
        return this.themeService.getActiveTheme().orange;
      case AlertLevel.Critical:
      case AlertLevel.Error:
      case AlertLevel.Emergency:
        return this.themeService.getActiveTheme().red;
      default:
        return this.themeService.getActiveTheme().primary;
    }
  }

  getIconName(level: AlertLevel): string {
    switch (level) {
      case AlertLevel.Info:
        return 'info';
      case AlertLevel.Notice:
        return 'event';
      case AlertLevel.Alert:
        return 'notifications_active';
      case AlertLevel.Warning:
        return 'warning';
      case AlertLevel.Critical:
        return 'local_fire_department';
      case AlertLevel.Error:
        return 'error';
      case AlertLevel.Emergency:
        return 'crisis_alert';
      default:
        return 'info';
    }
  }

  protected readonly iconMarker = iconMarker;
}
