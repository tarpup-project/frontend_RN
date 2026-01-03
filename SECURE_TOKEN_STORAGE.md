# Secure Token Storage Implementation

## Overview

The secure token storage system provides encrypted, persistent storage for access tokens and refresh tokens using Expo SecureStore. It includes automatic token refresh, expiry management, and seamless integration with the existing authentication system.

## Key Features

### ✅ **Secure Storage**
- **Encrypted storage** using Expo SecureStore (iOS Keychain / Android Keystore)
- **Device-level security** - tokens are protected by device lock/biometrics
- **Automatic cleanup** on app uninstall or logout

### ✅ **Automatic Token Management**
- **Auto-refresh** tokens before they expire (5-minute buffer)
- **Background refresh** every 5 minutes
- **Proactive refresh** in API interceptors
- **Graceful fallback** to login if refresh fails

### ✅ **Seamless Integration**
- **Backward compatibility** with existing storage system
- **Automatic migration** from AsyncStorage to SecureStore
- **Zero-config** - works automatically after login

### ✅ **Token Lifecycle Management**
- **Expiry tracking** with millisecond precision
- **Validity checking** before API requests
- **Automatic cleanup** of expired tokens
- **Token status monitoring** via management screen

## Implementation Details

### Core Components

#### `SecureTokenStorage` Class
```typescript
// Singleton instance for token management
const secureTokenStorage = SecureTokenStorage.getInstance();

// Save tokens with automatic expiry calculation
await secureTokenStorage.saveTokens(accessToken, refreshToken);

// Get valid access token (auto-refreshes if needed)
const token = await secureTokenStorage.getValidAccessToken();

// Check authentication status
const isValid = await secureTokenStorage.hasValidAuth();
```

#### Token Data Structure
```typescript
interface TokenData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: number;    // Unix timestamp in milliseconds
  refreshTokenExpiry: number;   // Unix timestamp in milliseconds
}
```

### Security Features

#### Secure Storage Keys
```typescript
const SECURE_KEYS = {
  ACCESS_TOKEN: 'secure_access_token',
  REFRESH_TOKEN: 'secure_refresh_token',
  TOKEN_EXPIRY: 'secure_token_expiry',
  REFRESH_EXPIRY: 'secure_refresh_expiry',
} as const;
```

