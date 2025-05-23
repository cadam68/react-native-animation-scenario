import { useRef, useState, useCallback } from "react";
import { Animated, View, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";

export const useAnimationScenario = ({
                                       scenario,
                                       initialValues,
                                       callbacks = {},
                                       loop = false,
                                       vibrationMode = "once",
                                       mode = "auto", // "auto" or "manual"
                                     }) => {
  if (!initialValues) {
    throw new Error(`[useAnimationScenario] Missing required "initialValues" parameter.`);
  }

  // 🔍 Validate that all targets in the scenario have an initial value
  const missingRefs = [];
  const missingCallbacks = [];

  scenario.forEach(step => {
    const targets = step.target
      ? [step.target]
      : Array.isArray(step.targets)
        ? step.targets.map(t => t.target)
        : [];

    targets.forEach(t => {
      if (!initialValues.hasOwnProperty(t)) {
        missingRefs.push(t);
      }
    });

    if (step.type === "callback" && !callbacks.hasOwnProperty(step.name) && !missingCallbacks.includes(step.name)) missingCallbacks.push(step.name);
  });

  if (missingRefs.length || missingCallbacks.length) {
    const messages = [];
    if (missingRefs.length) messages.push(`Missing initial values for targets: ${missingRefs.join(", ")}`);
    if (missingCallbacks.length) messages.push(`Missing callback functions: ${missingCallbacks.join(", ")}`);
    throw new Error(`[useAnimationScenario] ${messages.join(" | ")}`);
  }
  // ✅ Create refs from initialValues
  const animatedRefs = useRef(
    Object.fromEntries(
      Object.entries(initialValues).map(([key, val]) => [key, new Animated.Value(val)])
    )
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const stepIndexRef = useRef(0);
  const vibrationTriggered = useRef(false);
  const holdResolver = useRef(null);

  const stepLabels = scenario.map((s, i) => s.label || s.name || `${s.type}-${i}`);

  const runStep = useCallback(async (step, index) => {
    setCurrentStepIndex(index);

    switch (step.type) {
      case "move":
      case "timing":
        await new Promise(res =>
          Animated.timing(animatedRefs.current[step.target], {
            toValue: step.to,
            duration: step.duration,
            useNativeDriver: step.native !== false,
            easing: step.easing,
          }).start(() => res())
        );
        break;

      case "parallel":
        await new Promise(res =>
          Animated.parallel(
            step.targets.map(t =>
              Animated.timing(animatedRefs.current[t.target], {
                toValue: t.to,
                duration: t.duration,
                useNativeDriver: t.native !== false,
                easing: step.easing,
              })
            )
          ).start(() => res())
        );
        break;

      case "delay":
        await new Promise(res => setTimeout(res, step.duration));
        break;

      case "vibrate":
        if (
          (vibrationMode === "once" && !vibrationTriggered.current) ||
          vibrationMode === "always"
        ) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (vibrationMode === "once") vibrationTriggered.current = true;
        }
        break;

      case "callback":
        // Sync functions (like () => setShowText(true)) to work fast
        // Async functions (like () => await doSomething()) to pause animation until completion
        const fn = callbacks[step.name];
        if (fn) {
          const result = fn();  // might return a promise
          if (result instanceof Promise) {
            await result; // wait only if it's async
          }
        } else {
          console.warn(`[useAnimationScenario] Callback "${step.name}" not found.`);
        }
        break;

      case "hold":
        await new Promise(resolve => {
          holdResolver.current = resolve;  // store it to resume later
        });
        break;

      default:
        console.warn(`[useAnimationScenario] Unknown step type "${step.type}"`);
    }
  }, [scenario]);

  const runAuto = useCallback(async () => {
    vibrationTriggered.current = false;
    const run = async () => {
      for (let i = 0; i < scenario.length; i++) {
        await runStep(scenario[i], i);
      }
    };

    if (loop) {
      while (true) await run();
    } else {
      await run();
    }
  }, [scenario]);

  const start = () => {
    if (mode !== "manual") runAuto();
  };

  const stop = () => {
    // Not used currently — can be enhanced for cancelable animations
  };

  const reset = () => {
    stepIndexRef.current = 0;
    vibrationTriggered.current = false;
    setCurrentStepIndex(-1);
    holdResolver.current = undefined;

    // 🧼 Reset each animated value to its initial state
    Object.entries(initialValues).forEach(([key, val]) => {
      const animatedValue = animatedRefs.current[key];
      if (animatedValue) {
        animatedValue.setValue(val);
      }
    });
  };

  const nextStep = async () => {
    // If paused on hold, resume it
    if (holdResolver.current) {
      const resume = holdResolver.current;
      holdResolver.current = null;
      resume(); // triggers continuation
      return;
    }

    const step = scenario[stepIndexRef.current];
    if (!step) return;
    await runStep(step, stepIndexRef.current);
    stepIndexRef.current++;
    if (stepIndexRef.current >= scenario.length) stepIndexRef.current = 0;
  };

  const TimelineView = () => (
    <View style={styles.timeline}>
      {stepLabels.map((label, index) => (
        <Text
          key={index}
          style={[
            styles.timelineLabel,
            index === currentStepIndex && styles.timelineLabelActive,
          ]}
        >
          {label}
        </Text>
      ))}
    </View>
  );

  return {
    refs: animatedRefs.current,
    start,
    stop,
    reset,
    nextStep,
    TimelineView,
  };
};

const styles = StyleSheet.create({
  timeline: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 12,
  },
  timelineLabel: {
    marginHorizontal: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: "#eee",
    fontSize: 12,
    color: "#888",
  },
  timelineLabelActive: {
    backgroundColor: "#ffd700",
    color: "#000",
    fontWeight: "bold",
  },
});
