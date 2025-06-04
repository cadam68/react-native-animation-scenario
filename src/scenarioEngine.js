
// === Step Helpers ===

/*
move("x", 100, 500);                         // Absolute
move("x", inc(50), 500);                     // Relative forward
move("x", dec(30), 300);                     // Relative backward
move("x", 200, 500, "slideBack");            // With label
move("x", 150, 400, null, { easing: Easing.inOut(Easing.quad), native: false }); // Advanced
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

export const inc = (value) => Object.freeze({ type: "inc", value });
export const dec = (value) => Object.freeze({ type: "dec", value: value });

export const delay = (duration, label) => Object.freeze({
  type: "delay", duration, ...(label ? { label } : {})
});

export const parallel = (targets, label) => Object.freeze({
  type: "parallel", targets, ...(label ? { label } : {})
});

export const vibrate = (label) => Object.freeze({
  type: "vibrate", ...(label ? { label } : {})
});

export const callback = (name, value, label) => Object.freeze({
  type: "callback", name, ...(value !== undefined ? { value } : {}), ...(label ? { label } : {})
});

export const hold = (label) => Object.freeze({
  type: "hold", ...(label ? { label } : {})
});

export const label = (label) => Object.freeze({
  type: "label", ...(label ? { label } : {})
});

export const comment = (comment) => Object.freeze({
  type: "comment", ...(comment ? { comment } : {})
});

export const use = (block) => Object.freeze({
  type: "use", block
});

export const goto = (label) => Object.freeze({
  type: "goto", ...(label ? { label } : {})
});

export const set = (target, value) => Object.freeze({
  type: "set", target, value
});

export const resume = () => Object.freeze({
  type: "resume"
});

export const stop = () => Object.freeze({
  type: "stop"
});

export const ifJump = (condition, labelTrue, labelFalse) => Object.freeze({
  type: "ifJump", condition, labelTrue, ...(labelFalse ? { labelFalse } : {})
});

export const ifThen = (condition) => Object.freeze({
  type: "ifThen", condition
});

export const ifElse = () => Object.freeze({
  type: "ifElse"
});

export const ifEnd = () => Object.freeze({
  type: "ifEnd"
});
// === Scenario Wrapper ===
export const defineScenario = (steps) => {
  if (!Array.isArray(steps)) throw new Error("defineScenario() requires an array");
  return Object.freeze(steps);
};


// === Load from String with Sandboxing ===
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
