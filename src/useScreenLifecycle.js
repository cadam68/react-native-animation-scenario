import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

/**
 * Runs `onFocus` when the screen is focused, and `onBlur` when unfocused.
 * Usage :
 *   useScreenLifecycle(
 *     useCallback(() => {}, []),
 *     useCallback(() => { stop() }, [])
 *   );
 *
 *   import { useScreenLifecycle } from 'react-native-animation-scenario/useScreenLifecycle';
 */
export const useScreenLifecycle = (onFocus = () => {}, onBlur = () => {}) => {
  useFocusEffect(
    useCallback(() => {
      onFocus?.();
      return () => {
        onBlur?.();
      };
    }, [onFocus, onBlur])
  );
};

