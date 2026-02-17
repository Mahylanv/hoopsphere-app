import React from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export type ToastOptions = {
  title?: string;
  message: string;
  durationMs?: number;
};

type ToastState = {
  id: number;
  title?: string;
  message: string;
  durationMs: number;
};

type ToastContextValue = {
  showToast: (options: ToastOptions) => void;
};

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = React.useState<ToastState | null>(null);
  const queueRef = React.useRef<ToastState[]>([]);
  const anim = React.useRef(new Animated.Value(0)).current;
  const hideTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = React.useRef(0);

  const hideToast = React.useCallback(() => {
    Animated.timing(anim, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      setToast(null);
      const next = queueRef.current.shift();
      if (next) {
        setToast(next);
        Animated.timing(anim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          hideTimer.current = setTimeout(
            hideToast,
            next.durationMs
          );
        });
      }
    });
  }, [anim]);

  const showToast = React.useCallback(
    (options: ToastOptions) => {
      const next: ToastState = {
        id: ++idRef.current,
        title: options.title,
        message: options.message,
        durationMs: options.durationMs ?? 3500,
      };

      if (toast) {
        queueRef.current.push(next);
        return;
      }

      setToast(next);
      Animated.timing(anim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        hideTimer.current = setTimeout(hideToast, next.durationMs);
      });
    },
    [anim, hideToast, toast]
  );

  React.useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {toast && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.toast,
              {
                paddingTop: insets.top + 12,
                opacity: anim,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.card}>
              {toast.title ? (
                <Text style={styles.title}>{toast.title}</Text>
              ) : null}
              <Text style={styles.message}>{toast.message}</Text>
            </View>
          </Animated.View>
        )}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  card: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 220,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  title: {
    color: "#F97316",
    fontWeight: "700",
    marginBottom: 4,
  },
  message: {
    color: "#E5E7EB",
    fontSize: 14,
  },
});
