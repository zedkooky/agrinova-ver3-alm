interface GoogleMapsConfig {
  apiKey: string;
  libraries?: string[];
}

declare global {
  interface Window {
    google: any;
    initGoogleMaps?: () => void;
  }
}

class GoogleMapsLoader {
  private static instance: GoogleMapsLoader;
  private loadPromise: Promise<void> | null = null;
  private isLoaded = false;
  private config: GoogleMapsConfig | null = null;

  private constructor() {}

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader();
    }
    return GoogleMapsLoader.instance;
  }

  async load(config: GoogleMapsConfig): Promise<void> {
    // If already loaded with same config, return immediately
    if (this.isLoaded && window.google && window.google.maps && this.config?.apiKey === config.apiKey) {
      return Promise.resolve();
    }

    // If currently loading with same config, return the existing promise
    if (this.loadPromise && this.config?.apiKey === config.apiKey) {
      return this.loadPromise;
    }

    // Store config
    this.config = config;

    // Check if script already exists with same API key
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"][src*="${config.apiKey}"]`);
    if (existingScript) {
      // Script exists, wait for it to load
      this.loadPromise = new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
          this.isLoaded = true;
          resolve();
          return;
        }

        const checkLoaded = () => {
          if (window.google && window.google.maps) {
            this.isLoaded = true;
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.isLoaded) {
            reject(new Error('Google Maps loading timeout'));
          }
        }, 10000);
      });
      return this.loadPromise;
    }

    // Remove any existing Google Maps scripts to prevent conflicts
    const existingScripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
    existingScripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });

    // Create new loading promise
    this.loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const libraries = config.libraries?.join(',') || 'places,geometry';
      
      // Create a unique callback name
      const callbackName = `initGoogleMaps_${Date.now()}`;
      
      script.src = `https://maps.googleapis.com/maps/api/js?key=${config.apiKey}&libraries=${libraries}&callback=${callbackName}`;
      script.async = true;
      script.defer = true;

      // Set up callback
      (window as any)[callbackName] = () => {
        this.isLoaded = true;
        delete (window as any)[callbackName];
        resolve();
      };

      script.onerror = () => {
        this.loadPromise = null;
        this.isLoaded = false;
        delete (window as any)[callbackName];
        reject(new Error('Failed to load Google Maps API'));
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isLoaded) {
          this.loadPromise = null;
          delete (window as any)[callbackName];
          reject(new Error('Google Maps loading timeout'));
        }
      }, 10000);

      document.head.appendChild(script);
    });

    return this.loadPromise;
  }

  isGoogleMapsLoaded(): boolean {
    return this.isLoaded && !!(window.google && window.google.maps);
  }

  reset(): void {
    this.loadPromise = null;
    this.isLoaded = false;
    this.config = null;
  }
}

export const googleMapsLoader = GoogleMapsLoader.getInstance();