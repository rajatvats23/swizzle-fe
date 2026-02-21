import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FeedbackService } from '../../../core/services/feedback.service';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [FormsModule],
  host: { class: 'flex flex-col min-h-screen' },
  template: `
    <div class="relative flex min-h-screen w-full max-w-md mx-auto flex-col bg-white shadow-sm overflow-x-hidden">

      <!-- Header -->
      <div class="flex items-center p-4 justify-between sticky top-0 z-10 bg-white border-b border-gray-100">
        <button (click)="goBack()" class="flex w-10 h-10 items-center justify-center rounded-full hover:bg-gray-50 transition-colors cursor-pointer">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h2 class="text-lg font-bold tracking-tight flex-1 text-center pr-10">Give Feedback</h2>
      </div>

      @if (submitted()) {
        <!-- Success State -->
        <div class="flex flex-col items-center justify-center flex-1 px-6 text-center">
          <div class="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <span class="material-symbols-outlined text-primary text-5xl">check_circle</span>
          </div>
          <h2 class="text-2xl font-extrabold text-gray-900 mb-2">Thank you!</h2>
          <p class="text-gray-500 text-base max-w-xs">Your feedback helps us improve. We appreciate you taking the time!</p>
        </div>
      } @else {
        <div class="flex flex-col flex-1 overflow-y-auto pb-8">

          <!-- Hero -->
          <div class="flex flex-col items-center justify-center pt-8 pb-4 px-6 text-center">
            <div class="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <span class="material-symbols-outlined text-primary text-5xl">celebration</span>
            </div>
            <h2 class="text-3xl font-extrabold text-gray-900 leading-tight tracking-tight">How was your meal?</h2>
            <p class="text-gray-500 text-base font-medium mt-2 max-w-xs">
              Your feedback makes us better! Tell us about your experience.
            </p>
          </div>

          <!-- Rating Categories -->
          <div class="px-6 py-4 space-y-8">

            <!-- Food Quality -->
            <div class="flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-bold text-gray-900 tracking-tight">Food Quality</h3>
                <span class="text-sm font-semibold" [class]="foodRating() > 0 ? 'text-primary' : 'text-gray-400'">
                  {{ getRatingLabel(foodRating()) }}
                </span>
              </div>
              <div class="flex justify-center gap-2 py-2">
                @for (star of [1,2,3,4,5]; track star) {
                  <button
                    type="button"
                    (click)="foodRating.set(star)"
                    class="cursor-pointer transition-transform hover:scale-110"
                  >
                    <span
                      class="material-symbols-outlined text-4xl transition-colors"
                      [class]="star <= foodRating() ? 'text-primary filled' : 'text-gray-300 hover:text-primary/50'"
                    >star</span>
                  </button>
                }
              </div>
            </div>

            <!-- Delivery Rating -->
            <div class="flex flex-col gap-3">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-bold text-gray-900 tracking-tight">Delivery &amp; Service</h3>
                <span class="text-sm font-semibold" [class]="deliveryRating() > 0 ? 'text-primary' : 'text-gray-400'">
                  {{ getRatingLabel(deliveryRating()) }}
                </span>
              </div>
              <div class="flex justify-center gap-2 py-2">
                @for (star of [1,2,3,4,5]; track star) {
                  <button
                    type="button"
                    (click)="deliveryRating.set(star)"
                    class="cursor-pointer transition-transform hover:scale-110"
                  >
                    <span
                      class="material-symbols-outlined text-4xl transition-colors"
                      [class]="star <= deliveryRating() ? 'text-primary filled' : 'text-gray-300 hover:text-primary/50'"
                    >star</span>
                  </button>
                }
              </div>
            </div>

            <!-- Comment -->
            <div class="flex flex-col gap-3 pt-2">
              <h3 class="text-lg font-bold text-gray-900 tracking-tight">Add a Comment</h3>
              <textarea
                [(ngModel)]="comment"
                placeholder="Tell us more about your experience... (optional)"
                class="w-full h-32 p-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none text-gray-900 transition-all placeholder:text-gray-400 text-sm"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="mt-auto p-6 bg-white border-t border-gray-100">
          @if (error()) {
            <p class="text-red-500 text-sm mb-3 text-center">{{ error() }}</p>
          }
          <button
            (click)="submitFeedback()"
            [disabled]="submitting() || foodRating() === 0"
            class="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            @if (submitting()) {
              <span class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Submitting...
            } @else {
              Submit Feedback
              <span class="material-symbols-outlined text-xl">send</span>
            }
          </button>
        </div>
      }
    </div>
  `,
})
export class FeedbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private feedbackService = inject(FeedbackService);
  private orderService = inject(OrderService);

  orderId = '';
  phoneNumber = '';
  foodRating = signal(0);
  deliveryRating = signal(0);
  comment = '';
  submitting = signal(false);
  submitted = signal(false);
  error = signal('');

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.orderId) { this.router.navigate(['/']); return; }

    // Fetch order to get phone number
    this.orderService.getOrder(this.orderId).subscribe({
      next: order => this.phoneNumber = order.phoneNumber,
    });
  }

  getRatingLabel(rating: number): string {
    switch (rating) {
      case 1: return 'Poor';
      case 2: return 'Fair';
      case 3: return 'Good';
      case 4: return 'Very Good';
      case 5: return 'Excellent!';
      default: return 'Rate this';
    }
  }

  submitFeedback() {
    if (this.foodRating() === 0) {
      this.error.set('Please rate the food quality');
      return;
    }
    this.submitting.set(true);
    this.error.set('');

    this.feedbackService.submitFeedback({
      orderId: this.orderId,
      phoneNumber: this.phoneNumber,
      foodRating: this.foodRating(),
      deliveryRating: this.deliveryRating() || undefined,
      comment: this.comment || undefined,
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(err.error?.error || 'Failed to submit feedback');
      },
    });
  }

  goBack() {
    this.router.navigate(['/order', this.orderId, 'checkout']);
  }
}
