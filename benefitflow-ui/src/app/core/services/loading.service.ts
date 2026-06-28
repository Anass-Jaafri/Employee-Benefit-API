import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _activeRequests = signal(0);

  readonly isLoading = () => this._activeRequests() > 0;

  show(): void {
    this._activeRequests.update((n) => n + 1);
  }

  hide(): void {
    this._activeRequests.update((n) => Math.max(0, n - 1));
  }
}
