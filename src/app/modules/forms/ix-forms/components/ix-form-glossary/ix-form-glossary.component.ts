import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  signal,
} from '@angular/core';
import {
  FormBuilder, NgControl, ReactiveFormsModule,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import {
  debounceTime,
  delay,
  distinctUntilChanged,
  map,
} from 'rxjs/operators';
import { NavigateAndInteractService } from 'app/directives/navigate-and-interact/navigate-and-interact.service';
import { SectionWithControls } from 'app/interfaces/form-sections.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxFormSectionComponent } from 'app/modules/forms/ix-forms/components/ix-form-section/ix-form-section.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@UntilDestroy()
@Component({
  selector: 'ix-form-glossary',
  templateUrl: './ix-form-glossary.component.html',
  styleUrls: ['./ix-form-glossary.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxInputComponent,
    TranslateModule,
    ReactiveFormsModule,
    IxIconComponent,
  ],
})
export class IxFormGlossaryComponent implements OnInit {
  protected searchControl = this.formBuilder.control('');
  protected searchOptions = signal<Option[]>([]);
  protected iconMarker = iconMarker;

  protected sections = signal<IxFormSectionComponent[]>([]);
  protected sectionsValidity = new Map<IxFormSectionComponent, boolean>();
  private sectionControlsSubscriptions = new Map<
    IxFormSectionComponent,
    Map<NgControl, Subscription>
  >();

  private sectionControlsValidities = new Map<
    IxFormSectionComponent,
    Map<NgControl, boolean>
  >();

  constructor(
    private formBuilder: FormBuilder,
    private formService: IxFormService,
    private cdr: ChangeDetectorRef,
    private navigateAndInteractService: NavigateAndInteractService,
  ) {
    this.handleControlsUpdates();
    this.handleSectionUpdates();
  }

  private handleControlsUpdates(): void {
    this.formService.controlNamesWithLabels$.pipe(
      delay(0),
      map((controlsWithLabels) => controlsWithLabels.map(
        (nameWithLabel) => ({ label: nameWithLabel.label, value: nameWithLabel.name }),
      )),
      untilDestroyed(this),
    ).subscribe({
      next: (options) => this.searchOptions.set(options),
    });
  }

  private handleSectionUpdates(): void {
    this.formService.controlSections$.pipe(
      delay(0),
      untilDestroyed(this),
    ).subscribe({
      next: (sectionsWithControls) => {
        this.updateControlsStatusUpdates(sectionsWithControls);
        this.sections.set(sectionsWithControls.map(({ section }) => section));
      },
    });
  }

  private updateControlsStatusUpdates(sectionsWithControls: SectionWithControls[]): void {
    for (const { section, controls } of sectionsWithControls) {
      this.resetSubscriptionsAndValidities(section);

      this.initializeSectionValidity(
        section,
        controls,
      );

      const sectionControlSubscriptions
        = this.sectionControlsSubscriptions.get(section) || new Map<NgControl, Subscription>();

      for (const control of controls) {
        this.setControlValidity(section, control, control ? control.valid : true);

        const subscription = control?.statusChanges.pipe(
          untilDestroyed(this),
        ).subscribe({
          next: () => {
            this.setControlValidity(section, control, control.valid);
          },
        });
        sectionControlSubscriptions.set(control, subscription);
      }
      this.sectionControlsSubscriptions.set(section, sectionControlSubscriptions);
    }
  }

  private initializeSectionValidity(section: IxFormSectionComponent, controls: NgControl[]): void {
    const isSectionValid = controls.every((control) => (control ? control.valid : true));
    this.sectionsValidity.set(section, isSectionValid);
  }

  private setControlValidity(
    section: IxFormSectionComponent,
    control: NgControl,
    valid: boolean,
  ): void {
    const sectionControlValidities = this.sectionControlsValidities.get(section) || new Map<NgControl, boolean>();
    sectionControlValidities.set(control, valid);

    this.sectionControlsValidities.set(section, sectionControlValidities);
    this.sectionsValidity.set(section, Array.from(sectionControlValidities.values()).every(Boolean));
    this.cdr.markForCheck();
  }

  private resetSubscriptionsAndValidities(section: IxFormSectionComponent): void {
    this.sectionControlsValidities.set(section, new Map<NgControl, boolean>());
    const subscriptions = Array.from(this.sectionControlsSubscriptions.get(section)?.values() || []);
    for (const subscription of subscriptions) {
      subscription?.unsubscribe();
    }
    this.sectionControlsSubscriptions.set(section, new Map<NgControl, Subscription>());
  }

  protected isSectionValid(section: IxFormSectionComponent): boolean {
    return this.sectionsValidity.get(section);
  }

  ngOnInit(): void {
    this.handleSearchControl();
  }

  protected onSectionClick(section: IxFormSectionComponent): void {
    this.navigateAndInteractService.scrollIntoView(section.elementRef.nativeElement);
  }

  private handleSearchControl(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((value: string) => {
      const option = this.searchOptions().find((opt) => opt.value === value)
        || this.searchOptions().find((opt) => opt.label.toLocaleLowerCase() === value.toLocaleLowerCase());

      if (option) {
        this.onControlClick(option.value.toString(), option.label);
      }
    });
  }

  private onControlClick(id: string, label: string): void {
    const element = this.formService.getElementByControlName(id) || this.formService.getElementByLabel(label);
    if (!element) {
      return;
    }

    this.navigateAndInteractService.scrollIntoView(element);
  }
}
