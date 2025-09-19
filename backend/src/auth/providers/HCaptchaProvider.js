class HCaptchaProvider {
  constructor(config) {
    this.secretKey = config.secretKey;
    this.siteKey = config.siteKey;
    this.baseUrl = config.baseUrl || 'https://hcaptcha.com/siteverify';
    
    if (!this.secretKey) {
      throw new Error('hCaptcha secret key is required');
    }
  }

  async verify(token, remoteIp = null) {
    if (!token) {
      return {
        success: false,
        score: 0,
        error: 'Missing token',
        details: { error_codes: ['missing-input-response'] }
      };
    }

    try {
      const response = await this.makeVerificationRequest(token, remoteIp);
      const result = await response.json();
      
      return this.processVerificationResult(result);
    } catch (error) {
      console.error('hCaptcha verification request failed:', error);
      return {
        success: false,
        score: 0,
        error: error.message,
        details: { error_codes: ['network-error'] }
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
      throw new Error(`hCaptcha API returned ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  processVerificationResult(result) {
    const {
      success,
      challenge_ts,
      hostname,
      error_codes = []
    } = result;

    if (!success) {
      return {
        success: false,
        score: 0,
        error: 'Verification failed',
        details: {
          error_codes,
          challenge_ts,
          hostname
        }
      };
    }

    return {
      success: true,
      score: 1.0, // hCaptcha doesn't provide scores, just success/failure
      details: {
        hostname,
        challenge_ts,
        provider: 'hcaptcha'
      }
    };
  }

  getSiteKey() {
    return this.siteKey;
  }

  getFrontendConfig() {
    return {
      siteKey: this.siteKey,
      provider: 'hcaptcha'
    };
  }
}

module.exports = HCaptchaProvider;
