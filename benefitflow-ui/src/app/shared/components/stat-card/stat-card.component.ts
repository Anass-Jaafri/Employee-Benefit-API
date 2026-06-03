import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="stat-card">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="stat-label">{{ label }}</p>
          <p class="stat-value">{{ value }}</p>
          @if (meta) {
            <p class="stat-meta">{{ meta }}</p>
          }
        </div>

        @if (icon) {
          <div
            class="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <mat-icon>{{ icon }}</mat-icon>
          </div>
        }
      </div>
    </div>
  `,
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() meta = '';
  @Input() icon = '';
}
