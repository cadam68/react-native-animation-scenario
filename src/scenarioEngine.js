
// === Step Helpers ===

/*
move("x", 100, 500);                         // Absolute
move("x", inc(50), 500);                     // Relative forward
move("x", dec(30), 300);                     // Relative backward
move("x", 200, 500, "slideBack");            // With label
move("x", 150, 400, null, { easing: Easing.inOut(Easing.quad), native: false }); // Advanced
 */
/**
 * Create a step that animates `target` to `to` over `duration` milliseconds.
 *
 * @param {string} target - Animated value to update.
 * @param {number|Object} to - Target value or relative instruction.
 * @param {number} duration - Animation duration in ms.
 * @param {string} [label]
 * @param {{easing?: Function, native?: boolean}} [options]
 */
export const move = (target, to, duration, label = undefined, options = {}) =>  Object.freeze({
  type: "move",
  target,
  to,
  duration,
  ...(label ? { label } : {}),
  ...(options.easing ? { easing: options.easing } : {}),
  ...(options.native !== undefined ? { native: options.native } : {}),
});

/** Relative increment helper */
export const inc = (value) => Object.freeze({ type: "inc", value });
/** Relative decrement helper */
export const dec = (value) => Object.freeze({ type: "dec", value: value });

/** Pause the scenario for a duration. */
export const delay = (duration, label) => Object.freeze({
  type: "delay", duration, ...(label ? { label } : {})
});

/** Run several move steps in parallel. */
export const parallel = (targets, label) => Object.freeze({
  type: "parallel", targets, ...(label ? { label } : {})
});

/** Trigger a vibration / haptic feedback. */
export const vibrate = (label) => Object.freeze({
  type: "vibrate", ...(label ? { label } : {})
});

/** Invoke a named callback. */
export const callback = (name, value, label) => Object.freeze({
  type: "callback", name, ...(value !== undefined ? { value } : {}), ...(label ? { label } : {})
});

/** Pause until `nextStep()` is called. */
export const hold = (label) => Object.freeze({
  type: "hold", ...(label ? { label } : {})
});

/** Define a label used by `goto` or conditional steps. */
export const label = (label) => Object.freeze({
  type: "label", ...(label ? { label } : {})
});

/** Add a comment step, useful for debugging. */
export const comment = (comment) => Object.freeze({
  type: "comment", ...(comment ? { comment } : {})
});

/** Insert a named block of steps. */
export const use = (block) => Object.freeze({
  type: "use", block
});

/** Jump to a previously defined label. */
export const goto = (label) => Object.freeze({
  type: "goto", ...(label ? { label } : {})
});

/** Set an animated value immediately. */
export const set = (target, value) => Object.freeze({
  type: "set", target, value
});

/** Continue execution after a `goto` call. */
export const resume = () => Object.freeze({
  type: "resume"
});

/** Stop the scenario and reset state. */
export const stop = () => Object.freeze({
  type: "stop"
});

/** Conditionally jump to one of two labels. */
export const ifJump = (condition, labelTrue, labelFalse) => Object.freeze({
  type: "ifJump", condition, labelTrue, ...(labelFalse ? { labelFalse } : {})
});

/** Begin a conditional block. */
export const ifThen = (condition) => Object.freeze({
  type: "ifThen", condition
});

/** Else block for `ifThen`. */
export const ifElse = () => Object.freeze({
  type: "ifElse"
});

/** End a conditional block started with `ifThen`. */
export const ifEnd = () => Object.freeze({
  type: "ifEnd"
});
// === Scenario Wrapper ===
/**
 * Freeze and return a scenario array. Use this when defining blocks or main
 * scenarios to ensure immutability.
 */
export const defineScenario = (steps) => {
  if (!Array.isArray(steps)) throw new Error("defineScenario() requires an array");
  return Object.freeze(steps);
};


// === Load from String with Sandboxing ===
/**
 * Safely evaluate a scenario defined as a string. Only the step helper
 * functions are exposed to the sandboxed function.
 */
export const loadScenarioFromString = (code) => {
  const fn = new Function(
    "defineScenario", "move", "delay", "callback", "vibrate", "parallel", "hold", "label", "comment", "use", "goto", "set", "resume", "stop", "ifJump", "inc", "dec", "ifThen", "ifElse", "ifEnd"
      `return ${code};`
  );

  const result = fn(
    Object.freeze(defineScenario),
    Object.freeze(move),
    Object.freeze(inc),
    Object.freeze(dec),
    Object.freeze(delay),
    Object.freeze(callback),
    Object.freeze(vibrate),
    Object.freeze(parallel),
    Object.freeze(hold),
    Object.freeze(label),
    Object.freeze(comment),
    Object.freeze(use),
    Object.freeze(goto),
    Object.freeze(set),
    Object.freeze(resume),
    Object.freeze(stop),
    Object.freeze(ifJump),
    Object.freeze(ifThen),
    Object.freeze(ifElse),
    Object.freeze(ifEnd)
  );

  if (!Array.isArray(result)) throw new Error("Scenario must be an array");

  return Object.freeze(result);
};


// === Dev Playground Helper (logs the parsed scenario) ===
/**
 * Helper used in development to parse and log a scenario string.
 * Returns the parsed scenario or `null` if parsing fails.
 */
export const playScenario = (rawCode, verbose = false) => {
  try {
    const scenario = loadScenarioFromString(rawCode);
    if(verbose) {
      console.log("✅ Scenario loaded successfully:");
      console.table(scenario.map(s => ({
        type: s.type,
        label: s.label || "",
        target: s.target || s.targets?.map(t => t.target).join(",") || "",
        to: s.to ?? "",
        name: s.name || "",
        value: s.value || "",
      })));
    }
    return scenario;
  } catch (e) {
    if(verbose) console.error("❌ Scenario parsing failed:", e.message);
    return null;
  }
};
