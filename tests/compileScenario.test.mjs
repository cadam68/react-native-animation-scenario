import { compileScenario } from "../src/compileScenario.js";
import { label, comment, move, defineScenario, use, delay, goto } from "../src/scenarioEngine.js";
import * as assert from "node:assert";

/* run :
npm test
npm test -- -t "step1.2"
*/

test("step1.1 - compileScenario returns correct labels and step order", () => {
  const scenario = [
    label("start"),
    comment("fade in"),
    move("opacity", 1, 500),
    label("end"),
  ];

  const { steps, labels } = compileScenario(scenario);

  expect(labels).toEqual({ start: 0, end: 3 });
  expect(steps).toHaveLength(4);
  expect(steps[2]).toEqual({
    type: "move",
    target: "opacity",
    to: 1,
    duration: 500,
    native: true,
  });
});


test("step1.2 - throws error for duplicate labels", () => {
  const scenario = defineScenario([
    label("start"),
    move("opacity", 1, 500),
    label("start"), // duplicate!
  ]);

  expect(() => compileScenario(scenario)).toThrow("Duplicate label 'start'");
});


test("step1.2 - throws error for label without string name", () => {
  const scenario = defineScenario([
    label("valid"),
    { type: "label", label: 123 }, // not a string
  ]);

  expect(() => compileScenario(scenario)).toThrow("Label must have a string name");
});


test("step1.2 - includes comment steps in the output", () => {
  const scenario = defineScenario([
    label("start"),
    comment("this is a test"),
    move("opacity", 1, 500),
  ]);

  const { steps } = compileScenario(scenario);
  expect(steps[1]).toEqual(expect.objectContaining({ type: "comment", comment: "this is a test" }));
});


test("step1.2 - throws error if step is not an object", () => {
  const scenario = defineScenario([
    "this is not a valid step",
  ]);

  expect(() => compileScenario(scenario)).toThrow("Invalid step in scenario");
});

test("step2.1 - expands use('glow') block into main scenario", () => {
  const blocks = {
    glow: defineScenario([
      delay(200, "glowDelay"),
      move("glowOpacity", 1, 300, "glowFadeIn"),
    ]),
  };

  const scenario = defineScenario([
    label("start"),
    use("glow"),
    move("opacity", 1, 500, "mainMove"),
  ]);

  const { steps, labels } = compileScenario(scenario, { blocks });

  expect(steps).toHaveLength(4);

  expect(steps[0]).toEqual(expect.objectContaining({ type: "label", label: "start" }));
  expect(steps[1]).toEqual(expect.objectContaining({ type: "delay", duration: 200, label: "glowDelay", __sourceBlock: "glow" }));
  expect(steps[2]).toEqual(expect.objectContaining({ type: "move", target: "glowOpacity", __sourceBlock: "glow" }));
  expect(steps[3]).toEqual(expect.objectContaining({ type: "move", target: "opacity", label: "mainMove" }));

  expect(labels).toEqual({ start: 0 });
});

test("step2.2 - throws error when using undefined block", () => {
  const scenario = defineScenario([
    label("start"),
    use("glow"), // not defined
    move("opacity", 1, 300),
  ]);

  expect(() => compileScenario(scenario)).toThrow("Block 'glow' not found");
});


test("step2.2 - can reuse same block multiple times", () => {
  const blocks = {
    pulse: defineScenario([
      move("scale", 1.2, 100),
      move("scale", 1.0, 100),
    ]),
  };

  const scenario = defineScenario([
    use("pulse"),
    use("pulse"),
  ]);

  const { steps } = compileScenario(scenario, { blocks });

  expect(steps).toHaveLength(4);
  expect(steps[0]).toEqual(expect.objectContaining({ target: "scale", to: 1.2 }));
  expect(steps[2]).toEqual(expect.objectContaining({ target: "scale", to: 1.2 }));
});

/*
Goal: Prevent a block from defining a label that already exists in the main scenario
We only allow top-level labels to go into labels, but we must still check that no block adds a label that conflicts.
 */
test("step2.3 - throws error if a block contains a label already defined in the main scenario", () => {
  const blocks = {
    glow: defineScenario([
      label("start"), // same as in main
      move("opacity", 1, 300),
    ]),
  };

  const scenario = defineScenario([
    label("start"),
    use("glow"),
    move("opacity", 0, 300),
  ]);

  expect(() => compileScenario(scenario, { blocks }))
    .toThrow("Duplicate label 'start'");
});

test("step2.4 - compileScenario flattens blocks and preserves labels", () => {

  const blocks = {
    moveBlock: defineScenario([
      label("insideBlock"),
      move("x", 100, 500),
    ]),
  };

  const scenario = defineScenario([
    label("start"),
    use("moveBlock"),
    label("end"),
  ]);

  const { steps, labels } = compileScenario(scenario, { blocks });

  // console.log(steps);
  // console.log(labels);

  // Assert label positions
  assert.deepEqual(labels, {
    start: 0,
    end: 3,
  });

  // Assert that "insideBlock" label inside the block is not registered globally
  assert.strictEqual(labels.insideBlock, undefined);

  // However, the step list should still contain the labeled step
  const labelStep = steps.find(s => s.label === "insideBlock");
  assert.ok(labelStep, "Label insideBlock should exist in steps");
  assert.strictEqual(labelStep.type, "label");

  // Ensure that the step following the label is the move
  const labelIndex = steps.indexOf(labelStep);
  const nextStep = steps[labelIndex + 1];
  assert.strictEqual(nextStep.type, "move");
  assert.strictEqual(nextStep.target, "x");
});


test("step3.0 - goto jumps to labeled step", () => {
  const scenario = defineScenario([
    label("start"),
    move("x", 1, 100),
    goto("start"),
  ]);

  const { steps, labels } = compileScenario(scenario);
  // console.log(steps);
  expect(labels.start).toBe(0);
  expect(steps[2]).toEqual({ type: "goto", label: "start" });
});

