import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, ElementRef, input, model, output, Signal, viewChild,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-basic-search',
  templateUrl: './basic-search.component.html',
  styleUrls: ['./basic-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    MatInput,
    MatTooltip,
    ReactiveFormsModule,
    TestDirective,
    FormsModule,
    TranslateModule,
  ],
})
export class BasicSearchComponent implements AfterViewInit {
  readonly query = model<string>();
  readonly allowAdvanced = input(false);
  readonly placeholder = input<string>('');

  readonly switchToAdvanced = output();
  readonly queryChange = output<string>();
  readonly runSearch = output();

  private readonly searchControl: Signal<ElementRef<HTMLElement>> = viewChild.required('searchControl', { read: ElementRef });

  ngAfterViewInit(): void {
    this.focusInput();
  }

  protected resetInput(): void {
    this.query.set('');
    this.queryChange.emit('');
    this.runSearch.emit();
    this.focusInput();
  }

  private focusInput(): void {
    this.searchControl()?.nativeElement?.focus();
  }
}
