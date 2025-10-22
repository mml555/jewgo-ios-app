import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { authorize, AuthorizeResult, refresh, revoke } from 'react-native-app-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

type GoogleSignInNativeProps = {
  onSuccess?: (result: AuthorizeResult & { userInfo?: unknown }) => void;
  onError?: (error: unknown) => void;
  redirectScheme?: string; // e.g. "com.jewgoappfinal"
  buttonTitle?: string;
  autoRefreshOnMount?: boolean;
};

type StoredTokens = Pick<AuthorizeResult, 'accessToken' | 'accessTokenExpirationDate' | 'refreshToken' | 'idToken' | 'tokenType' | 'scopes'>;

const STORAGE_KEY = 'auth.google.tokens:v1';

export default function GoogleSignInNative({
  onSuccess,
  onError,
  redirectScheme,
  buttonTitle = 'Sign in with Google',
  autoRefreshOnMount = true,
}: GoogleSignInNativeProps) {
  const [isLoading, setIsLoading] = useState(false);

  const webClientId = Config.GOOGLE_WEB_CLIENT_ID;
  const scheme = redirectScheme || Config.APP_URL_SCHEME || 'com.jewgoappfinal';
  const redirectUrl = `${scheme}:/oauth2redirect`;

  const serviceConfiguration = useMemo(
    () => ({
      authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenEndpoint: 'https://oauth2.googleapis.com/token',
      revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
    }),
    []
  );

  const persistTokens = useCallback(async (t: StoredTokens | null) => {
    if (!t) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  }, []);

  const loadTokens = useCallback(async (): Promise<StoredTokens | null> => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as StoredTokens) : null;
    } catch {
      return null;
    }
  }, []);

  const fetchUserInfo = useCallback(async (accessToken?: string) => {
    if (!accessToken) return undefined;
    try {
      const res = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return undefined;
      return await res.json();
    } catch {
      return undefined;
    }
  }, []);

  const onPress = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await authorize({
        issuer: 'https://accounts.google.com',
        clientId: webClientId,
        redirectUrl,
        scopes: ['openid', 'profile', 'email'],
        serviceConfiguration,
        additionalParameters: {
          // Recommended by Google for mobile apps
          prompt: 'consent',
          access_type: 'offline',
        },
      });
      const userInfo = await fetchUserInfo(result.accessToken);
      await persistTokens({
        accessToken: result.accessToken,
        accessTokenExpirationDate: result.accessTokenExpirationDate,
        refreshToken: result.refreshToken,
        idToken: result.idToken,
        tokenType: result.tokenType,
        scopes: result.scopes,
      });
      onSuccess?.({ ...result, userInfo });
    } catch (e) {
      onError?.(e);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError, redirectUrl, serviceConfiguration, fetchUserInfo, persistTokens, webClientId]);

  const onRefresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await loadTokens();
      if (!stored?.refreshToken) throw new Error('No refresh token');
      const refreshed = await refresh(
        {
          issuer: 'https://accounts.google.com',
          clientId: webClientId,
          redirectUrl,
          serviceConfiguration,
        },
        { refreshToken: stored.refreshToken }
      );
      const merged: StoredTokens = {
        accessToken: refreshed.accessToken || stored.accessToken,
        accessTokenExpirationDate: refreshed.accessTokenExpirationDate || stored.accessTokenExpirationDate,
        refreshToken: refreshed.refreshToken || stored.refreshToken,
        idToken: refreshed.idToken || stored.idToken,
        tokenType: refreshed.tokenType || stored.tokenType,
        scopes: refreshed.scopes || stored.scopes,
      };
      await persistTokens(merged);
      const userInfo = await fetchUserInfo(merged.accessToken);
      onSuccess?.({ ...refreshed, ...merged, userInfo } as AuthorizeResult & { userInfo?: unknown });
    } catch (e) {
      onError?.(e);
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserInfo, loadTokens, onError, onSuccess, persistTokens, redirectUrl, serviceConfiguration, webClientId]);

  const onSignOut = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await loadTokens();
      if (stored?.accessToken) {
        try {
          await revoke({
            issuer: 'https://accounts.google.com',
            clientId: webClientId,
            redirectUrl,
            serviceConfiguration,
          }, {
            tokenToRevoke: stored.accessToken,
            sendClientId: true,
          });
        } catch (_){ /* ignore */ }
      }
      if (stored?.refreshToken) {
        try {
          await revoke({
            issuer: 'https://accounts.google.com',
            clientId: webClientId,
            redirectUrl,
            serviceConfiguration,
          }, {
            tokenToRevoke: stored.refreshToken,
            includeBasicAuth: false,
            sendClientId: true,
          });
        } catch (_){ /* ignore */ }
      }
      await persistTokens(null);
      Alert.alert('Signed out');
    } finally {
      setIsLoading(false);
    }
  }, [loadTokens, persistTokens, redirectUrl, serviceConfiguration, webClientId]);

  useEffect(() => {
    if (!autoRefreshOnMount) return;
    (async () => {
      try {
        const stored = await loadTokens();
        if (!stored) return;
        // If token close to expiry (< 2 min), refresh
        const exp = stored.accessTokenExpirationDate ? Date.parse(stored.accessTokenExpirationDate) : 0;
        const needs = !exp || exp - Date.now() < 120_000;
        if (needs) {
          await onRefresh();
        } else {
          const userInfo = await fetchUserInfo(stored.accessToken);
          onSuccess?.({ ...(stored as unknown as AuthorizeResult), userInfo });
        }
      } catch (e) {
        // Silent on mount
      }
    })();
  }, [autoRefreshOnMount, fetchUserInfo, loadTokens, onRefresh, onSuccess]);

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <>
          <Button title={buttonTitle} onPress={onPress} />
          <View style={{ height: 8 }} />
          <Button title="Refresh token" onPress={onRefresh} />
          <View style={{ height: 8 }} />
          <Button title="Sign out" color="#b00020" onPress={onSignOut} />
        </>
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


