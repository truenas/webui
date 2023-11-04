import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { AlertPolicy } from 'app/enums/alert-policy.enum';
import { AlertCategory, AlertClasses } from 'app/interfaces/alert.interface';
import { Option } from 'app/interfaces/option.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './alert-settings2.component.html',
  styleUrls: ['./alert-settings2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertSettings2Component implements OnInit {

  categories: AlertCategory[] = [];
  alertClasses: AlertClasses;
  AlertPolicy = AlertPolicy;

  searchControl = this.fb.control('');
  searchOptions: Option[] = [];

  policyOptions: string[] = [];

  constructor(
    private ws: WebSocketService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
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
}