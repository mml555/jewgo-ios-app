# 🔐 Battle-Hardened Authentication System Implementation Guide

## 📋 Overview

This guide provides step-by-step instructions for implementing the battle-hardened, future-proof authentication system with role-based access control (RBAC) and reCAPTCHA integration for the Jewgo app.

## 🏗️ Architecture Summary

### **Core Principles**
- **Separate Auth Service**: Standalone authentication service with OIDC/OAuth2.1 surface
- **Short-lived Access + Rotating Refresh**: 15-minute access tokens with family-based rotation
- **Passkeys First**: WebAuthn/passkeys as primary authentication (passwords optional)
- **RBAC is Data, Not Code**: Roles and permissions stored in database, evaluated by middleware
- **Defense in Depth**: Rate limiting, risk assessment, conditional CAPTCHA
- **Zero-Trust**: mTLS + token verification at every service boundary

### **Key Components**
1. **Backend Services**: AuthService, RBACService, CaptchaService
2. **Database Schema**: Normalized auth tables with audit logging
3. **React Native Client**: Secure token storage with PKCE flow
4. **CAPTCHA Integration**: Risk-based triggering with multiple providers
5. **Session Management**: Family-based rotation with reuse detection

---

## 🚀 Implementation Steps

### **Phase 1: Database Setup**

#### 1.1 Run Database Migration
```bash
cd backend
psql -U jewgo_user -d jewgo_dev -f migrations/001_auth_schema.sql
```

#### 1.2 Verify Schema Creation
```sql
-- Check tables were created
\dt

-- Check default roles and permissions
SELECT r.name, array_agg(p.name) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
LEFT JOIN permissions p ON rp.permission_id = p.id
GROUP BY r.id, r.name
ORDER BY r.name;
```

### **Phase 2: Backend Configuration**

#### 2.1 Environment Variables
Copy `backend/env.example` to `backend/.env` and configure:

```bash
# Required JWT secrets (generate secure random strings)
JWT_SECRET=your-64-character-random-string-here
JWT_REFRESH_SECRET=your-64-character-random-string-here

# reCAPTCHA configuration (get from Google reCAPTCHA console)
RECAPTCHA_V2_SITE_KEY=6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI  # Test key
RECAPTCHA_V2_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe  # Test key

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=jewgo_dev
DB_USER=jewgo_user
DB_PASSWORD=jewgo_dev_password
```

#### 2.2 Install Dependencies
```bash
cd backend
npm install express-rate-limit compression
```

#### 2.3 Test Backend
```bash
npm start
# Should see: "🔐 Auth system: healthy"
```

### **Phase 3: Frontend Integration**

#### 3.1 Install React Native Dependencies
```bash
npm install react-native-webview react-native-device-info
cd ios && pod install && cd ..
```

#### 3.2 Update App.tsx
```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import AppNavigator from './navigation/AppNavigator';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
```

#### 3.3 Create Auth Navigation
```typescript
// src/navigation/AuthNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

const Stack = createStackNavigator();

const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

export default AuthNavigator;
```

#### 3.4 Update Root Navigation
```typescript
// src/navigation/RootNavigator.tsx
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
```

### **Phase 4: Testing**

#### 4.1 Test User Registration
```bash
curl -X POST http://localhost:3001/api/v5/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

#### 4.2 Test User Login
```bash
curl -X POST http://localhost:3001/api/v5/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "testpassword123"
  }'
```

#### 4.3 Test Token Refresh
```bash
curl -X POST http://localhost:3001/api/v5/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your-refresh-token-here"
  }'
```

### **Phase 5: Integration with Existing Features**

#### 5.1 Protect Add Category Form
```typescript
// src/screens/AddCategoryScreen.tsx
import { useAuth } from '../contexts/AuthContext';

const AddCategoryScreen: React.FC = () => {
  const { isAuthenticated, checkPermission } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Auth');
      return;
    }
    
    if (!checkPermission('entities:create')) {
      Alert.alert('Access Denied', 'You need permission to create listings');
      navigation.goBack();
      return;
    }
  }, [isAuthenticated, checkPermission]);

  // Rest of component...
};
```

#### 5.2 Update API Service
```typescript
// src/services/api-v5.ts
import { authService } from './AuthService';

class ApiV5Service {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const token = authService.getAccessToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...options.headers,
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    };

    // Rest of implementation...
  }
}
```

---

## 🔧 Configuration Options

### **CAPTCHA Configuration**

#### Risk-Based Triggering
```typescript
// Adjust risk thresholds in CaptchaService
const thresholds = {
  login: 0.7,        // Higher threshold = less intrusive
  signup: 0.5,       // Medium threshold
  review: 0.6,       // Medium threshold
  password_reset: 0.4, // Lower threshold = more security
};

captchaService.updateRiskThresholds(thresholds);
```

#### Provider Selection
```typescript
// Use reCAPTCHA v2 for mobile (most reliable)
const provider = 'recaptcha_v2';

// Use reCAPTCHA v3 for web (better UX)
const provider = 'recaptcha_v3';

