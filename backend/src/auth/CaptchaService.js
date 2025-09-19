const crypto = require('crypto');

class CaptchaService {
  constructor(dbPool) {
    this.db = dbPool;
    this.providers = new Map();
    this.riskThresholds = {
      low: 0.8,    // reCAPTCHA v3 score threshold for low risk
      medium: 0.5, // reCAPTCHA v3 score threshold for medium risk
      high: 0.3    // reCAPTCHA v3 score threshold for high risk
    };
  }

  // ==============================================
  // PROVIDER REGISTRATION
  // ==============================================

  registerProvider(name, provider) {
    this.providers.set(name, provider);
  }

  getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`CAPTCHA provider not found: ${name}`);
    }
    return provider;
  }

  // ==============================================
  // RISK-BASED CAPTCHA TRIGGERING
  // ==============================================

  async shouldTriggerCaptcha(flow, userId, ipAddress, userAgent, additionalRiskFactors = {}) {
    const riskScore = await this.calculateRiskScore(flow, userId, ipAddress, userAgent, additionalRiskFactors);
    
    // Risk thresholds by flow
    const thresholds = {
      login: 1.0,        // Disabled for testing (less intrusive)
      signup: 0.5,       // Medium threshold for signup
      review: 0.6,       // Medium threshold for reviews
      password_reset: 0.4, // Lower threshold for password reset
      contact: 0.3       // Lower threshold for contact forms
    };
    
    const threshold = thresholds[flow] || 0.5;
    return riskScore > threshold;
  }

  async calculateRiskScore(flow, userId, ipAddress, userAgent, additionalRiskFactors = {}) {
    let riskScore = 0.5; // Base risk score
    
    try {
      // Check recent failed attempts from this IP
      const failedAttempts = await this.getRecentFailedAttempts(ipAddress, '1 hour');
      riskScore += Math.min(failedAttempts * 0.1, 0.4);
      
      // Check signup velocity from this IP
      if (flow === 'signup') {
        const recentSignups = await this.getRecentSignups(ipAddress, '1 hour');
        riskScore += Math.min(recentSignups * 0.2, 0.5);
      }
      
      // Check if user is new (first time login/signup)
      if (userId) {
        const userAge = await this.getUserAge(userId);
        if (userAge < 24 * 60 * 60 * 1000) { // Less than 24 hours
          riskScore += 0.2;
        }
      } else {
        riskScore += 0.3; // Higher risk for anonymous users
      }
      
      // Check for suspicious user agent patterns
      if (this.isSuspiciousUserAgent(userAgent)) {
        riskScore += 0.3;
      }
      
      // Check for TOR/VPN usage (if you have IP reputation service)
      if (additionalRiskFactors.isTor || additionalRiskFactors.isVPN) {
        riskScore += 0.4;
      }
      
      // Check for geographic anomalies
      if (additionalRiskFactors.geoAnomaly) {
        riskScore += 0.3;
      }
      
      // Check for device fingerprint anomalies
      if (additionalRiskFactors.deviceAnomaly) {
        riskScore += 0.2;
      }
      
      return Math.min(riskScore, 1.0); // Cap at 1.0
      
    } catch (error) {
      console.error('Error calculating risk score:', error);
      return 0.8; // High risk if calculation fails
    }
  }

  // ==============================================
  // CAPTCHA VERIFICATION
  // ==============================================

  async verifyCaptcha(providerName, token, flow, ipAddress, userAgent, userId = null) {
    const provider = this.getProvider(providerName);
    
    try {
      // Verify with provider
      const result = await provider.verify(token, ipAddress);
      
      // Store result in database for analytics
      await this.logCaptchaChallenge(flow, providerName, result.success, result.score, ipAddress, userAgent, userId, result.details);
      
      return {
        success: result.success,
        score: result.score,
        provider: providerName,
        timestamp: new Date()
      };
      
    } catch (error) {
      console.error(`CAPTCHA verification failed for provider ${providerName}:`, error);
      
      // Log failed verification
      await this.logCaptchaChallenge(flow, providerName, false, 0, ipAddress, userAgent, userId, { error: error.message });
      
      return {
        success: false,
        score: 0,
        provider: providerName,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async verifyWithRiskAssessment(flow, token, providerName, userId, ipAddress, userAgent, additionalRiskFactors = {}) {
    // First, check if CAPTCHA should be triggered
    const shouldTrigger = await this.shouldTriggerCaptcha(flow, userId, ipAddress, userAgent, additionalRiskFactors);
    
    if (!shouldTrigger) {
      return {
        success: true,
        score: 1.0,
        provider: 'risk_assessment',
        reason: 'low_risk_no_captcha_required',
        timestamp: new Date()
      };
    }
    
    // Verify CAPTCHA
    return await this.verifyCaptcha(providerName, token, flow, ipAddress, userAgent, userId);
  }

  // ==============================================
  // RISK ANALYSIS HELPERS
  // ==============================================

  async getRecentFailedAttempts(ipAddress, timeWindow) {
    const result = await this.db.query(`
      SELECT COUNT(*) as count
      FROM auth_events
      WHERE ip_address = $1 
        AND event IN ('login', 'register')
        AND success = false
        AND created_at > NOW() - INTERVAL '${timeWindow}'
    `, [ipAddress]);
    
    return parseInt(result.rows[0].count);
  }

  async getRecentSignups(ipAddress, timeWindow) {
    const result = await this.db.query(`
      SELECT COUNT(*) as count
      FROM auth_events
      WHERE ip_address = $1 
        AND event = 'register'
        AND success = true
        AND created_at > NOW() - INTERVAL '${timeWindow}'
    `, [ipAddress]);
    
    return parseInt(result.rows[0].count);
  }

  async getUserAge(userId) {
    const result = await this.db.query(
      'SELECT EXTRACT(EPOCH FROM (NOW() - created_at)) * 1000 as age_ms FROM users WHERE id = $1',
      [userId]
    );
    
    return result.rows[0]?.age_ms || 0;
  }

  isSuspiciousUserAgent(userAgent) {
    if (!userAgent) return true;
    
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /headless/i,
      /phantom/i,
      /selenium/i,
      /automated/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /java/i,
      /okhttp/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  // ==============================================
  // DATABASE LOGGING
  // ==============================================

  async logCaptchaChallenge(flow, provider, verdict, score, ipAddress, userAgent, userId, details) {
    try {
      await this.db.query(`
        INSERT INTO captcha_challenges (flow, provider, verdict, score, ip_address, user_agent, user_id, details)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [flow, provider, verdict, score, ipAddress, userAgent, userId, JSON.stringify(details)]);
    } catch (error) {
      console.error('Failed to log CAPTCHA challenge:', error);
    }
  }

  // ==============================================
  // ANALYTICS & MONITORING
  // ==============================================

  async getCaptchaStats(timeWindow = '24 hours') {
    const result = await this.db.query(`
      SELECT 
        provider,
        flow,
        COUNT(*) as total_challenges,
        COUNT(*) FILTER (WHERE verdict = true) as successful_challenges,
        AVG(score) as average_score,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM captcha_challenges
      WHERE created_at > NOW() - INTERVAL '${timeWindow}'
      GROUP BY provider, flow
      ORDER BY total_challenges DESC
    `);
    
    return result.rows;
  }

  async getRiskAnalysis(timeWindow = '24 hours') {
    const result = await this.db.query(`
      SELECT 
        flow,
        COUNT(*) as total_attempts,
        COUNT(*) FILTER (WHERE provider = 'risk_assessment') as risk_assessment_passed,
        COUNT(*) FILTER (WHERE provider != 'risk_assessment' AND verdict = true) as captcha_passed,
        COUNT(*) FILTER (WHERE provider != 'risk_assessment' AND verdict = false) as captcha_failed,
        AVG(score) as average_score
      FROM captcha_challenges
      WHERE created_at > NOW() - INTERVAL '${timeWindow}'
      GROUP BY flow
      ORDER BY total_attempts DESC
    `);
    
    return result.rows;
  }

  async getSuspiciousActivity(timeWindow = '1 hour') {
    const result = await this.db.query(`
      SELECT 
        ip_address,
        COUNT(*) as challenge_count,
        COUNT(*) FILTER (WHERE verdict = false) as failed_count,
        COUNT(DISTINCT flow) as flow_diversity,
        MIN(created_at) as first_challenge,
        MAX(created_at) as last_challenge
      FROM captcha_challenges
      WHERE created_at > NOW() - INTERVAL '${timeWindow}'
      GROUP BY ip_address
      HAVING COUNT(*) > 10 OR COUNT(*) FILTER (WHERE verdict = false) > 5
      ORDER BY challenge_count DESC
    `);
    
    return result.rows;
  }

  // ==============================================
  // CONFIGURATION MANAGEMENT
  // ==============================================

  updateRiskThresholds(thresholds) {
    this.riskThresholds = { ...this.riskThresholds, ...thresholds };
  }

  getRiskThresholds() {
    return { ...this.riskThresholds };
  }

  // ==============================================
  // CLEANUP
  // ==============================================

  async cleanupOldChallenges(daysToKeep = 30) {
    const result = await this.db.query(`
      DELETE FROM captcha_challenges 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      RETURNING COUNT(*) as deleted_count
    `);
    
    return result.rows[0]?.deleted_count || 0;
  }
}

module.exports = CaptchaService;
