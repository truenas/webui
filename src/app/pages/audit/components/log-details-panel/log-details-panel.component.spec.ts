import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LogDetailsPanelComponent } from './log-details-panel.component';

describe('LogDetailsPanelComponent', () => {
  let component: LogDetailsPanelComponent;
  let fixture: ComponentFixture<LogDetailsPanelComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LogDetailsPanelComponent],
    });
    fixture = TestBed.createComponent(LogDetailsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
