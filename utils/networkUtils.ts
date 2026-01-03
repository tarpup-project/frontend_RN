import { NativeModules } from 'react-native';

// Network utilities with fallback for NetInfo issues
let NetInfo: any = null;
let isNetInfoAvailable = false;

// Initialize NetInfo with error handling
const initializeNetInfo = async () => {
  try {
    // Check if native module exists BEFORE importing the library
    // The library throws if RNCNetInfo is missing during import evaluation
    if (!NativeModules || !NativeModules.RNCNetInfo) {
       console.warn('⚠️ NetInfo native module (RNCNetInfo) not found. Skipping import.');
       isNetInfoAvailable = false;
       return;
    }

    NetInfo = await import('@react-native-community/netinfo');
    
    // Test if the native module is available
    if (NetInfo.default && typeof NetInfo.default.fetch === 'function') {
      // Try to fetch network state to verify it works
      await NetInfo.default.fetch();
      isNetInfoAvailable = true;
      console.log('✅ NetInfo initialized successfully');
    } else {
      console.warn('⚠️ NetInfo native module not available');
      isNetInfoAvailable = false;
    }
  } catch (error) {
    console.warn('⚠️ NetInfo initialization failed:', error);
    isNetInfoAvailable = false;
  }
};

// Network status manager with fallback
export class NetworkManager {
  private isOnline = true;
  private listeners: Array<(isOnline: boolean) => void> = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    await initializeNetInfo();
    
    if (isNetInfoAvailable && NetInfo?.default) {
      try {
        // Set up real network listener
        NetInfo.default.addEventListener((state: any) => {
          const wasOffline = !this.isOnline;
          this.isOnline = state.isConnected ?? true;
          
          console.log('🌐 Network status:', this.isOnline ? 'Online' : 'Offline');
          
          // Notify listeners
          this.listeners.forEach(listener => listener(this.isOnline));
        });

        // Get initial state
        const state = await NetInfo.default.fetch();
        this.isOnline = state.isConnected ?? true;
      } catch (error) {
        console.warn('⚠️ NetInfo listener setup failed:', error);
        this.isOnline = true; // Assume online as fallback
      }
    } else {
      // Fallback: assume always online
      console.log('📶 Using fallback network detection (always online)');
      this.isOnline = true;
    }

    this.initialized = true;
  }

  getNetworkState(): boolean {
    return this.isOnline;
  }

  addListener(callback: (isOnline: boolean) => void) {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Static method for easy access
  static async checkConnection(): Promise<boolean> {
    if (isNetInfoAvailable && NetInfo?.default) {
      try {
        const state = await NetInfo.default.fetch();
        return state.isConnected ?? true;
      } catch (error) {
        console.warn('⚠️ Network check failed:', error);
        return true; // Assume online as fallback
      }
    }
    return true; // Fallback: assume online
  }
}

// Export singleton instance
export const networkManager = new NetworkManager();

// Convenience functions
export const isOnline = () => networkManager.getNetworkState();
export const addNetworkListener = (callback: (isOnline: boolean) => void) => 
  networkManager.addListener(callback);