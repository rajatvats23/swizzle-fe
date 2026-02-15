import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GoogleMap, MapMarker } from '@angular/google-maps';
import { OrderService } from '../../../core/services/order.service';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [FormsModule, GoogleMap, MapMarker],
  templateUrl: './address.component.html',
  styleUrl: './address.component.scss'
})
export class AddressComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private orderService = inject(OrderService);

  orderId = '';
  mapLoaded = signal(false);
  mapCenter = signal({ lat: 28.6139, lng: 77.2090 }); // Delhi default
  markerPosition = signal({ lat: 28.6139, lng: 77.2090 });

  fullAddress = '';
  houseNumber = '';
  street = '';
  landmark = '';

  loading = signal(false);
  errorMessage = signal('');

  mapOptions: google.maps.MapOptions = {
    disableDefaultUI: false,
    zoomControl: true,
    streetViewControl: false,
    mapTypeControl: false,
  };

  ngOnInit() {
    this.orderId = this.route.snapshot.paramMap.get('orderId') || '';

    // Load Google Maps API
    if (!window.google) {
      this.loadGoogleMapsScript();
    } else {
      this.mapLoaded.set(true);
      this.getCurrentLocation();
    }
  }

  loadGoogleMapsScript() {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCUXDlJk2LX7Qqo24pVild7an36bHMyycA
&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.mapLoaded.set(true);
      this.getCurrentLocation();
    };
    document.head.appendChild(script);
  }

  getCurrentLocation() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          this.mapCenter.set(pos);
          this.markerPosition.set(pos);
          this.geocodeLatLng(pos.lat, pos.lng);
        },
        () => {
          this.errorMessage.set('Could not get your location. Please move the pin manually.');
        }
      );
    }
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const pos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      this.markerPosition.set(pos);
      this.geocodeLatLng(pos.lat, pos.lng);
    }
  }

  onMarkerDragEnd(event: google.maps.MapMouseEvent) {
    if (event.latLng) {
      const pos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      this.markerPosition.set(pos);
      this.geocodeLatLng(pos.lat, pos.lng);
    }
  }

  geocodeLatLng(lat: number, lng: number) {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        this.fullAddress = results[0].formatted_address;
      }
    });
  }

  saveAndContinue() {
    // Validate
    if (!this.fullAddress && !this.houseNumber && !this.street) {
      this.errorMessage.set('Please provide at least basic address details');
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    // Build address object
    const addressText = [
      this.houseNumber,
      this.street,
      this.landmark,
      this.fullAddress
    ].filter(Boolean).join(', ');

    const addressData = {
      deliveryAddress: {
        text: addressText || this.fullAddress,
        lat: this.markerPosition().lat,
        lng: this.markerPosition().lng
      }
    };

    console.log('💾 Saving address:', addressData); // DEBUG

    // Call API
    this.orderService.updateCustomerDetails(this.orderId, addressData).subscribe({
      next: (order) => {
        console.log('✅ Address saved:', order); // DEBUG
        this.loading.set(false);
        this.router.navigate(['/order', this.orderId, 'menu']);
      },
      error: (err) => {
        console.error('❌ Failed to save address:', err);
        this.errorMessage.set('Failed to save address. Please try again.');
        this.loading.set(false);
      }
    });
  }

  skipForNow() {
    this.router.navigate(['/order', this.orderId, 'menu']);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}