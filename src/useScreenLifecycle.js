import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

/**
 * Runs `onFocus` when the screen is focused and `onBlur` when unfocused.
 *
 * @param {Function} [onFocus] - Function executed when the screen gains focus.
 * @param {Function} [onBlur] - Function executed when the screen loses focus.
 *
 * Usage:
 * ```js
 * useScreenLifecycle(
 *   useCallback(() => {}, []),
 *   useCallback(() => stop(), [])
 * );
 * ```
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

