import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  protected readonly JSON = JSON;

  orderId = '';
  order = signal<Order | null>(null);
  loading = signal(true);
  processingPayment = signal(false);
  error = signal('');

  // Edit states
  editingDetails = signal(false);
  editingAddress = signal(false);

  // Form fields
  customerName = '';
  customerPhone = '';
  deliveryAddress = '';

  // Computed values
  cartItems = computed(() => this.order()?.items || []);
  cartTotal = computed(() => this.order()?.total || 0);
  cartCount = computed(() => 
    this.cartItems().reduce((sum, item) => sum + item.quantity, 0)
  );

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('id') || '';
    
    if (!this.orderId) {
      this.router.navigate(['/']);
      return;
    }

    this.loadOrder();
  }

  loadOrder() {
    this.loading.set(true);
    this.error.set('');

    this.orderService.getOrder(this.orderId).subscribe({
      next: (order) => {
        this.order.set(order);
        
        // Pre-fill form fields
        this.customerName = order.customerName || '';
        this.customerPhone = order.phoneNumber || '';
        this.deliveryAddress = order.deliveryAddress?.text || '';
        
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Failed to load order:', err);
        this.error.set('Failed to load order details');
        this.loading.set(false);
      }
    });
  }

  saveDetails() {
    if (!this.customerName.trim()) {
      this.error.set('Please enter your name');
      return;
    }

    this.orderService.updateCustomerDetails(this.orderId, {
      customerName: this.customerName.trim()
    }).subscribe({
      next: (order) => {
        this.order.set(order);
        this.editingDetails.set(false);
        this.error.set('');
      },
      error: (err) => {
        console.error('Failed to update details:', err);
        this.error.set('Failed to update details');
      }
    });
  }

  saveAddress() {
    if (!this.deliveryAddress.trim()) {
      this.error.set('Please enter delivery address');
      return;
    }

    const currentOrder = this.order();
    const addressData = {
      deliveryAddress: {
        text: this.deliveryAddress.trim(),
        lat: currentOrder?.deliveryAddress?.lat || 0,
        lng: currentOrder?.deliveryAddress?.lng || 0
      }
    };

    this.orderService.updateCustomerDetails(this.orderId, addressData).subscribe({
      next: (order) => {
        this.order.set(order);
        this.editingAddress.set(false);
        this.error.set('');
      },
      error: (err) => {
        console.error('Failed to update address:', err);
        this.error.set('Failed to update address');
      }
    });
  }

  proceedToPayment() {
    const total = this.cartTotal();
    
    if (total <= 0) {
      this.error.set('Cart is empty');
      return;
    }

    if (!this.customerName) {
      this.error.set('Please provide customer name');
      return;
    }

    this.processingPayment.set(true);
    this.error.set('');

    // Send only total - backend validates against DB
    this.orderService.checkout(this.orderId, total).subscribe({
      next: (response) => {
        // Redirect to Stripe
        window.location.href = response.stripeSessionUrl;
      },
      error: (err) => {
        console.error('Checkout failed:', err);
        
        // Handle price mismatch error
        if (err.error?.error === 'Price mismatch') {
          this.error.set(
            `Price mismatch detected. Expected: ₹${err.error.expectedTotal}, ` +
            `but cart shows: ₹${err.error.submittedTotal}. Please refresh the page.`
          );
        } else {
          this.error.set('Payment processing failed. Please try again.');
        }
        
        this.processingPayment.set(false);
      }
    });
  }

  getAddonNames(addons: { addonName: string }[]): string {
    return addons.map(a => a.addonName).join(', ');
  }

  goBack() {
    this.router.navigate(['/order', this.orderId, 'menu']);
  }
}