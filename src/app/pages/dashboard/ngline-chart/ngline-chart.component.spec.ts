import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NglineChartComponent } from './ngline-chart.component';

describe('NglineChartComponent', () => {
  let component: NglineChartComponent;
  let fixture: ComponentFixture<NglineChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NglineChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NglineChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
