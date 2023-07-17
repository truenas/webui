import {
  AfterContentInit,
  Component, ElementRef, Input, OnChanges, ViewChild,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'ix-app-section-expand-collapse',
  templateUrl: './app-section-expand-collapse.component.html',
  styleUrls: ['./app-section-expand-collapse.component.scss'],
})
export class AppSectionExpandCollapseComponent implements OnChanges, AfterContentInit {
  @ViewChild('section', { static: true, read: ElementRef }) section: ElementRef<HTMLElement>;
  @Input() maxHeight = 250;
  height$ = new BehaviorSubject<number>(this.maxHeight);
  isCollapsed = true;

  get showButton(): boolean {
    return this.height$.value >= this.maxHeight;
  }

  ngOnChanges(): void {
    this.isCollapsed = true;
    this.section.nativeElement.style.maxHeight = `${this.maxHeight}px`;
  }

  ngAfterContentInit(): void {
    this.setHeight();
    this.section.nativeElement.style.maxHeight = `${this.maxHeight}px`;
  }

  changeCollapsed(): void {
    this.setHeight();
    this.isCollapsed = !this.isCollapsed;
    this.section.nativeElement.style.maxHeight = this.isCollapsed ? `${this.maxHeight}px` : 'none';
  }

  setHeight(): void {
    this.height$.next(this.section.nativeElement.offsetHeight || this.maxHeight);
  }

  onResize(): void {
    this.setHeight();
  }
}
