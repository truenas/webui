import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TextLimiterTooltipComponent } from './text-limiter-tooltip.component';

describe('TextLimiterTooltipComponent', () => {
  let component: TextLimiterTooltipComponent;
  let fixture: ComponentFixture<TextLimiterTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TextLimiterTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextLimiterTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
