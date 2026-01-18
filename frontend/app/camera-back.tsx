import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import type { CameraCapturedPicture } from 'expo-camera';
import { API_BASE, toWsUrl } from '@/constants/env';
import { ThemedText } from '@/components/themed-text';

export default function CameraBackScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [summaryText, setSummaryText] = useState<string>('');

  useEffect(() => {
    if (!permission || !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Start backend CV session on mount; cleanup on unmount
  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const res = await fetch(`${API_BASE}/cv/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(`start session failed: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        const sid: string = data.session_id;
        setSessionId(sid);

        // Subscribe to websocket summaries
        const wsUrl = toWsUrl(`${API_BASE}/cv/summary/ws/${sid}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onmessage = (evt) => {
          // Optionally handle summaries here (log for now)
          try {
            const msg = JSON.parse(evt.data as any);
            if (msg?.type === 'summary') {
              if (typeof msg.text === 'string') {
                setSummaryText(msg.text);
              }
            }
          } catch {}
        };
        ws.onerror = () => {};

        // Begin capture loop every 3s once permission is granted
        if (!intervalRef.current) {
          intervalRef.current = setInterval(captureAndSend, 3000);
        }
      } catch (e) {
        if (__DEV__) console.warn(e);
      }
    }

    start();
    return () => {
      cancelled = true;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
      if (sessionId) {
        fetch(`${API_BASE}/cv/session/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const captureAndSend = async () => {
    try {
      if (!permission?.granted) return;
      if (!camRef.current || !sessionId) return;
      // Take a low-quality JPEG, no need for base64 when we can use file URI
      const pic: CameraCapturedPicture = (await (camRef.current as any).takePictureAsync?.({
        quality: 0.2,
        skipProcessing: true,
        base64: false,
      })) as any;
      if (!pic?.uri) return;

      const form = new FormData();
      form.append('session_id', sessionId);
      // RN requires this shape for file fields
      form.append('frames', {
        uri: pic.uri,
        name: `frame.jpg`,
        type: 'image/jpeg',
      } as any);

      await fetch(`${API_BASE}/cv/frames`, {
        method: 'POST',
        body: form,
        // Note: Don't set Content-Type for FormData; let fetch set it with boundary
      });
    } catch (e) {
      if (__DEV__) console.warn('capture/send failed', e);
    }
  };

  return (
    <>
      {/* Use the default Stack header so the native back button is shown */}
      <Stack.Screen options={{ title: '' }} />
      <View style={styles.container}>
        {/* Mount the camera without showing the feed */}
        <CameraView
          facing="front"
          style={styles.hiddenCamera}
          ref={(r) => { camRef.current = r; }}
          // Keep minimal processing
          enableTorch={false}
        />
        {/* Visible summary text */}
        <View style={styles.summaryContainer}>
          <ThemedText type="subtitle" style={styles.summaryLabel}>Scene summary</ThemedText>
          <ThemedText style={styles.summaryText}>
            {summaryText || 'Waiting for description...'}
          </ThemedText>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  // Rendered but invisible; still initializes camera session
  hiddenCamera: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    left: -1000,
    top: -1000,
  },
  summaryContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  summaryLabel: {
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 18,
    lineHeight: 26,
  },
});
