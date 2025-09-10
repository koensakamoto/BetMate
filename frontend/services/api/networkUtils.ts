import React from 'react';
import NetInfo from '@react-native-community/netinfo';
import { apiClient } from './baseClient';

export interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean;
  type: string;
}

class NetworkManager {
  private listeners: ((state: NetworkState) => void)[] = [];
  private currentState: NetworkState = {
    isConnected: false,
    isInternetReachable: false,
    type: 'unknown'
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    // Subscribe to network state changes
    NetInfo.addEventListener(state => {
      const networkState: NetworkState = {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
        type: state.type
      };

      this.currentState = networkState;
      this.notifyListeners(networkState);
    });

    // Get initial state
    const state = await NetInfo.fetch();
    this.currentState = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable ?? false,
      type: state.type
    };
  }

  public getCurrentState(): NetworkState {
    return this.currentState;
  }

  public isOnline(): boolean {
    return this.currentState.isConnected && this.currentState.isInternetReachable;
  }

  public subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(state: NetworkState) {
    this.listeners.forEach(listener => {
      try {
        listener(state);
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });
  }

  // Test connectivity to our API server specifically
  public async testApiConnectivity(): Promise<boolean> {
    if (!this.isOnline()) {
      return false;
    }

    try {
      // Use a lightweight endpoint to test connectivity
      await apiClient.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      console.warn('API connectivity test failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const networkManager = new NetworkManager();

// Utility function to wait for network connection
export const waitForConnection = (timeout: number = 30000): Promise<boolean> => {
  return new Promise((resolve) => {
    if (networkManager.isOnline()) {
      resolve(true);
      return;
    }

    const timeoutId = setTimeout(() => {
      unsubscribe();
      resolve(false);
    }, timeout);

    const unsubscribe = networkManager.subscribe((state) => {
      if (state.isConnected && state.isInternetReachable) {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(true);
      }
    });
  });
};

// React hook for network state
export const useNetworkState = () => {
  const [networkState, setNetworkState] = React.useState<NetworkState>(
    networkManager.getCurrentState()
  );

  React.useEffect(() => {
    const unsubscribe = networkManager.subscribe(setNetworkState);
    return unsubscribe;
  }, []);

  return {
    ...networkState,
    isOnline: networkState.isConnected && networkState.isInternetReachable,
  };
};

