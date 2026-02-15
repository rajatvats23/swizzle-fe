import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GoogleMap, MapMarker } from '@angular/google-maps';

@Component({
  selector: 'app-address',
  standalone: true,
  imports: [FormsModule, GoogleMap, MapMarker],
  templateUrl: './address.component.html',
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AddressComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

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
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places`;
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
    if (!this.fullAddress && !this.houseNumber && !this.street) {
      this.errorMessage.set('Please provide at least basic address details');
      return;
    }

    this.loading.set(true);
    
    // TODO: Call backend API to save address
    // this.orderService.updateAddress(this.orderId, addressData).subscribe(...)
    
    setTimeout(() => {
      this.loading.set(false);
      this.router.navigate(['/order', this.orderId, 'menu']);
    }, 500);
  }

  skipForNow() {
    this.router.navigate(['/order', this.orderId, 'menu']);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}