import { SecurityResource } from '../store/slices/securitySlice';

export interface Resource3DOptions {
  id: string;
  type: 'guard' | 'camera' | 'barrier' | 'metal-detector' | 'medical' | 'radio' | 'k9' | 'sensor' | 'drone';
  position: google.maps.LatLng | google.maps.LatLngLiteral;
  map: google.maps.Map;
  label?: string;
  coverage?: number;
  status?: 'ready' | 'deployed' | 'standby';
}

export class Resource3D {
  private marker: google.maps.Marker | null = null;
  private coverageCircle: google.maps.Circle | null = null;
  private map: google.maps.Map;
  private id: string;
  private type: string;
  private status: string;

  constructor(options: Resource3DOptions) {
    this.map = options.map;
    this.id = options.id;
    this.type = options.type;
    this.status = options.status || 'ready';
    this.create(options);
  }

  private create(options: Resource3DOptions) {
    // Create custom marker with rich HTML icon
    const icon = this.createCustomIcon(options.type);
    
    // Use regular Marker with custom icon
    this.marker = new google.maps.Marker({
      position: options.position,
      map: this.map,
      icon: icon,
      title: options.label || `${options.type} ${this.id}`,
      draggable: true,
      animation: google.maps.Animation.DROP,
      optimized: false // Ensures better compatibility
    });

    // Add coverage circle if specified
    if (options.coverage) {
      this.coverageCircle = new google.maps.Circle({
        center: options.position,
        radius: options.coverage,
        fillColor: this.getCoverageColor(options.type),
        fillOpacity: 0.2,
        strokeColor: this.getCoverageColor(options.type),
        strokeOpacity: 0.8,
        strokeWeight: 2,
        map: this.map
      });
    }

    // Add click listener for details
    this.marker.addListener('click', () => {
      this.showDetails();
    });

    // Add drag listener to update coverage circle
    this.marker.addListener('dragend', () => {
      const position = this.marker?.getPosition();
      if (position && this.coverageCircle) {
        this.coverageCircle.setCenter(position);
      }
    });
  }

  private createCustomIcon(type: string): google.maps.Icon | google.maps.Symbol {
    const colors = {
      guard: '#00a8ff',
      camera: '#ff9500',
      barrier: '#34c759',
      'metal-detector': '#af52de',
      medical: '#ff3b30',
      radio: '#ffcc00',
      k9: '#8b4513',
      sensor: '#00ced1',
      drone: '#4169e1'
    };

    // Use custom SVG icons for better visual representation
    const svgIcons: { [key: string]: string } = {
      guard: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${colors.guard}" opacity="0.9"/>
        <path d="M20 10 C15 10 12 14 12 18 C12 22 15 26 20 26 C25 26 28 22 28 18 C28 14 25 10 20 10" fill="white"/>
        <circle cx="20" cy="18" r="3" fill="${colors.guard}"/>
      </svg>`,
      camera: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${colors.camera}" opacity="0.9"/>
        <rect x="14" y="16" width="12" height="8" fill="white" rx="1"/>
        <circle cx="20" cy="20" r="2" fill="${colors.camera}"/>
      </svg>`,
      k9: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${colors.k9}" opacity="0.9"/>
        <path d="M20 14 L16 20 L18 24 L20 22 L22 24 L24 20 L20 14" fill="white"/>
      </svg>`,
      drone: `<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${colors.drone}" opacity="0.9"/>
        <path d="M14 18 L26 18 M20 12 L20 24 M14 14 L14 18 M26 14 L26 18 M14 22 L14 26 M26 22 L26 26" stroke="white" stroke-width="2" fill="none"/>
      </svg>`
    };

    // Return SVG icon if available, otherwise use symbol
    if (svgIcons[type]) {
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcons[type]),
        scaledSize: new google.maps.Size(40, 40),
        anchor: new google.maps.Point(20, 20)
      };
    }

    // Fallback to symbol for other types
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 15,
      fillColor: colors[type as keyof typeof colors] || '#00ff88',
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      labelOrigin: new google.maps.Point(0, -25)
    };
  }

  private getCoverageColor(type: string): string {
    const colors = {
      guard: '#00a8ff',
      camera: '#ff9500',
      barrier: '#34c759',
      'metal-detector': '#af52de',
      medical: '#ff3b30',
      radio: '#ffcc00',
      k9: '#8b4513',
      sensor: '#00ced1',
      drone: '#4169e1'
    };
    return colors[type as keyof typeof colors] || '#00ff88';
  }

  private showDetails() {
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #00ff88;">${this.type.toUpperCase()}</h3>
          <p><strong>ID:</strong> ${this.id}</p>
          <p><strong>Status:</strong> <span style="color: ${this.getStatusColor()}">${this.status}</span></p>
          <p><strong>Type:</strong> ${this.type}</p>
          ${this.coverageCircle ? `<p><strong>Coverage:</strong> ${this.coverageCircle.getRadius()}m</p>` : ''}
          <div style="margin-top: 10px;">
            <button onclick="window.resourceAction('${this.id}', 'edit')" style="background: #00ff88; color: #000; border: none; padding: 5px 10px; border-radius: 4px; margin-right: 5px; cursor: pointer;">Edit</button>
            <button onclick="window.resourceAction('${this.id}', 'remove')" style="background: #ff3b30; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Remove</button>
          </div>
        </div>
      `
    });

