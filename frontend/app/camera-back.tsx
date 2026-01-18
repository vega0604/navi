import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { CameraCapturedPicture } from 'expo-camera';
import { API_BASE, toWsUrl } from '@/constants/env';
import { ThemedText } from '@/components/themed-text';

export default function CameraBackScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const camRef = useRef<CameraView | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [summaryText, setSummaryText] = useState<string>('Waiting for description...');
  const [cameraReady, setCameraReady] = useState(false);

  const [preflightStatus, setPreflightStatus] = useState<number | null>(null);
  const [startStatus, setStartStatus] = useState<number | null>(null);
  const [lastUploadStatus, setLastUploadStatus] = useState<number | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [lastCaptureErr, setLastCaptureErr] = useState<string | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Start CV session + WebSocket
  useEffect(() => {
    let cancelled = false;

    async function startSession() {
      try {
        console.log('[camera-back] API_BASE =', API_BASE);

        const pre = await fetch(`${API_BASE}/`);
        setPreflightStatus(pre.status);
        if (!pre.ok) throw new Error('Preflight failed');

        const res = await fetch(`${API_BASE}/cv/session/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });

        setStartStatus(res.status);
        if (!res.ok) {
          throw new Error(`Session start failed (${res.status})`);
        }

        const data = await res.json();
        if (cancelled) return;

        const sid = data.session_id;
        setSessionId(sid);

        // --- WebSocket (PINNED TO REF) ---
        const wsUrl = toWsUrl(`${API_BASE}/cv/summary/ws/${sid}`);
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log('[camera-back] WS connected');
        };

        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(evt.data);
            if (msg?.type === 'summary' && typeof msg.text === 'string') {
              setSummaryText(msg.text);
            }
          } catch {}
        };

        ws.onerror = (e) => {
          console.warn('[camera-back] WS error', e);
        };

        ws.onclose = () => {
          console.warn('[camera-back] WS closed');
        };
      } catch (e: any) {
        setStartError(e?.message || String(e));
        console.warn('[camera-back] start error', e);
      }
    }

    startSession();

    return () => {
      cancelled = true;

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {}
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

  // Start capture loop AFTER camera is truly ready
  useEffect(() => {
    if (sessionId && cameraReady && !intervalRef.current) {
      setTimeout(() => {
        intervalRef.current = setInterval(captureAndSend, 3000);
      }, 500); // camera warm-up
    }

    return () => {
      if (intervalRef.current && (!sessionId || !cameraReady)) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sessionId, cameraReady]);

  const captureAndSend = async () => {
    try {
      if (!permission?.granted || !camRef.current || !sessionId) return;

      console.log('[camera-back] capturing photo');

      const takePhoto = (camRef.current as any)?.takePhotoAsync;
      if (!takePhoto) return;

      const pic: CameraCapturedPicture = await takePhoto({
        quality: 0.2,
        skipProcessing: true,
        base64: false,
      });

      if (!pic?.uri) return;

      const form = new FormData();
      form.append('session_id', sessionId);
      form.append('frames', {
        uri: pic.uri,
        name: 'frame.jpg',
        type: 'image/jpeg',
      } as any);

      const resp = await fetch(`${API_BASE}/cv/frames`, {
        method: 'POST',
        body: form,
      });

      setLastUploadStatus(resp.status);
    } catch (e: any) {
      console.warn('[camera-back] capture/send failed', e);
      setLastCaptureErr(e?.message || String(e));
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: '' }} />
      <View style={styles.container}>
        <CameraView
          style={styles.preview}
          ref={(r) => (camRef.current = r)}
          active
          mode="picture"
          onCameraReady={() => setCameraReady(true)}
          onMountError={(e) => console.warn('[camera-back] camera error', e)}
        />

        <View style={styles.summaryContainer}>
          <ThemedText type="subtitle">Scene summary</ThemedText>
          <ThemedText style={styles.summaryText}>{summaryText}</ThemedText>

          <ThemedText style={styles.debug}>API: {API_BASE}</ThemedText>
          <ThemedText style={styles.debug}>Preflight: {preflightStatus ?? '-'}</ThemedText>
          <ThemedText style={styles.debug}>Start: {startStatus ?? '-'}</ThemedText>
          <ThemedText style={styles.debug}>Camera ready: {String(cameraReady)}</ThemedText>
          <ThemedText style={styles.debug}>Last upload: {lastUploadStatus ?? '-'}</ThemedText>

          {startError && <ThemedText style={styles.debug}>Err: {startError}</ThemedText>}
          {lastCaptureErr && <ThemedText style={styles.debug}>CaptureErr: {lastCaptureErr}</ThemedText>}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  preview: { flex: 1 },
  summaryContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: 12,
    borderRadius: 12,
  },
  summaryText: {
    fontSize: 18,
    lineHeight: 26,
    marginTop: 6,
  },
  debug: {
    fontSize: 12,
    marginTop: 4,
  },
});
