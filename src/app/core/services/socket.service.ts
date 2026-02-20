import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Strip /api from the base URL — socket connects to the root server
const SOCKET_URL = environment.apiUrl.replace('/api', '');

@Injectable({ providedIn: 'root' })
export class SocketService implements OnDestroy {
  private socket: Socket;

  constructor() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.socket.on('connect', () =>
      console.log('[Socket] Connected:', this.socket.id)
    );
    this.socket.on('disconnect', reason =>
      console.log('[Socket] Disconnected:', reason)
    );
  }

  /** Listen to any socket event, returns an Observable */
  on<T>(event: string): Observable<T> {
    return new Observable<T>(subscriber => {
      const handler = (data: T) => subscriber.next(data);
      this.socket.on(event, handler);
      // Cleanup when the observable is unsubscribed
      return () => this.socket.off(event, handler);
    });
  }

  ngOnDestroy() {
    this.socket.disconnect();
  }
}
