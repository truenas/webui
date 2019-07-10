import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewchartgaugeComponent } from './viewchartgauge.component';

describe('ViewchartgaugeComponent', () => {
  let component: ViewchartgaugeComponent;
  let fixture: ComponentFixture<ViewchartgaugeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewchartgaugeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewchartgaugeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