    if (this.marker) {
      infoWindow.open(this.map, this.marker);
    }
  }

  private getStatusColor(): string {
    const colors = {
      ready: '#ffcc00',
      deployed: '#34c759',
      standby: '#ff9500'
    };
    return colors[this.status as keyof typeof colors] || '#00ff88';
  }

  public animateToPosition(targetPosition: google.maps.LatLng, duration: number = 2000) {
    if (!this.marker) return;

    const startPosition = this.marker.getPosition();
    if (!startPosition) return;

    const startTime = Date.now();
    const from = { lat: startPosition.lat(), lng: startPosition.lng() };
    const to = { lat: targetPosition.lat(), lng: targetPosition.lng() };

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function for smooth animation
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const lat = from.lat + (to.lat - from.lat) * easeProgress;
      const lng = from.lng + (to.lng - from.lng) * easeProgress;

      // Fix: Use setPosition method instead of direct property access
      this.marker?.setPosition({ lat, lng });

      // Update coverage circle if exists
      if (this.coverageCircle) {
        this.coverageCircle.setCenter({ lat, lng });
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  public pulse() {
    if (!this.marker) return;

    const originalScale = 15;
    let scale = originalScale;
    let growing = true;

    const pulse = () => {
      if (growing) {
        scale += 0.5;
        if (scale >= originalScale + 4) {
          growing = false;
        }
      } else {
        scale -= 0.5;
        if (scale <= originalScale) {
          growing = true;
        }
      }

      const icon = this.marker?.getIcon();
      if (icon && typeof icon === 'object' && 'scale' in icon) {
        const symbolIcon = icon as google.maps.Symbol;
        symbolIcon.scale = scale;
        this.marker?.setIcon(symbolIcon);
      }

      if (scale > originalScale) {
        requestAnimationFrame(pulse);
      }
    };

    pulse();
  }

  public setStatus(status: 'ready' | 'deployed' | 'standby') {
    this.status = status;
    
    // Update marker appearance based on status
    if (this.marker) {
      const icon = this.marker.getIcon();
      if (icon && typeof icon === 'object' && 'fillColor' in icon) {
        const symbolIcon = icon as google.maps.Symbol;
        symbolIcon.fillColor = this.getStatusColor();
        this.marker.setIcon(symbolIcon);
      } else {
        // For SVG icons, recreate with new status color
        this.marker.setIcon(this.createCustomIcon(this.type));
      }
    }
  }

  public getPosition(): google.maps.LatLng | null {
    return this.marker?.getPosition() || null;
  }

  public getId(): string {
    return this.id;
  }

  public getType(): string {
    return this.type;
  }

  public getStatus(): string {
    return this.status;
  }

  // Fix: Use setMap method instead of direct property access
  public remove() {
    if (this.marker) {
      this.marker.setMap(null);
    }
    if (this.coverageCircle) {
      this.coverageCircle.setMap(null);
    }
  }

  // Fix: Use setPosition method instead of direct property access
  public updatePosition(position: google.maps.LatLng | google.maps.LatLngLiteral) {
    if (this.marker) {
      this.marker.setPosition(position);
    }
    if (this.coverageCircle) {
      this.coverageCircle.setCenter(position);
    }
  }

  // Fix: Use setMap method instead of direct property access
  public setVisible(visible: boolean) {
    if (this.marker) {
      this.marker.setMap(visible ? this.map : null);
    }
    if (this.coverageCircle) {
      this.coverageCircle.setVisible(visible);
    }
  }

  public toSecurityResource(): SecurityResource {
    const position = this.getPosition();
    return {
      id: this.id,
      type: this.type as any,
      count: 1,
      deployed: this.status === 'deployed' ? 1 : 0,
      status: this.status as any,
      location: position ? { lat: position.lat(), lng: position.lng() } : undefined
    };
  }
}