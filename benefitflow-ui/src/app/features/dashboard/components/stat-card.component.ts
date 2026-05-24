import { Component, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  imports: [MatCardModule, MatIconModule],
  template: `
    <mat-card class="stat-card">
      <mat-card-content>
        <mat-icon [class]="'stat-icon ' + color()">{{ icon() }}</mat-icon>
        <div [class]="'stat-number ' + color()">{{ value() }}</div>
        <div class="stat-label">{{ label() }}</div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    mat-card-content {
      display: flex; flex-direction: column;
      align-items: center; padding: 24px 16px; text-align: center;
    }
    .stat-icon  { font-size: 36px; width: 36px; height: 36px; margin-bottom: 8px; }
    .stat-number { font-size: 36px; font-weight: 700; line-height: 1; margin-bottom: 4px; }
    .stat-label  { font-size: 13px; color: rgba(0,0,0,0.55); }
    .blue   { color: #1976d2; }
    .green  { color: #388e3c; }
    .orange { color: #f57c00; }
    .purple { color: #7b1fa2; }
    .red    { color: #c62828; }
  `],
})
export class StatCardComponent {
  icon = input.required<string>();
  value = input.required<number>();
  label = input.required<string>();
  color = input<string>('blue');
}