// Use hCaptcha as alternative
const provider = 'hcaptcha';
```

### **RBAC Configuration**

#### Custom Roles
```typescript
// Create custom role
await rbacService.createRole({
  name: 'content_manager',
  description: 'Can manage content and moderate reviews',
  permissions: [
    'entities:read:all',
    'entities:update:all',
    'reviews:moderate',
    'users:read'
  ]
});
```

#### Scoped Permissions
```typescript
// Assign role with scope (e.g., specific organization)
await rbacService.assignRoleToUser(
  userId,
  'business_owner',
  'org:123', // Scope to specific organization
  null, // No expiration
  adminUserId // Assigned by admin
);
```

---

## 🛡️ Security Best Practices

### **Token Security**
- **Access tokens**: 15-minute TTL, stored in memory only
- **Refresh tokens**: 7-day TTL, stored in secure storage (Keychain/Keystore)
- **Family rotation**: Entire session family revoked on reuse detection
- **Secure storage**: Never store tokens in AsyncStorage or localStorage

### **CAPTCHA Security**
- **Risk-based triggering**: Only show CAPTCHA when risk score exceeds threshold
- **Multiple providers**: Support reCAPTCHA, hCaptcha for redundancy
- **Analytics**: Log all CAPTCHA attempts for threat analysis
- **Mobile optimization**: Use WebView for reliable CAPTCHA rendering

### **Rate Limiting**
- **Login**: 5 attempts per 15 minutes per IP
- **Signup**: 3 attempts per hour per IP
- **Password reset**: 3 attempts per hour per email
- **Progressive backoff**: Exponential delays for repeated failures

### **Audit Logging**
- **All auth events**: Login, logout, registration, password changes
- **Security events**: Failed attempts, token reuse, suspicious activity
- **RBAC changes**: Role assignments, permission modifications
- **Retention**: 1 year for audit logs, 30 days for CAPTCHA challenges

---

## 📊 Monitoring & Analytics

### **Key Metrics**
- **Authentication success rate**: Should be >95%
- **CAPTCHA pass rate**: Should be >90%
- **Token refresh rate**: Monitor for abuse
- **Failed login attempts**: Alert on spikes
- **Session duration**: Track user engagement

### **Alerting**
- **High failure rates**: >20% login failures in 5 minutes
- **Token reuse detection**: Immediate alert
- **Unusual patterns**: New device + high-risk location
- **CAPTCHA abuse**: High failure rate from single IP

### **Dashboards**
- **Real-time auth metrics**: Success/failure rates
- **Geographic distribution**: Login locations
- **Device analytics**: Platform, version, model
- **Security events**: Failed attempts, blocked requests

---

## 🧪 Testing Strategy

### **Unit Tests**
```typescript
// Test token rotation and reuse detection
describe('AuthService', () => {
  it('should detect token reuse and revoke family', async () => {
    // Test implementation
  });
  
  it('should calculate risk score correctly', async () => {
    // Test risk assessment
  });
});
```

### **Integration Tests**
```typescript
// Test complete auth flow
describe('Authentication Flow', () => {
  it('should complete registration → login → refresh → logout', async () => {
    // End-to-end test
  });
});
```

### **Security Tests**
```typescript
// Test security measures
describe('Security', () => {
  it('should prevent brute force attacks', async () => {
    // Rate limiting test
  });
  
  it('should validate JWT signatures', async () => {
    // Token validation test
  });
});
```

---

## 🚀 Deployment Checklist

### **Pre-Deployment**
- [ ] Database migration completed
- [ ] Environment variables configured
- [ ] JWT secrets generated (64+ characters)
- [ ] reCAPTCHA keys configured
- [ ] Rate limiting tested
- [ ] Security headers configured
- [ ] SSL/TLS certificates installed

### **Production Configuration**
- [ ] `NODE_ENV=production`
- [ ] Strong database passwords
- [ ] Redis for session storage
- [ ] Load balancer configured
- [ ] Monitoring and alerting setup
- [ ] Backup procedures in place

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Authentication flow tested
- [ ] CAPTCHA working correctly
- [ ] Rate limiting active
- [ ] Audit logs being generated
- [ ] Performance metrics normal

---

## 🔄 Future Enhancements

### **Phase 2: WebAuthn Integration**
- Implement WebAuthn/passkeys as primary authentication
- Support for hardware security keys
- Biometric authentication on mobile

### **Phase 3: OIDC Provider**
- Full OIDC/OAuth2.1 compliance
- Third-party app integration
- Single sign-on (SSO) capabilities

### **Phase 4: Advanced Security**
- Machine learning for risk assessment
- Behavioral biometrics
- Advanced threat detection

---

## 📞 Support & Troubleshooting

### **Common Issues**

#### CAPTCHA Not Loading
- Check site key configuration
- Verify network connectivity
- Test with different providers

#### Token Refresh Failing
- Check refresh token validity
- Verify JWT secrets match
- Check session expiration

#### Permission Denied
- Verify user roles assigned
- Check permission definitions
- Validate resource scoping

### **Debug Mode**
```typescript
// Enable debug logging
process.env.DEBUG_AUTH = 'true';

// Check auth service health
const health = await authSystem.healthCheck();
console.log('Auth health:', health);
```

### **Performance Tuning**
- **Database indexes**: Ensure proper indexing on auth tables
- **Connection pooling**: Configure appropriate pool sizes
- **Caching**: Use Redis for session and permission caching
- **CDN**: Serve static assets from CDN

---

This implementation provides a production-ready, battle-hardened authentication system that scales with your application while maintaining security best practices and excellent user experience.
