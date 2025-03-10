import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventsregComponent } from './eventsreg.component';

describe('EventsregComponent', () => {
  let component: EventsregComponent;
  let fixture: ComponentFixture<EventsregComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventsregComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EventsregComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