#### Encryption & Protection
- **iOS**: Stored in iOS Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`
- **Android**: Stored in Android Keystore with AES encryption
- **Device Security**: Protected by device lock screen/biometrics
- **App Sandbox**: Isolated per app, cannot be accessed by other apps

### Automatic Token Refresh

#### Proactive Refresh Strategy
```typescript
// Refresh tokens if they expire within 5 minutes
const timeUntilExpiry = tokenExpiry - Date.now();
if (timeUntilExpiry < 5 * 60 * 1000) {
  await secureTokenStorage.refreshTokens();
}
```

#### Background Auto-Refresh
```typescript
// Check and refresh every 5 minutes
setInterval(async () => {
  const tokenData = await secureTokenStorage.getTokenData();
  if (tokenData && shouldRefresh(tokenData.accessTokenExpiry)) {
    await secureTokenStorage.refreshTokens();
  }
}, 5 * 60 * 1000);
```

#### API Interceptor Integration
```typescript
// Automatic token injection and refresh on 401 errors
api.interceptors.request.use(async (config) => {
  const token = await secureTokenStorage.getValidAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### Migration & Compatibility

#### Automatic Migration
```typescript
// Migrate existing tokens to secure storage
const accessToken = await getAccessToken(); // AsyncStorage
const refreshToken = await getRefreshToken(); // AsyncStorage

if (accessToken && refreshToken) {
  await secureTokenStorage.saveTokens(accessToken, refreshToken);
  console.log('🔄 Migrated tokens to secure storage');
}
```

#### Backward Compatibility
```typescript
// Fallback functions for existing code
export const getSecureAccessToken = () => secureTokenStorage.getValidAccessToken();
export const saveSecureTokens = (access, refresh) => secureTokenStorage.saveTokens(access, refresh);
```

## Usage Examples

### Basic Token Operations

#### Save Tokens (Login)
```typescript
// After successful login/OTP verification
const { accessToken, refreshToken } = authResponse.data.authTokens;
await secureTokenStorage.saveTokens(accessToken, refreshToken);

// Start background auto-refresh
secureTokenStorage.startAutoRefresh();
```

#### Get Valid Token (API Requests)
```typescript
// Automatically handles refresh if needed
const token = await secureTokenStorage.getValidAccessToken();
if (token) {
  // Use token for API request
  api.defaults.headers.Authorization = `Bearer ${token}`;
}
```

#### Check Authentication Status
```typescript
// Check if user has valid authentication
const hasValidAuth = await secureTokenStorage.hasValidAuth();
if (!hasValidAuth) {
  // Redirect to login
  router.push('/login');
}
```

#### Manual Token Refresh
```typescript
// Force refresh tokens
const success = await secureTokenStorage.refreshTokens();
if (success) {
  console.log('✅ Tokens refreshed successfully');
} else {
  console.log('❌ Refresh failed, user needs to login');
}
```

#### Clear Tokens (Logout)
```typescript
// Clear all stored tokens
await secureTokenStorage.clearTokens();
```

### Advanced Usage

#### Token Expiry Information
```typescript
const expiryInfo = await secureTokenStorage.getTokenExpiryInfo();
console.log('Access token expires:', expiryInfo.accessTokenExpiry);
console.log('Refresh token expires:', expiryInfo.refreshTokenExpiry);
console.log('Access token valid:', expiryInfo.accessTokenValid);
console.log('Refresh token valid:', expiryInfo.refreshTokenValid);
```

#### Custom Refresh Logic
```typescript
class CustomTokenManager extends SecureTokenStorage {
  async customRefreshLogic() {
    const tokenData = await this.getTokenData();
    if (tokenData) {
      // Custom refresh implementation
      const response = await customRefreshAPI(tokenData.refreshToken);
      await this.saveTokens(response.accessToken, response.refreshToken);
    }
  }
}
```

## Integration Points

### Authentication Store
```typescript
// Enhanced auth store with secure token support
export const useAuthStore = create<AuthState>((set) => ({
  hydrate: async () => {
    const hasValidAuth = await secureTokenStorage.hasValidAuth();
    if (hasValidAuth) {
      // User is authenticated
      const user = await AuthAPI.fetchAuthUser();
      set({ user, isAuthenticated: true });
      secureTokenStorage.startAutoRefresh();
    }
  },
  
  logout: async () => {
    await secureTokenStorage.clearTokens();
    set({ user: undefined, isAuthenticated: false });
  },
}));
```

### API Client
```typescript
// Enhanced API client with secure token integration
api.interceptors.request.use(async (config) => {
  const token = await secureTokenStorage.getValidAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshed = await secureTokenStorage.refreshTokens();
      if (refreshed) {
        // Retry original request
        return api(error.config);
      }
    }
    return Promise.reject(error);
  }
);
```

### Auth API
```typescript
// Enhanced auth API with secure token storage
export class AuthAPI {
  static async verifyOTP(email: string, otp: string) {
    const response = await api.post('/verify-otp', { email, otp });
    const { accessToken, refreshToken } = response.data.authTokens;
    
    // Save to secure storage
    await secureTokenStorage.saveTokens(accessToken, refreshToken);
    secureTokenStorage.startAutoRefresh();
    
    return response.data;
  }
  
  static async refreshToken(refreshToken: string) {
    const response = await api.post('/refresh-token', { refreshToken });
    return response.data;
  }
}
```

## Token Management UI

### Token Status Screen
```typescript
// Access token management screen at /token-management
const TokenManagementScreen = () => {
  const [tokenInfo, setTokenInfo] = useState();
  
  useEffect(() => {
    const loadTokenInfo = async () => {
      const info = await secureTokenStorage.getTokenExpiryInfo();
      setTokenInfo(info);
    };
    loadTokenInfo();
  }, []);
  
  return (
    <View>
      <Text>Access Token: {tokenInfo.accessTokenValid ? 'Valid' : 'Invalid'}</Text>
      <Text>Expires: {tokenInfo.accessTokenExpiry?.toLocaleString()}</Text>
      <Button onPress={() => secureTokenStorage.refreshTokens()}>
        Refresh Tokens
      </Button>
    </View>
  );
};
```

## Security Considerations

### Token Storage Security
- **Encryption**: All tokens encrypted at rest using device hardware security
- **Access Control**: Tokens only accessible when device is unlocked
- **Isolation**: App-specific storage, cannot be accessed by other apps
- **Cleanup**: Automatic cleanup on app uninstall or factory reset

### Network Security
- **HTTPS Only**: All token requests use HTTPS
- **Token Rotation**: Regular token refresh reduces exposure window
- **Secure Headers**: Tokens sent in Authorization header, not URL params
- **Request Timeout**: 10-second timeout prevents hanging requests

### Error Handling
- **Graceful Degradation**: Falls back to login if refresh fails
- **Retry Logic**: Automatic retry with exponential backoff
- **Error Logging**: Comprehensive logging for debugging
- **User Feedback**: Clear error messages for users

## Performance Optimizations

### Caching Strategy
- **Memory Cache**: Keep current token in memory for fast access
- **Lazy Loading**: Only load tokens when needed
- **Background Refresh**: Refresh tokens before they expire
- **Batch Operations**: Group multiple token operations

### Network Optimization
- **Request Deduplication**: Prevent multiple simultaneous refresh requests
- **Connection Pooling**: Reuse HTTP connections for token requests
- **Compression**: Use gzip compression for token responses
- **CDN**: Use CDN for auth endpoints if available

## Monitoring & Analytics

### Token Metrics
- **Refresh Success Rate**: Track successful vs failed refreshes
- **Token Lifetime**: Monitor average token usage duration
- **Refresh Frequency**: Track how often tokens are refreshed
- **Error Rates**: Monitor authentication error rates

### Debug Logging
```typescript
// Enable debug logging
console.log('🔐 Saving tokens to secure storage...');
console.log('✅ Tokens saved securely');
console.log('🔄 Auto-refreshing tokens...');
console.log('⏰ Access token expires in 5 minutes');
```

## Troubleshooting

### Common Issues

#### Tokens Not Persisting
- **Check Device Security**: Ensure device has lock screen enabled
- **Verify Permissions**: Check app has necessary permissions
- **Storage Limits**: Ensure device has sufficient storage space

#### Refresh Failures
- **Network Connectivity**: Check internet connection
- **Server Status**: Verify auth server is responding
- **Token Expiry**: Check if refresh token has expired

#### Migration Issues
- **Clear Old Tokens**: Clear AsyncStorage tokens after migration
- **Version Compatibility**: Ensure app version supports secure storage
- **Device Compatibility**: Check device supports SecureStore

### Debug Commands
```typescript
// Check token status
const tokenData = await secureTokenStorage.getTokenData();
console.log('Token data:', tokenData);

// Force refresh
const success = await secureTokenStorage.refreshTokens();
console.log('Refresh success:', success);

// Clear all tokens
await secureTokenStorage.clearTokens();
console.log('Tokens cleared');
```

## Future Enhancements

### Planned Features
- [ ] Biometric authentication for token access
- [ ] Token sharing between app instances
- [ ] Advanced token analytics
- [ ] Custom refresh strategies
- [ ] Token backup and restore

### Security Improvements
- [ ] Certificate pinning for auth requests
- [ ] Token obfuscation in memory
- [ ] Advanced threat detection
- [ ] Audit logging for token operations

## Conclusion

The secure token storage system provides a robust, secure, and user-friendly way to manage authentication tokens in React Native apps. It combines the security of device-level encryption with the convenience of automatic token management, ensuring users stay authenticated while maintaining the highest security standards.

The system is designed to be:
- **Secure**: Using device hardware security features
- **Reliable**: Automatic refresh and error handling
- **Performant**: Optimized for mobile devices
- **User-friendly**: Transparent operation with clear feedback
- **Developer-friendly**: Simple API with comprehensive documentation