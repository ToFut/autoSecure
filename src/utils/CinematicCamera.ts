/**
 * CinematicCamera - Hollywood-style camera movements for Google Maps
 * Creates dramatic camera sequences for security perimeter visualization
 */

export interface CameraAnimation {
  center?: google.maps.LatLng | google.maps.LatLngLiteral;
  zoom?: number;
  tilt?: number;
  heading?: number;
  duration: number;
  easing?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'easeOutQuad' | 'easeInOutCubic';
}

export interface CameraSequence {
  name: string;
  animations: CameraAnimation[];
}

export class CinematicCamera {
  private map: google.maps.Map;
  private isAnimating: boolean = false;
  private animationQueue: CameraAnimation[] = [];
  private onCompleteCallback?: () => void;

  constructor(map: google.maps.Map) {
    this.map = map;
  }

  /**
   * Main cinematic reveal sequence for security perimeter
   */
  async cinematicReveal(
    polygon: google.maps.Polygon,
    onComplete?: () => void
  ): Promise<void> {
    if (this.isAnimating) return;
    
    this.onCompleteCallback = onComplete;
    this.isAnimating = true;

    try {
      // Get perimeter data
      const bounds = this.getPolygonBounds(polygon);
      const center = bounds.getCenter();
      const corners = this.getPolygonCorners(polygon);

      // Execute cinematic sequence
      await this.fadeEffect('out', 300);
      await this.aerialEstablishingShot(center);
      await this.helicopterRotation(center, 360, 5000);
      await this.cornerInspection(corners);
      await this.pullBackToTactical(bounds);
      await this.fadeEffect('in', 300);

      // Trigger completion
      if (this.onCompleteCallback) {
        this.onCompleteCallback();
      }
    } finally {
      this.isAnimating = false;
    }
  }

  /**
   * Aerial establishing shot - start high and wide
   */
  private async aerialEstablishingShot(center: google.maps.LatLng): Promise<void> {
    await this.animateCamera({
      center,
      zoom: 14,
      tilt: 0,
      heading: 0,
      duration: 1500,
      easing: 'easeOut'
    });
  }

  /**
   * 360-degree helicopter rotation around perimeter
   */
  private async helicopterRotation(
    center: google.maps.LatLng,
    degrees: number,
    duration: number
  ): Promise<void> {
    const steps = 60;
    const stepDuration = duration / steps;
    const degreesPerStep = degrees / steps;

    // Zoom in while starting rotation
    await this.animateCamera({
      center,
      zoom: 17,
      tilt: 45,
      heading: 0,
      duration: 800,
      easing: 'easeInOut'
    });

    // Smooth rotation
    for (let i = 0; i < steps; i++) {
      await this.animateCamera({
        center,
        zoom: 17,
        tilt: 45,
        heading: i * degreesPerStep,
        duration: stepDuration,
        easing: 'linear'
      });
    }
  }

  /**
   * Inspect each corner with dramatic zoom
   */
  private async cornerInspection(corners: google.maps.LatLng[]): Promise<void> {
    for (let i = 0; i < corners.length; i++) {
      const corner = corners[i];
      
      // Quick zoom to corner
      await this.animateCamera({
        center: corner,
        zoom: 19,
        tilt: 60,
        heading: (i * 90) % 360,
        duration: 600,
        easing: 'easeInOut'
      });

      // Hold for effect
      await this.delay(300);

      // Pull back slightly
      await this.animateCamera({
        center: corner,
        zoom: 18,
        tilt: 45,
        heading: (i * 90 + 45) % 360,
        duration: 400,
        easing: 'easeOut'
      });
    }
  }

  /**
   * Final tactical overview position
   */
  private async pullBackToTactical(bounds: google.maps.LatLngBounds): Promise<void> {
    const center = bounds.getCenter();

    // First pull up high
    await this.animateCamera({
      center,
      zoom: 16,
      tilt: 0,
      heading: 0,
      duration: 800,
      easing: 'easeOut'
    });

    // Then tilt and zoom to final position
    await this.animateCamera({
      center,
      zoom: 17,
      tilt: 45,
      heading: 0,
      duration: 1000,
      easing: 'easeInOutCubic'
    });

    // Fit to bounds with padding
    this.map.fitBounds(bounds, {
      top: 100,
      right: 100,
      bottom: 150,
      left: 100
    });
  }

  /**
   * Animate camera with easing
   */
  private animateCamera(animation: CameraAnimation): Promise<void> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const startOptions = {
        center: this.map.getCenter() || new google.maps.LatLng(0, 0),
        zoom: this.map.getZoom() || 15,
        tilt: this.map.getTilt() || 0,
        heading: this.map.getHeading() || 0
      };

