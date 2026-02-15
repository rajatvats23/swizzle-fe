import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { cartItems, cartTotal, cartCount } from '../../../shared/signals/cart.signal';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './checkout.component.html',
})
export class CheckoutComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  orderId = '';
  cartItems = cartItems;
  cartTotal = cartTotal;
  cartCount = cartCount;
  

  customerName = 'John Doe'; // TODO: Load from backend
  customerPhone = '+91 98765 43210'; // TODO: Load from backend
  deliveryAddress = '123, Green Park, 5th Main Road, Sector 7, HSR Layout'; // TODO: Load from backend

  editingDetails = signal(false);
  editingAddress = signal(false);

  JSON: any = JSON;

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';
  }

  proceedToPayment() {
    // TODO: Integrate Stripe payment
    alert('Payment integration coming soon!');
  }

  getAddonNames(addons: any[]) {
    return addons.map(a => a.addonName).join(', ');
  }

  goBack() {
    this.router.navigate(['/order', this.orderId, 'menu']);
  }
}