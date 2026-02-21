import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface FeedbackPayload {
  orderId: string;
  phoneNumber: string;
  foodRating: number;
  deliveryRating?: number;
  comment?: string;
}

export interface Feedback extends FeedbackPayload {
  _id: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private http = inject(HttpClient);
  private api = `${environment.apiUrl}/feedback`;

  submitFeedback(data: FeedbackPayload): Observable<Feedback> {
    return this.http.post<Feedback>(this.api, data);
  }

  getAllFeedback(): Observable<Feedback[]> {
    return this.http.get<Feedback[]>(this.api);
  }
}
