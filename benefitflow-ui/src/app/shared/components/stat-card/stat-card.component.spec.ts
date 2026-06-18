import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

describe('StatCardComponent', () => {
  let component: StatCardComponent;
  let fixture: ComponentFixture<StatCardComponent>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardComponent],
      providers: [provideAnimationsAsync()],
    }).compileComponents();

    fixture = TestBed.createComponent(StatCardComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  it('creates the component', () => {
    expect(component).toBeTruthy();
  });

  it('renders the label', () => {
    component.label = 'Total Employees';
    fixture.detectChanges();
    expect(el.querySelector('.stat-label')?.textContent?.trim()).toBe('Total Employees');
  });

  it('renders a numeric value', () => {
    component.value = 42;
    fixture.detectChanges();
    expect(el.querySelector('.stat-value')?.textContent?.trim()).toBe('42');
  });

  it('renders a string value', () => {
    component.value = '$1,200';
    fixture.detectChanges();
    expect(el.querySelector('.stat-value')?.textContent?.trim()).toBe('$1,200');
  });

  it('renders the meta text when provided', () => {
    component.meta = '+3 this month';
    fixture.detectChanges();
    expect(el.querySelector('.stat-meta')?.textContent?.trim()).toBe('+3 this month');
  });

  it('does not render the meta element when meta is empty', () => {
    component.meta = '';
    fixture.detectChanges();
    expect(el.querySelector('.stat-meta')).toBeNull();
  });

  it('renders the mat-icon when icon is provided', () => {
    component.icon = 'people';
    fixture.detectChanges();
    const icon = el.querySelector('mat-icon');
    expect(icon).not.toBeNull();
    expect(icon?.textContent?.trim()).toBe('people');
  });

  it('does not render the icon container when icon is empty', () => {
    component.icon = '';
    fixture.detectChanges();
    const icon = el.querySelector('mat-icon');
    expect(icon).toBeNull();
  });

  it('renders all four inputs together correctly', () => {
    component.label = 'Claims';
    component.value = 18;
    component.meta = '5 pending';
    component.icon = 'receipt_long';
    fixture.detectChanges();

    expect(el.querySelector('.stat-label')?.textContent?.trim()).toBe('Claims');
    expect(el.querySelector('.stat-value')?.textContent?.trim()).toBe('18');
    expect(el.querySelector('.stat-meta')?.textContent?.trim()).toBe('5 pending');
    expect(el.querySelector('mat-icon')?.textContent?.trim()).toBe('receipt_long');
  });
});
