# Security Implementation Guide

## 🔐 JWT Token Security Features

### Token Configuration
- **Expiration**: 2 hours (7200 seconds)
- **Algorithm**: HS256 (HMAC SHA-256)
- **Issuer**: yatra-app
- **Audience**: yatra-admin

### Enhanced Security Features

#### 1. **Short Token Lifespan**
- Tokens expire in **2 hours** for enhanced security
- Reduces risk of token theft and unauthorized access
- Automatic cleanup of expired sessions

#### 2. **Unique Session IDs**
- Each token includes a unique session ID
- Prevents token replay attacks
- Enables session tracking and revocation

#### 3. **Token Refresh Mechanism**
- Users can refresh tokens before expiration
- Only allows refresh within 30 minutes of expiry
- Prevents indefinite token extension

#### 4. **Enhanced Validation**
- Validates issuer and audience claims
- Checks token format and signature
- Provides detailed error codes for debugging

## 🚀 API Endpoints

### Authentication Endpoints

#### 1. **Admin Login**
```http
POST /api/admin/login
Content-Type: application/json

{
  "email": "admin@yatra.com",
  "password": "Admin@123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "2h",
  "tokenType": "Bearer",
  "issuedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 2. **Token Refresh**
```http
POST /api/admin/refresh
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "2h",
  "tokenType": "Bearer",
  "refreshedAt": "2024-01-15T10:30:00.000Z"
}
```

#### 3. **Token Validation**
```http
GET /api/admin/validate
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "Token is valid",
  "user": {
    "email": "admin@yatra.com",
    "role": "admin"
  },
  "expiresIn": 7200,
  "expiresAt": "2024-01-15T12:30:00.000Z"
}
```

## 🛡️ Security Best Practices

### 1. **Token Storage**
- Store tokens in secure HTTP-only cookies (recommended)
- Or store in localStorage/sessionStorage for client-side apps
- Never store tokens in plain text or unencrypted databases

### 2. **Token Transmission**
- Always use HTTPS in production
- Include tokens in Authorization header: `Bearer YOUR_TOKEN`
- Never send tokens in URL parameters

### 3. **Error Handling**
The system provides detailed error codes:

- `MISSING_TOKEN` - No token provided
- `INVALID_TOKEN` - Token format is invalid
- `TOKEN_EXPIRED` - Token has expired
- `INVALID_TOKEN_FORMAT` - Token structure is malformed

### 4. **Rate Limiting**
Consider implementing rate limiting for:
- Login attempts (prevent brute force)
- Token refresh requests
- API calls per user

### 5. **Monitoring**
- Log all authentication attempts
- Monitor for suspicious patterns
- Track token usage and expiration

## 🔧 Environment Variables

Ensure these are set in your `.env` file:

```bash
# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=2h

# Admin Credentials
DEFAULT_ADMIN_EMAIL=admin@yatra.com
DEFAULT_ADMIN_PASSWORD=Admin@123
```

## 🧪 Testing Security Features

### 1. **Test Token Expiration**
```bash
# Wait 2+ hours after login, then try to access protected endpoint
curl -H "Authorization: Bearer EXPIRED_TOKEN" \
     http://192.168.20.174:5000/api/admin/validate
```

### 2. **Test Token Refresh**
```bash
# Refresh token before expiration
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     http://192.168.20.174:5000/api/admin/refresh
```

### 3. **Test Invalid Token**
```bash
# Try with invalid token
curl -H "Authorization: Bearer invalid_token" \
     http://192.168.20.174:5000/api/admin/validate
```

## 🚨 Security Considerations

### 1. **Production Deployment**
- Use strong, randomly generated JWT secrets
- Enable HTTPS/TLS encryption
- Implement proper CORS policies
- Use environment-specific configurations

### 2. **Token Rotation**
- Consider implementing token rotation on refresh
- Invalidate old tokens when new ones are issued
- Implement session management

### 3. **Additional Security Layers**
- Implement IP whitelisting for admin access
- Add two-factor authentication (2FA)
- Use secure password policies
- Implement account lockout mechanisms

## 📊 Token Structure

The JWT payload includes:

```json
{
  "email": "admin@yatra.com",
  "role": "admin",
  "loginTime": "2024-01-15T10:30:00.000Z",
  "sessionId": "abc123def456",
  "iat": 1705312200,
  "exp": 1705319400,
  "iss": "yatra-app",
  "aud": "yatra-admin"
}
```

## 🔄 Token Lifecycle

1. **Login** → Generate 2-hour token
2. **Use** → Include token in API requests
3. **Refresh** → Extend token before expiration (within 30 minutes)
4. **Expire** → Token becomes invalid after 2 hours
5. **Re-login** → Generate new token after expiration

This implementation provides a robust, secure authentication system with proper token management and security features.
