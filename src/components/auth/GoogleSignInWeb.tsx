import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, View, ActivityIndicator, StyleSheet } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Config from 'react-native-config';

WebBrowser.maybeCompleteAuthSession();

type GoogleSignInWebProps = {
  onSuccess?: (result: { idToken?: string; accessToken?: string; refreshToken?: string; userInfo?: unknown }) => void;
  onError?: (error: unknown) => void;
  redirectScheme?: string; // e.g. "com.yourapp"
  buttonTitle?: string;
};

const GOOGLE_DISCOVERY = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export default function GoogleSignInWeb({
  onSuccess,
  onError,
  redirectScheme,
  buttonTitle = 'Sign in with Google',
}: GoogleSignInWebProps) {
  const [isLoading, setIsLoading] = useState(false);

  const webClientId = Config.GOOGLE_WEB_CLIENT_ID;
  const scheme = redirectScheme || Config.APP_URL_SCHEME || 'com.jewgoappfinal';

  const redirectUri = useMemo(
    () =>
      AuthSession.makeRedirectUri({
        scheme,
        // native: com.jewgoappfinal:/oauth2redirect
        // Ensure this scheme is registered in iOS Info.plist URL Types and Android intent-filter
        path: 'oauth2redirect',
      }),
    [scheme]
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: webClientId,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      scopes: ['openid', 'profile', 'email'],
    },
    GOOGLE_DISCOVERY
  );

  const exchangeCodeAsync = useCallback(
    async (authCode: string) => {
      if (!request) return;
      setIsLoading(true);
      try {
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: webClientId,
            code: authCode,
            extraParams: {
              code_verifier: request.codeVerifier || '',
              redirect_uri: redirectUri,
            },
          },
          { tokenEndpoint: GOOGLE_DISCOVERY.tokenEndpoint }
        );

        let userInfo: any;
        try {
          const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { Authorization: `Bearer ${tokenResult.accessToken}` },
          });
          userInfo = await res.json();
        } catch (_) {
          userInfo = undefined;
        }

        onSuccess?.({
          idToken: tokenResult.idToken as string | undefined,
          accessToken: tokenResult.accessToken as string | undefined,
          refreshToken: tokenResult.refreshToken as string | undefined,
          userInfo,
        });
      } catch (err) {
        onError?.(err);
      } finally {
        setIsLoading(false);
      }
    },
    [onSuccess, onError, redirectUri, request, webClientId]
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const code = (response.params as any)?.code as string | undefined;
      if (code) exchangeCodeAsync(code);
    }
  }, [response, exchangeCodeAsync]);

  const onPress = useCallback(() => {
    if (!request) return;
    promptAsync({ useProxy: false, showInRecents: true }).catch(onError);
  }, [promptAsync, request, onError]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <Button title={buttonTitle} onPress={onPress} disabled={!request} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});


