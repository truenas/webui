import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, ElementRef, Input, output,
  viewChild,
  input,
} from '@angular/core';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-basic-search',
  templateUrl: './basic-search.component.html',
  styleUrls: ['./basic-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxIconComponent,
    MatInput,
    ReactiveFormsModule,
    TestDirective,
    FormsModule,
    TranslateModule,
  ],
})
export class BasicSearchComponent implements AfterViewInit {
  @Input() query: string;
  readonly allowAdvanced = input(false);

  readonly switchToAdvanced = output();
  readonly queryChange = output<string>();
  readonly runSearch = output();

  readonly searchControl = viewChild<ElementRef<HTMLInputElement>>('searchControl');

  ngAfterViewInit(): void {
    this.focusInput();
  }

  protected resetInput(): void {
    this.query = '';
    this.queryChange.emit(this.query);
    this.runSearch.emit();
    this.focusInput();
  }

  private focusInput(): void {
    this.searchControl()?.nativeElement?.focus();
  }
}
