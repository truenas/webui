import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewchartComponent } from './viewchart.component';

describe('ViewchartComponent', () => {
  let component: ViewchartComponent;
  let fixture: ComponentFixture<ViewchartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewchartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewchartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
