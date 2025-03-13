import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EcertificateComponent } from './ecertificate.component';

describe('EcertificateComponent', () => {
  let component: EcertificateComponent;
  let fixture: ComponentFixture<EcertificateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EcertificateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EcertificateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
