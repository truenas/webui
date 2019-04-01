import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnclosureDetailsComponent } from './enclosure-details.component';

describe('EnclosureDetailsComponent', () => {
  let component: EnclosureDetailsComponent;
  let fixture: ComponentFixture<EnclosureDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnclosureDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnclosureDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
