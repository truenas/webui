import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProactiveComponent } from './proactive.component';

describe('ProactiveComponent', () => {
  let component: ProactiveComponent;
  let fixture: ComponentFixture<ProactiveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProactiveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProactiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
