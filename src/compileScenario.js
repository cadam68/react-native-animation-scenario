
export const compileScenario = (scenario, { blocks = {}, callbacks = {}, initialValues = {} } = {}, throughErrors = true) => {
  const steps = [];
  const labels = {};
  const labelSet = new Set();
  const validationErrors = [];

  function flatten(input, sourceBlock = null) {
    for (const step of input) {
      if (!step || typeof step !== "object") {
        validationErrors.push(`Invalid step in scenario : ${JSON.stringify(step)}`);
        continue;
      }

      if (step.type === "use") {
        const block = blocks?.[step.block];
        if (!block) {
          validationErrors.push(`Block '${step.block}' not found`);
          continue;
        }
        flatten(block, step.block); // recurse
        continue;
      }

      if (step.type === "label") {
        if (!step.label || typeof step.label !== "string") {
          validationErrors.push(`Label must have a string name: ${JSON.stringify(step)}`);
          continue;
        }
        if (labelSet.has(step.label)) {
          validationErrors.push(`Duplicate label '${step.label}'`);
          continue;
        }
        labelSet.add(step.label);
        if (sourceBlock === null) {
          labels[step.label] = steps.length;
        }
      }

      if (step.type === "ifJump") {
        if (typeof step.condition !== "function" && typeof step.condition !== "string" ) {
          validationErrors.push(`ifJump must include a valid condition function.`);
        }
        if (!step.labelTrue || typeof step.labelTrue !== "string") {
          validationErrors.push(`ifJump requires a valid labelTrue.`);
        }
        if (step.labelFalse && typeof step.labelFalse !== "string") {
          validationErrors.push(`ifJump: labelFalse must be a string if provided.`);
        }
      }

      const annotated = sourceBlock ? { ...step, __sourceBlock: sourceBlock } : step;
      steps.push(annotated);
    }
  }

  flatten(scenario);

  // Validate refs and callbacks
  const seenRefs = new Set(Object.keys(initialValues));
  const seenCallbacks = new Set(Object.keys(callbacks));

  for (const step of steps) {
    const targets = step.target
      ? [step.target]
      : Array.isArray(step.targets)
        ? step.targets.map(t => t.target)
        : [];

    targets.forEach(t => {
      if (!seenRefs.has(t)) {
        validationErrors.push(`Missing initial value for target: ${t}`);
      }
    });

    if (step.type === "callback" && !seenCallbacks.has(step.name)) {
      validationErrors.push(`Missing callback function: ${step.name}`);
    }
  }

  // validate existing label used by goto and ifJump
  const seenLabels = new Set(Object.keys(labels));
  steps.filter(step => step.type === "goto" || step.type === "ifJump").forEach(step => {
    if(step.type === "goto" && !seenLabels.has(step.label)) validationErrors.push(`Missing label : ${step.label}`);
    if(step.type === "ifJump" && !seenLabels.has(step.labelTrue)) validationErrors.push(`Missing label : ${step.labelTrue}`);
    if(step.type === "ifJump" && step.labelFalse && !seenLabels.has(step.labelFalse)) validationErrors.push(`Missing label : ${step.labelFalse}`);
  });

  // validation for ifThen / else / endIf
  const stack = [];

  steps.forEach((step, i) => {
    if (step.type === "ifThen") {
      stack.push({ type: "ifThen", index: i });
    } else if (step.type === "ifElse") {
      if (stack.length === 0 || stack[stack.length - 1].type !== "ifThen") {
        validationErrors.push(`"ifElse" at step ${i} has no matching "ifThen"`);
      } else if (stack[stack.length - 1].hasElse) {
        validationErrors.push(`"ifElse" at step ${i} already defined for this block`);
      } else {
        stack[stack.length - 1].hasElse = true;
      }
    } else if (step.type === "ifEnd") {
      if (stack.length === 0 || stack[stack.length - 1].type !== "ifThen") {
        validationErrors.push(`"ifEnd" at step ${i} has no matching "ifThen"`);
      } else {
        stack.pop();
      }
    }
  });
  if (stack.length > 0) {
    stack.forEach(entry => validationErrors.push(`Unclosed "ifThen" at step ${entry.index}`));
  }

  // Error management
  if(throughErrors && validationErrors.length) {
    const messages = [...new Set(validationErrors)].map(e => `• ${e}`).join("\n");
    throw new Error(`Scenario validation failed:\n${messages}`);
  }

  return { steps, labels, validationErrors };
};
