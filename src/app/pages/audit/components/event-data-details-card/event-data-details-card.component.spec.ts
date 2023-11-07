import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDataDetailsCardComponent } from './event-data-details-card.component';

describe('EventDataDetailsCardComponent', () => {
  let component: EventDataDetailsCardComponent;
  let fixture: ComponentFixture<EventDataDetailsCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EventDataDetailsCardComponent],
    });
    fixture = TestBed.createComponent(EventDataDetailsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
