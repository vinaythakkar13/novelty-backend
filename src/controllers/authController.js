import jwt from 'jsonwebtoken';

/**
 * Token Refresh Controller
 * Allows users to refresh their JWT token before expiration
 */
export const refreshToken = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token required',
                code: 'MISSING_TOKEN'
            });
        }

        // Verify the current token (even if expired)
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'yatra-app',
            audience: 'yatra-admin'
        });

        // Check if token is close to expiration (within 30 minutes)
        const now = Math.floor(Date.now() / 1000);
        const tokenExp = decoded.exp;
        const timeUntilExpiry = tokenExp - now;

        // Only allow refresh if token is within 30 minutes of expiry
        if (timeUntilExpiry > 1800) { // 30 minutes in seconds
            return res.status(400).json({
                success: false,
                message: 'Token is not close to expiration yet',
                code: 'TOKEN_NOT_EXPIRING_SOON',
                expiresIn: timeUntilExpiry
            });
        }

        // Generate new token with fresh expiration
        const newToken = jwt.sign(
            {
                email: decoded.email,
                role: decoded.role,
                loginTime: decoded.loginTime,
                sessionId: decoded.sessionId,
                refreshedAt: new Date().toISOString()
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '2h',
                issuer: 'yatra-app',
                audience: 'yatra-admin'
            }
        );

        res.status(200).json({
            success: true,
            message: 'Token refreshed successfully',
            token: newToken,
            expiresIn: '2h',
            tokenType: 'Bearer',
            refreshedAt: new Date().toISOString()
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired. Please login again.',
                code: 'TOKEN_EXPIRED'
            });
        }

        res.status(403).json({
            success: false,
            message: 'Invalid refresh token',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Token Validation Controller
 * Validates if a token is still valid without refreshing it
 */
export const validateToken = async (req, res) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token required',
                code: 'MISSING_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'yatra-app',
            audience: 'yatra-admin'
        });

        const now = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = decoded.exp - now;

        res.status(200).json({
            success: true,
            message: 'Token is valid',
            user: {
                email: decoded.email,
                role: decoded.role
            },
            expiresIn: timeUntilExpiry,
            expiresAt: new Date(decoded.exp * 1000).toISOString()
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired',
                code: 'TOKEN_EXPIRED',
                expiredAt: error.expiredAt
            });
        }

        res.status(403).json({
            success: false,
            message: 'Invalid token',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Update FCM Token Controller
 */
export const updateFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        const { id, role } = req.user;

        if (!fcmToken) {
            return res.status(400).json({ success: false, message: 'FCM token is required' });
        }

        if (role === 'admin') {
            const { updateAdminFcmToken } = await import('../models/AdminModel.js');
            await updateAdminFcmToken(id, fcmToken);
        } else {
            const { updateStaffFcmToken } = await import('../models/Staff.js');
            await updateStaffFcmToken(id, fcmToken);
        }

        res.status(200).json({ success: true, message: 'FCM token updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to update FCM token', error: error.message });
    }
};
