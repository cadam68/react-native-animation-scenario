import {useRef, useState, useCallback, useEffect} from "react";
import { Animated, View, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { compileScenario } from "./compileScenario.js";
import { TimelineView as Timeline } from "./TimelineView";

const debug = false;

export const useAnimationScenario = ({
                                       scenario,
                                       initialValues,
                                       blocks = {},
                                       callbacks = {},
                                       loop = false,
                                       vibrationMode = "once",
                                       mode = "auto", // "auto" or "manual"
                                     }) => {
  if (!initialValues) {
    throw new Error(`[useAnimationScenario] Missing required "initialValues" parameter.`);
  }

  // Compile once
  const { steps, labels } = compileScenario(scenario, {
    blocks,
    initialValues,
    callbacks,
  });

  useEffect(() => {
    if(debug) {
      console.log("----")
      console.log("*** scenario ***\n" + JSON.stringify(scenario));
      console.log("*** raw scenario\n" + JSON.stringify(steps));
      console.log("----")
    }
  }, [debug]);

  // ✅ Create refs from initialValues
  const animatedRefs = useRef(
    Object.fromEntries(
      Object.entries(initialValues).map(([key, val]) => [key, new Animated.Value(val)])
    )
  );

  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const stepIndexRef = useRef(0);
  const callingStepIndexRef = useRef();
  const vibrationTriggered = useRef(false);
  const holdResolver = useRef(null);
  const shouldStop = useRef(false);

  const stepLabels = steps.map((s, i) => s.label || s.name || `${s.type}-${i}`);

  const evalStepValue = async (stepValue) => {
    let result = undefined;
    let fn;

    if (typeof stepValue === "string" && callbacks[stepValue]) fn = callbacks[stepValue];
    if (!fn && typeof stepValue === "function") fn = stepValue;
    if (fn) {
      result = fn();
      if (result instanceof Promise) result = await result;
    } else result = stepValue;
    return result;
  }

  const evalStepCondition = async (stepCondition) => {
    let result = undefined;
    const fn = typeof stepCondition === "string" ? callbacks[stepCondition] : stepCondition;
    if (fn && typeof fn === "function") {
      result = fn();
      if (result instanceof Promise) result = await result;
    } else {
      console.warn(`[useAnimationScenario] Missing condition function "${stepCondition}"`);
    }
    return result;
  }

  const jumpTo = (steps, startIndex, startType, endTypes,) => {
    let depth = 0;
    for (let i = startIndex + 1; i < steps.length; i++) {
      const s = steps[i];
      if (s.type === startType) depth++;
      else if (s.type === endTypes.slice(-1)[0] && depth > 0) depth--;
      else if (endTypes.includes(s.type) && depth === 0) {
        return i + 1;
      }
    }
    return steps.length; // fallback: jump to end if not found
  };

  const runStep = useCallback(async (step, index) => {
    setCurrentStepIndex(index);

    switch (step.type) {
      case "move":
      case "timing": {
        let toValue = await evalStepValue(step.to);
        if (typeof toValue === "object" && toValue.type === "inc") toValue = animatedRefs.current[step.target].__getValue() + toValue.value;
        if (typeof toValue === "object" && toValue.type === "dec") toValue = animatedRefs.current[step.target].__getValue() - toValue.value;
        await new Promise(res =>
          Animated.timing(animatedRefs.current[step.target], {
            toValue,
            duration: step.duration,
            useNativeDriver: step.native !== false,
            easing: step.easing,
          }).start(() => res())
        );
        break;
      }

      case "parallel": {
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
      }

      case "delay": {
        let duration = await evalStepValue(step.duration);
        await new Promise(res => setTimeout(res, duration));
        break;
      }

      case "vibrate": {
        if (
          (vibrationMode === "once" && !vibrationTriggered.current) ||
          vibrationMode === "always"
        ) {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          if (vibrationMode === "once") vibrationTriggered.current = true;
        }
        break;
      }

      case "callback": {
        // Sync functions (like () => setShowText(true)) to work fast
        // Async functions (like () => await doSomething()) to pause animation until completion
        const fn = callbacks[step.name];
        if (fn) {
          const result = step.hasOwnProperty("value") ? fn(step.value) : fn();  // might return a promise
          if (result instanceof Promise) await result; // wait only if it's async
        } else console.warn(`[useAnimationScenario] Callback "${step.name}" not found.`);
        break;
      }

      case "hold": {
        await new Promise(resolve => {
          holdResolver.current = resolve;  // store it to resume later
        });
        break;
      }

      // note:  goto() only jump to global labels
      case "goto": {
        const targetLabel = step.label;
        const targetIndex = labels[targetLabel];

        if (targetIndex === undefined) throw new Error(`[useAnimationScenario] Label '${targetLabel}' not found`);
        callingStepIndexRef.current = index;
        stepIndexRef.current = targetIndex;

        if (debug) console.log(`goto step# ${targetIndex}`);
        return "jumped";
      }

      case "label":
        break;

      case "set": {
        let stepValue = await evalStepValue(step.value);
        const ref = animatedRefs.current[step.target];
        if (!ref) throw new Error(`Unknown ref: ${step.target}`);
        ref.setValue(stepValue);
        break;
      }

      case "resume": {
        if (callingStepIndexRef.current !== undefined && callingStepIndexRef.current !== null) {
          const targetIndex = callingStepIndexRef.current;
          callingStepIndexRef.current = undefined;
          stepIndexRef.current = targetIndex;

          if (debug) console.log(`resume to step# ${targetIndex}`);
          return "jumped";
        } else {
          console.warn(`[useAnimationScenario] resume() called without previous goto()`);
        }
        break;
      }

      case "stop": {
        shouldStop.current = true;
        if (debug) console.log("🛑 Scenario stopped by 'stop' step");
        break;
      }

      case "ifJump": {
        const result = await evalStepCondition(step.condition);
        if (result !== undefined) {
          const targetLabel = result ? step.labelTrue : step.labelFalse;
          if (targetLabel) {
            const targetIndex = labels[targetLabel];
            if (targetIndex === undefined) throw new Error(`[useAnimationScenario] Label '${targetLabel}' not found`);
            stepIndexRef.current = targetIndex;
            return "jumped";
          }
        }
        break;
      }

      case "ifThen": {
        const result = await evalStepCondition(step.condition);
        if (result !== undefined && !result) {
          stepIndexRef.current = jumpTo(steps, index, "ifThen", ["ifElse", "ifEnd"]);
          return "jumped";
        }
        break;
      }

      case "ifElse": {
        stepIndexRef.current = jumpTo(steps, index, "ifThen", ["ifEnd"]);
        return "jumped";
      }

      case "ifEnd":
        break;

      default:
        console.warn(`[useAnimationScenario] Unknown step type "${step.type}"`);
    }
  }, [steps]);

  const runAuto = useCallback(async () => {

    const run = async () => {
      vibrationTriggered.current = false;
      stepIndexRef.current = 0;
      callingStepIndexRef.current = undefined;

      while (stepIndexRef.current < steps.length && !shouldStop.current) {
        const currentIndex = stepIndexRef.current;
        const result = await runStep(steps[currentIndex], currentIndex);
        if (shouldStop.current) break;
        if (result === "jumped") continue;
        stepIndexRef.current++;
      }
    };

    shouldStop.current = false;
    if (loop) while (!shouldStop.current) await run();
    else await run();
  }, [steps]);

  const start = useCallback(() => {
    if (mode !== "manual") runAuto();
  }, [mode, runAuto]);

  const stop = useCallback(() => {
    reset();
    if(debug) console.log('stop()')
    shouldStop.current = true;
  }, []);

  const reset = useCallback(() => {
    if(debug) console.log('reset()')
    stepIndexRef.current = 0;
    callingStepIndexRef.current = undefined;
    vibrationTriggered.current = false;
    setCurrentStepIndex(-1);
    holdResolver.current = undefined;
    shouldStop.current = false;

    // 🧼 Reset each animated value to its initial state
    Object.entries(initialValues).forEach(([key, val]) => {
      const animatedValue = animatedRefs.current[key];
      if (animatedValue) {
        animatedValue.setValue(val);
      }
    });
  }, []);

  const nextStep = useCallback(async (targetLabel = undefined) => {

    // Jump to the provided target
    if(typeof targetLabel === "string" && targetLabel !== undefined) {
      const targetIndex = labels[targetLabel];
      if (targetIndex === undefined) throw new Error(`[useAnimationScenario] Label '${targetLabel}' not found`);
      stepIndexRef.current = targetIndex;
    }

    // If paused on hold, resume it
    if (holdResolver.current) {
      const resume = holdResolver.current;
      holdResolver.current = null;
      resume(); // triggers continuation
      return;
    }

    const step = steps[stepIndexRef.current];
    if (!step) return;
    if (shouldStop.current) return;
    await runStep(step, stepIndexRef.current);
    stepIndexRef.current++;
    if (stepIndexRef.current >= steps.length) stepIndexRef.current = 0;
  }, [steps]);

  return {
    refs: animatedRefs.current,
    start,
    stop,
    reset,
    nextStep,
    TimelineView: () => <Timeline stepLabels={stepLabels} currentStepIndex={currentStepIndex} />
  };

};
