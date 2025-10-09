import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { debugLog, errorLog } from '../../utils/logger';
import { WebView } from 'react-native-webview';
import { configService } from '../../config/ConfigService';

interface ReCaptchaComponentProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  theme?: 'light' | 'dark';
  size?: 'normal' | 'compact' | 'invisible';
  testMode?: boolean;
}

interface WebViewMessage {
  type: string;
  data: any;
}

const ReCaptchaComponent: React.FC<ReCaptchaComponentProps> = ({
  siteKey,
  onVerify,
  onError,
  onExpire,
  theme = 'light',
  size = 'normal',
  testMode = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handlePress = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

        switch (message.type) {
          case 'recaptcha-verify':
            setIsVisible(false);
            onVerify(message.data.token);
            break;

          case 'recaptcha-error':
            onError?.(message.data.error);
            break;

          case 'recaptcha-expire':
            onExpire?.();
            break;

          case 'recaptcha-loaded':
            setIsLoading(false);
            break;

          default:
            debugLog('Unknown message type:', message.type);
        }
      } catch (error) {
        errorLog('Error parsing WebView message:', error);
      }
    },
    [onVerify, onError, onExpire],
  );

  const generateHTML = useCallback(() => {
    const config = configService.getConfig();
    const baseUrl = config.apiBaseUrl;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>reCAPTCHA</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: ${theme === 'dark' ? '#1a1a1a' : '#ffffff'};
              color: ${theme === 'dark' ? '#ffffff' : '#000000'};
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              box-sizing: border-box;
            }
            
            .container {
              text-align: center;
              max-width: 400px;
              width: 100%;
            }
            
            .recaptcha-container {
              margin: 20px 0;
              display: flex;
              justify-content: center;
            }
            
            .loading {
              color: #666;
              font-size: 16px;
              margin: 20px 0;
            }
            
            .error {
              color: #ff4444;
              font-size: 14px;
              margin: 10px 0;
            }
            
            .test-mode {
              background-color: #fff3cd;
              border: 1px solid #ffeaa7;
              border-radius: 4px;
              padding: 10px;
              margin: 10px 0;
              font-size: 12px;
              color: #856404;
            }
          </style>
        </head>
        <body>
          <div class="container">
            ${
              testMode
                ? '<div class="test-mode">⚠️ TEST MODE - reCAPTCHA is disabled</div>'
                : ''
            }
            
            <div class="recaptcha-container">
              <div id="recaptcha-container"></div>
            </div>
            
            <div id="loading" class="loading">Loading reCAPTCHA...</div>
            <div id="error" class="error" style="display: none;"></div>
          </div>
          
          <script src="https://www.google.com/recaptcha/api.js?render=${siteKey}" async defer></script>
          <script>
            let recaptchaWidgetId = null;
            
            function showError(message) {
              const errorDiv = document.getElementById('error');
              const loadingDiv = document.getElementById('loading');
              
              if (loadingDiv) loadingDiv.style.display = 'none';
              if (errorDiv) {
                errorDiv.textContent = message;
                errorDiv.style.display = 'block';
              }
            }
            
            function sendMessage(type, data) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: type,
                data: data
              }));
            }
            
            function onRecaptchaCallback(token) {
              sendMessage('recaptcha-verify', { token: token });
            }
            
            function onRecaptchaError(error) {
              errorLog('reCAPTCHA error:', error);
              sendMessage('recaptcha-error', { error: error });
              showError('reCAPTCHA verification failed');
            }
            
            function onRecaptchaExpire() {
              sendMessage('recaptcha-expire', {});
            }
            
            function loadRecaptcha() {
              try {
                // Check if reCAPTCHA is available
                if (typeof grecaptcha === 'undefined') {
                  showError('reCAPTCHA failed to load');
                  return;
                }
                
                // Hide loading indicator
                const loadingDiv = document.getElementById('loading');
                if (loadingDiv) loadingDiv.style.display = 'none';
                
                // Render reCAPTCHA
                recaptchaWidgetId = grecaptcha.render('recaptcha-container', {
                  'sitekey': '${siteKey}',
                  'callback': onRecaptchaCallback,
                  'expired-callback': onRecaptchaExpire,
                  'error-callback': onRecaptchaError,
                  'theme': '${theme}',
                  'size': '${size}',
                  'tabindex': 0
                });
                
                sendMessage('recaptcha-loaded', {});
                
              } catch (error) {
                errorLog('Error loading reCAPTCHA:', error);
                showError('Failed to load reCAPTCHA');
              }
            }
            
            // Test mode - simulate success
            if (${testMode}) {
              setTimeout(() => {
                const loadingDiv = document.getElementById('loading');
                if (loadingDiv) loadingDiv.style.display = 'none';
                
                // Simulate reCAPTCHA success
                setTimeout(() => {
                  sendMessage('recaptcha-verify', { token: 'test-token-' + Date.now() });
                }, 1000);
              }, 500);
            } else {
              // Load reCAPTCHA when script is ready
              if (typeof grecaptcha !== 'undefined') {
                loadRecaptcha();
              } else {
                // Wait for reCAPTCHA to load
                window.onRecaptchaLoad = loadRecaptcha;
              }
            }
            
            // Handle page visibility changes
            document.addEventListener('visibilitychange', function() {
              if (document.visibilityState === 'visible' && recaptchaWidgetId !== null) {
                try {
                  grecaptcha.reset(recaptchaWidgetId);
                } catch (error) {
                  errorLog('Error resetting reCAPTCHA:', error);
                }
              }
            });
          </script>
        </body>
      </html>
    `;
  }, [siteKey, theme, size, testMode]);

  const handleWebViewError = useCallback(() => {
    setIsLoading(false);
    onError?.('Failed to load reCAPTCHA');
  }, [onError]);

  const handleWebViewLoadStart = useCallback(() => {
    setIsLoading(true);
  }, []);

  const handleWebViewLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Loading...' : "Verify I'm human"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Security Verification</Text>
          </View>

          <View style={styles.webViewContainer}>
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading verification...</Text>
              </View>
            )}

            <WebView
              ref={webViewRef}
              source={{ html: generateHTML() }}
              style={styles.webView}
              onMessage={handleWebViewMessage}
              onError={handleWebViewError}
              onLoadStart={handleWebViewLoadStart}
              onLoadEnd={handleWebViewLoadEnd}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              mixedContentMode="compatibility"
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              onShouldStartLoadWithRequest={() => true}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#F8F8F8',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
});

export default ReCaptchaComponent;
