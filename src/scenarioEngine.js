
// === Step Helpers ===
export const move = (target, to, duration, label, easing, native = true) => Object.freeze({
  type: "move", target, to, duration, ...(label ? { label } : {}), ...(easing ? { easing } : {}), native
});

export const delay = (duration, label) => Object.freeze({
  type: "delay", duration, ...(label ? { label } : {})
});

export const parallel = (targets, label) => Object.freeze({
  type: "parallel", targets, ...(label ? { label } : {})
});

export const vibrate = (label) => Object.freeze({
  type: "vibrate", ...(label ? { label } : {})
});

export const callback = (name, label) => Object.freeze({
  type: "callback", name, ...(label ? { label } : {})
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


// === Scenario Wrapper ===
export const defineScenario = (steps) => {
  if (!Array.isArray(steps)) throw new Error("defineScenario() requires an array");
  return Object.freeze(steps);
};


// === Load from String with Sandboxing ===
export const loadScenarioFromString = (code) => {
  const fn = new Function(
    "defineScenario", "move", "delay", "callback", "vibrate", "parallel", "hold", "label", "comment", "use", "goto"
      `return ${code};`
  );

  const result = fn(
    Object.freeze(defineScenario),
    Object.freeze(move),
    Object.freeze(delay),
    Object.freeze(callback),
    Object.freeze(vibrate),
    Object.freeze(parallel),
    Object.freeze(hold),
    Object.freeze(label),
    Object.freeze(comment),
    Object.freeze(use),
    Object.freeze(goto)
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
      })));
    }
    return scenario;
  } catch (e) {
    if(verbose) console.error("❌ Scenario parsing failed:", e.message);
    return null;
  }
};