      const targetOptions = {
        center: animation.center || startOptions.center,
        zoom: animation.zoom !== undefined ? animation.zoom : startOptions.zoom,
        tilt: animation.tilt !== undefined ? animation.tilt : startOptions.tilt,
        heading: animation.heading !== undefined ? animation.heading : startOptions.heading
      };

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / animation.duration, 1);
        const easedProgress = this.applyEasing(progress, animation.easing || 'linear');

        // Interpolate values
        const currentOptions = {
          center: this.interpolateLatLng(
            startOptions.center,
            targetOptions.center,
            easedProgress
          ),
          zoom: this.interpolate(startOptions.zoom, targetOptions.zoom, easedProgress),
          tilt: this.interpolate(startOptions.tilt, targetOptions.tilt, easedProgress),
          heading: this.interpolateAngle(startOptions.heading, targetOptions.heading, easedProgress)
        };

        this.map.moveCamera(currentOptions);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Fade effect overlay
   */
  private fadeEffect(direction: 'in' | 'out', duration: number): Promise<void> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.backgroundColor = 'black';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9999';
      overlay.style.transition = `opacity ${duration}ms ease-in-out`;
      overlay.style.opacity = direction === 'out' ? '0' : '1';

      document.body.appendChild(overlay);

      setTimeout(() => {
        overlay.style.opacity = direction === 'out' ? '1' : '0';
      }, 10);

      setTimeout(() => {
        document.body.removeChild(overlay);
        resolve();
      }, duration);
    });
  }

  /**
   * Easing functions
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'easeOutQuad':
        return t * (2 - t);
      case 'easeInOutCubic':
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      default:
        return t; // linear
    }
  }

  /**
   * Interpolation helpers
   */
  private interpolate(start: number, end: number, progress: number): number {
    return start + (end - start) * progress;
  }

  private interpolateLatLng(
    start: google.maps.LatLng | google.maps.LatLngLiteral,
    end: google.maps.LatLng | google.maps.LatLngLiteral,
    progress: number
  ): google.maps.LatLng {
    const startLat = start instanceof google.maps.LatLng ? start.lat() : start.lat;
    const startLng = start instanceof google.maps.LatLng ? start.lng() : start.lng;
    const endLat = end instanceof google.maps.LatLng ? end.lat() : end.lat;
    const endLng = end instanceof google.maps.LatLng ? end.lng() : end.lng;

    return new google.maps.LatLng(
      this.interpolate(startLat, endLat, progress),
      this.interpolate(startLng, endLng, progress)
    );
  }

  private interpolateAngle(start: number, end: number, progress: number): number {
    // Handle angle wrapping
    let delta = end - start;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;
    return (start + delta * progress + 360) % 360;
  }

  /**
   * Utility functions
   */
  private getPolygonBounds(polygon: google.maps.Polygon): google.maps.LatLngBounds {
    const bounds = new google.maps.LatLngBounds();
    const path = polygon.getPath();
    
    path.forEach((latLng) => {
      bounds.extend(latLng);
    });
    
    return bounds;
  }

  private getPolygonCorners(polygon: google.maps.Polygon): google.maps.LatLng[] {
    const corners: google.maps.LatLng[] = [];
    const path = polygon.getPath();
    
    path.forEach((latLng) => {
      corners.push(latLng);
    });
    
    return corners;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Quick camera movements for specific actions
   */
  async focusOnPoint(
    point: google.maps.LatLng,
    options?: {
      zoom?: number;
      tilt?: number;
      duration?: number;
    }
  ): Promise<void> {
    await this.animateCamera({
      center: point,
      zoom: options?.zoom || 19,
      tilt: options?.tilt || 60,
      duration: options?.duration || 800,
      easing: 'easeInOutCubic'
    });
  }

  async orbitAround(
    center: google.maps.LatLng,
    radius: number = 100,
    duration: number = 5000
  ): Promise<void> {
    const steps = 60;
    const stepDuration = duration / steps;
    
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      const offsetLat = Math.sin(angle) * radius / 111111;
      const offsetLng = Math.cos(angle) * radius / (111111 * Math.cos(center.lat() * Math.PI / 180));
      
      const position = new google.maps.LatLng(
        center.lat() + offsetLat,
        center.lng() + offsetLng
      );
      
      await this.animateCamera({
        center: position,
        zoom: 18,
        tilt: 45,
        heading: (i * 6) % 360,
        duration: stepDuration,
        easing: 'linear'
      });
    }
  }

  /**
   * Stop all animations
   */
  stopAnimation(): void {
    this.isAnimating = false;
    this.animationQueue = [];
  }
}