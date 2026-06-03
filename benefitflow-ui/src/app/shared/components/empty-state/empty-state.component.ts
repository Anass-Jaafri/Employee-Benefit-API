import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="content-card p-10 text-center">
      @if (icon) {
        <div
          class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-600"
        >
          <mat-icon>{{ icon }}</mat-icon>
        </div>
      }

      <h3 class="text-lg font-semibold text-slate-900">{{ title }}</h3>

      @if (description) {
        <p class="mt-2 text-sm text-slate-500">{{ description }}</p>
      }

      @if (actionLabel) {
        <button
          type="button"
          class="mt-5 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          (click)="action.emit()"
        >
          {{ actionLabel }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  @Input() icon = 'inbox';
  @Input() title = 'Nothing here yet';
  @Input() description = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
