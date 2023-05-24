import {
  AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewChild,
} from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ChartRelease } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-app-notes-card',
  templateUrl: './app-notes-card.component.html',
  styleUrls: ['./app-notes-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNotesCardComponent implements AfterViewChecked, OnChanges {
  @Input() app: ChartRelease;
  @Input() maxHeight = 250;
  @ViewChild('notes', { static: true, read: ElementRef }) notes: ElementRef<HTMLElement>;

  isCollapsed = true;
  height: Subject<number> = new BehaviorSubject(this.maxHeight);

  ngAfterViewChecked(): void {
    this.setHeight();
  }

  ngOnChanges(): void {
    this.isCollapsed = true;
    this.notes.nativeElement.style.maxHeight = `${this.maxHeight}px`;
  }

  setHeight(): void {
    this.height.next(this.notes.nativeElement.offsetHeight || this.maxHeight);
  }

  onResize(): void {
    this.setHeight();
  }

  changeCollapsed(): void {
    this.setHeight();
    this.isCollapsed = !this.isCollapsed;
    this.notes.nativeElement.style.maxHeight = this.isCollapsed ? `${this.maxHeight}px` : 'none';
  }
}
