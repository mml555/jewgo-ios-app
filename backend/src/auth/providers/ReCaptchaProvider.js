class ReCaptchaProvider {
  constructor(config) {
    this.secretKey = config.secretKey;
    this.siteKey = config.siteKey;
    this.version = config.version || 'v2';
    this.threshold = config.threshold || 0.5;
    this.baseUrl =
      config.baseUrl || 'https://www.google.com/recaptcha/api/siteverify';

    if (!this.secretKey) {
      throw new Error('reCAPTCHA secret key is required');
    }
  }

  async verify(token, remoteIp = null) {
    if (!token) {
      return {
        success: false,
        score: 0,
        error: 'Missing token',
        details: { error_codes: ['missing-input-response'] },
      };
    }

    try {
      const response = await this.makeVerificationRequest(token, remoteIp);
      const result = await response.json();

      return this.processVerificationResult(result);
    } catch (error) {
      console.error('reCAPTCHA verification request failed:', error);
      return {
        success: false,
        score: 0,
        error: error.message,
        details: { error_codes: ['network-error'] },
      };
    }
  }

  async makeVerificationRequest(token, remoteIp) {
    const formData = new URLSearchParams();
    formData.append('secret', this.secretKey);
    formData.append('response', token);
    if (remoteIp) {
      formData.append('remoteip', remoteIp);
    }

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `reCAPTCHA API returned ${response.status}: ${response.statusText}`,
      );
    }

    return response;
  }

  processVerificationResult(result) {
    const { success, challenge_ts, hostname, error_codes = [] } = result;

    // Basic success check
    if (!success) {
      return {
        success: false,
        score: 0,
        error: 'Verification failed',
        details: {
          error_codes,
          challenge_ts,
          hostname,
        },
      };
    }

    // Version-specific processing
    if (this.version === 'v3') {
      return this.processV3Result(result);
    } else {
      return this.processV2Result(result);
    }
  }

  processV3Result(result) {
    const { score, action, hostname, challenge_ts } = result;

    // Check score threshold
    const meetsThreshold = score >= this.threshold;

    return {
      success: meetsThreshold,
      score: score,
      action: action,
      details: {
        hostname,
        challenge_ts,
        threshold: this.threshold,
        meets_threshold: meetsThreshold,
      },
    };
  }

  processV2Result(result) {
    const { hostname, challenge_ts } = result;

    // v2 doesn't have score, just success/failure
    return {
      success: true,
      score: 1.0, // v2 success = perfect score
      details: {
        hostname,
        challenge_ts,
        version: 'v2',
      },
    };
  }

  // Helper method to get site key for frontend
  getSiteKey() {
    return this.siteKey;
  }

  // Helper method to get configuration for frontend
  getFrontendConfig() {
    return {
      siteKey: this.siteKey,
      version: this.version,
      threshold: this.threshold,
    };
  }
}

module.exports = ReCaptchaProvider;
