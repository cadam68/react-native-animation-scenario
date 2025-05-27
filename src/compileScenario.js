
export function compileScenario(scenario, { blocks = {} } = {}) {
  if (!Array.isArray(scenario)) {
    throw new Error("Scenario must be an array");
  }

  const steps = [];
  const labels = {};
  const labelSet = new Set();

  // Internal recursive function to flatten scenario + blocks
  function flatten(input, sourceBlock = null) {
    for (const step of input) {
      if (!step || typeof step !== "object") {
        throw new Error("Invalid step in scenario");
      }

      // Expand use("blockName")
      if (step.type === "use") {
        const blockName = step.block;
        const block = blocks?.[blockName];

        if (!block) {
          throw new Error(`[compileScenario] Block '${blockName}' not found`);
        }

        flatten(block, blockName); // recurse with block name
        continue;
      }

      if (step.type === "label") {
        const labelName = step.label;
        if (!labelName || typeof labelName !== "string") {
          throw new Error(`Label must have a string name`);
        }
        if (labelSet.has(labelName)) {
          throw new Error(`Duplicate label '${labelName}' found`);
        }
        labelSet.add(labelName);

        // Only register top-level labels into the returned labels object
        if (sourceBlock === null) {
          labels[labelName] = steps.length;
        }
      }

      // Clone step and attach __sourceBlock if coming from a block
      const annotated = sourceBlock
        ? { ...step, __sourceBlock: sourceBlock }
        : step;

      steps.push(annotated);
    }
  }

  flatten(scenario);

  return {
    steps,
    labels,
  };
}
