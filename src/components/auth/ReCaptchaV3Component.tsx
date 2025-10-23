import React, { useRef, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';
import { debugLog, errorLog } from '../../utils/logger';

interface ReCaptchaV3ComponentProps {
  siteKey: string;
  action?: string;
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  testMode?: boolean;
  autoExecute?: boolean;
}

interface WebViewMessage {
  type: string;
  data: any;
}

const ReCaptchaV3Component: React.FC<ReCaptchaV3ComponentProps> = ({
  siteKey,
  action = 'submit',
  onVerify,
  onError,
  testMode = false,
  autoExecute = true,
}) => {
  const webViewRef = useRef<WebView>(null);

  useEffect(() => {
    if (autoExecute) {
      // Trigger execution after component mounts
      setTimeout(() => {
        executeRecaptcha();
      }, 500);
    }
  }, [autoExecute]);

  const executeRecaptcha = useCallback(() => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (typeof executeRecaptcha === 'function') {
          executeRecaptcha();
        }
        true;
      `);
    }
  }, []);

  const handleWebViewMessage = useCallback(
    (event: any) => {
      try {
        const message: WebViewMessage = JSON.parse(event.nativeEvent.data);

        switch (message.type) {
          case 'recaptcha-verify':
            debugLog('✅ reCAPTCHA v3 token received');
            onVerify(message.data.token);
            break;

          case 'recaptcha-error':
            errorLog('❌ reCAPTCHA v3 error:', message.data.error);
            onError?.(message.data.error);
            break;

          case 'recaptcha-ready':
            debugLog('✅ reCAPTCHA v3 ready');
            break;

          default:
            debugLog('Unknown message type:', message.type);
        }
      } catch (error) {
        errorLog('Error parsing WebView message:', error);
      }
    },
    [onVerify, onError],
  );

  const generateHTML = useCallback(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>reCAPTCHA v3</title>
          <style>
            body {
              margin: 0;
              padding: 0;
              width: 1px;
              height: 1px;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          <script src="https://www.google.com/recaptcha/api.js?render=${siteKey}"></script>
          <script>
            function sendMessage(type, data) {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: type,
                  data: data
                }));
              }
            }
            
            function executeRecaptcha() {
              try {
                if (${testMode}) {
                  // Test mode - return fake token
                  setTimeout(() => {
                    sendMessage('recaptcha-verify', { 
                      token: 'test-token-v3-' + Date.now() 
                    });
                  }, 500);
                  return;
                }
                
                if (typeof grecaptcha === 'undefined') {
                  sendMessage('recaptcha-error', { 
                    error: 'reCAPTCHA not loaded' 
                  });
                  return;
                }
                
                grecaptcha.ready(function() {
                  grecaptcha.execute('${siteKey}', { action: '${action}' })
                    .then(function(token) {
                      sendMessage('recaptcha-verify', { token: token });
                    })
                    .catch(function(error) {
                      sendMessage('recaptcha-error', { 
                        error: error.message || 'Verification failed' 
                      });
                    });
                });
              } catch (error) {
                sendMessage('recaptcha-error', { 
                  error: error.message || 'Unknown error' 
                });
              }
            }
            
            // Make executeRecaptcha available globally
            window.executeRecaptcha = executeRecaptcha;
            
            // Notify that reCAPTCHA is ready
            if (${testMode}) {
              sendMessage('recaptcha-ready', {});
            } else {
              grecaptcha.ready(function() {
                sendMessage('recaptcha-ready', {});
              });
            }
          </script>
        </body>
      </html>
    `;
  }, [siteKey, action, testMode]);

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: generateHTML() }}
        style={styles.webView}
        onMessage={handleWebViewMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        mixedContentMode="compatibility"
        onShouldStartLoadWithRequest={() => true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 1,
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    opacity: 0,
  },
  webView: {
    width: 1,
    height: 1,
  },
});

export default ReCaptchaV3Component;
