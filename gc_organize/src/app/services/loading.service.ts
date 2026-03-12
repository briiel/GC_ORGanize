import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _loading = new BehaviorSubject<boolean>(false);
  private _message = new BehaviorSubject<string>('Loading...');

  readonly loading$ = this._loading.asObservable();
  readonly message$ = this._message.asObservable();

  show(message = 'Loading...'): void {
    this._message.next(message);
    this._loading.next(true);
  }

  hide(): void {
    this._loading.next(false);
  }
}
