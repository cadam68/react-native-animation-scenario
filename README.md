# 🎬 react-native-animation-scenario

A lightweight, declarative animation timeline hook for React Native — perfect for scenarios like onboarding, tutorials, interactive demos, and more. Easily control complex UI animations step-by-step or automatically.

Works with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev).

---

## ✨ Features

- ✅ Declarative animation timeline with step-by-step control
- 🧠 Supports `set`, `move`, `delay`, `parallel`, `callback`, `vibrate`, `hold`, `label`, `goto`, `resume`, `use`, `ifJump`, `ifThen` and `use` steps
- 🎛 Works in both `"auto"` and `"manual"` step modes
- 🔁 Loopable scenarios
- 📦 Minimal dependencies – just React Native + Animated
- 🧩 Drop-in `TimelineView` for debug or dev overlay
- 🔐 Safe callback and ref validation

---

## ⚡ Try it live

[Snack demo on Expo](https://snack.expo.dev/@cadam68/animation-demo)

---

## 🔥 What's New in 1.4.1 `Patch Release`

- 🛠 Fixed an issue where the `stop() step didn’t always correctly interrupt the scenario execution.
- ✅ Improved overall code structure and performance with internal refactoring.

## 🔥 What's New in 1.4.0

- ✅ `ifThen`, `ifElse`, `ifEnd`: New block-style conditional logic, familiar to developers. Example:
```
ifThen(() => score.current > 5),
  move("x", 100, 500),
ifElse(),
  move("x", -100, 500),
ifEnd()
```
- ✅ Nested conditionals are supported and validated at compile time.
- ✅ Improved compiler validation to detect malformed blocks or unclosed conditionals.
- ✅ Relative values in `move()` using helper functions like `inc(value)` or `dec(value)`. Example:
```
move("x", inc(50), 500)
```
- ✅ Arguments in `callback()` steps now supported.
- ✅ Jump to label in `nextStep(label)`: You can resume or redirect flow from UI or interaction code.

## 🔥 What's New in 1.3.0

- ✅ `resume` step: jump back to the point after the last `goto()` call
- ✅ `set` step: set a value directly or from a function
- ✅ `stop` step: stop and reset the animation
- ✅ `ifJump(condition, labelTrue, labelFalse?)` step: jump based on condition
- 🛡 Label validation for `goto` and `ifJump` steps now included in scenario compilation
- ⚙️ Cleaned and centralized all validation logic in `compileScenario()`

## 🔥 What's New in 1.2.0

- ✅ `goto("label")` step: jump to a specific label in your scenario
- ✅ `label("name")` step: define named labels
- ✅ Nested reusable blocks with `use("blockName")`
- ✅ Full `reset()` and `stop()` logic
- ✅ `TimelineView` for visual debug
- ✅ `useScreenLifecycle(onFocus, onBlur)` helper

---

## 📦 Installation

```
npm install react-native-animation-scenario
```
---

## 📦 Exports
```
useAnimationScenario();             // Main hook
defineScenario([]);                 // Safely define your scenario
move(), delay(), callback(), ...    // Step helpers
useScreenLifecycle();               // Hook for screen focus lifecycle
```

---

## 🛠 Usage

```js
import {
  useAnimationScenario,
  defineScenario,
  move,
  delay,
  parallel,
  callback,
  hold,
} from "react-native-animation-scenario";

const scenario = defineScenario([
  move("opacity", 1, 500),
  delay(300),
  parallel([
    move("scale", 1.1, 500),
    move("translateY", 50, 500),
  ]),
  hold("waitForTap"),
  callback("onFinish"),
]);

const MyComponent = () => {
  const {
    refs,
    start,
    reset,
    nextStep,
    TimelineView,
  } = useAnimationScenario({
    scenario,
    initialValues: {
      opacity: 0,
      scale: 1,
      translateY: 0,
    },
    callbacks: {
      onFinish: () => console.log("Done!"),
    },
  });

  useEffect(() => { start(); }, []);

  return (
    <Animated.View style={{
      opacity: refs.opacity,
      transform: [
        { scale: refs.scale },
        { translateY: refs.translateY }
      ]
    }}>
      <Text>Hello Animation</Text>
      <TimelineView />
    </Animated.View>
  );
};
```

---

## 🔧 Step Types

| Type       | Description                                  | Version | 
|------------|----------------------------------------------|---------|
| `move`     | Animate a ref value to a target              | 1.0     |
| `delay`    | Pause for a given duration                   | 1.0     |
| `parallel` | Animate multiple `values` simultaneously     | 1.0     |
| `callback` | Run external logic (sync or async)           | 1.0     |
| `vibrate`  | Trigger haptic feedback                      | 1.0     |
| `hold`     | Pause animation until `nextStep()` is called | 1.0     |
| `label`    | Mark jump targets                            | 1.2     |
| `goto`     | Jump to a label                              | 1.2     |
| `use`      | Insert a block                               | 1.2     |
| `set`      | Set a value directly or from a function      | 1.3     |
| `stop`     | Stop and reset the animation                 | 1.3     |
| `resume`   | Continue from the point after last `goto()`  | 1.3     |
| `ifJump`   | Conditionally jump to a label                | 1.3     |
| `ifThen`   | Block-style conditional logic                | 1.4     |

---

## 🧠 Modes
- mode: "auto" – steps play sequentially
- mode: "manual" – steps only run via nextStep()
- loop: true – repeat the scenario forever

---

## 🧩 Reusable Blocks

```js
const blocks = {
bounce: defineScenario([
move("y", -30, 200),
move("y", 0, 200),
]),
};

const scenario = defineScenario([
callback("showStart"),
use("bounce"),
delay(500),
use("bounce"),
]);
```

---

## 🤖 Conditional Branching with `ifJump()`

Use `ifJump()` to dynamically choose the next step at runtime.

```js
const MyComponent = () => {
  const directionRef = useRef(1);

  const scenario = defineScenario([
    hold(), // Wait for user input before branching
    ifJump(() => directionRef.current === 1, "moveRight", "moveLeft"),
    label("moveRight"),
    move("x", 200, 500),
    goto("resumePoint"),
    label("moveLeft"),
    move("x", 0, 500),
    label("resumePoint"),
  ]);

  const { refs, start, nextStep } = useAnimationScenario({
    scenario,
    initialValues: { x: 100 },
  });

  useEffect(() => { start(); }, []);

  return (
    <View>
      <Animated.View
        style={{
          width: 50,
          height: 50,
          backgroundColor: "blue",
          transform: [{ translateX: refs.x }],
          marginBottom: 20,
        }}
      />
      <Text>Choose Direction:</Text>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button title="Left" onPress={() => {
          directionRef.current = 0;
          nextStep();
        }} />
        <Button title="Right" onPress={() => {
          directionRef.current = 1;
          nextStep();
        }} />
      </View>
    </View>
  );
};
```

## 🔁 `ifJump()` using a named callback
You can define reusable branching logic in `callbacks`:

```js
const scenario = defineScenario([
  hold(),
  ifJump("checkDirection", "goRight", "goLeft"),
  label("goRight"),
  move("x", 100, 300),
  goto("end"),
  label("goLeft"),
  move("x", -100, 300),
  label("end"),
]);

const { refs, nextStep, start } = useAnimationScenario({
  scenario,
  initialValues: { x: 0 },
  callbacks: {
    checkDirection: () => Math.random() > 0.5,
  },
});
```

---

## 🧪 Advanced Flow Example: `set`, `goto`, `resume`, and `stop`

This scenario demonstrates how to use the new set, goto, resume, and stop steps for conditional or non-linear animation flows.

```js
import { useAnimationScenario,defineScenario, label, vibrate, move, goto, stop, set, resume } from "react-native-animation-scenario";

const scenario = defineScenario([
  label("start"),
  vibrate(),
  move("x", 100, 2000),
  goto("reverse"),                          // Jump to reverse path
  move("x", 200, 500, "after-resume"),      // Will resume here after `resume`
  stop(),                                   // Stops the flow here
  label("reverse"),
  set("x", 0),                              // Instantly reset position
  move("x", -100, 500),
  resume(),   
]);

const MyComponent = () => {
  const {refs,start,TimelineView,} = useAnimationScenario({
    scenario,
    initialValues: { x: 0, direction: 0 },
    callbacks: {
      checkDirection: () => {
        // Example: dynamically decide to reverse
        if (Math.random() > 0.5) return goto("reverse");
      },
    },
  });

  return (
    <Animated.View style={{ transform: [{ translateX: refs.x }] }} >
      <Button title="Start" onPress={start} />
      <TimelineView />
    </Animated.View>
  );
};
```

---

## 🧪 Timeline Debug
Add the TimelineView to display step progress:

```js
<TimelineView /> <!-- Optional -->
```
Great for development or visual debugging of onboarding flows.

---

## 🛡 Safeguards
- 🚫 Throws error if an initialValue or callback is missing
- 🔒 All animations use Animated.Value and native drivers by default

---

## 🧩 Optional: Screen Lifecycle Hook

This helper hook requires `@react-navigation/native` and should be imported separately:

```js
import { useScreenLifecycle } from 'react-native-animation-scenario/src/useScreenLifecycle';
``` 

It allows you to trigger logic when the screen gains or loses focus.

---

## 📄 License
MIT – Created by Cyril Adam

---

## 📦 CHANGELOG for `v1.4.2` and `v1.4.1`

### 🔧 Fixes
- Fixed a bug where the `stop()` step didn't correctly interrupt scenario execution in all cases.
- Improved internal handling of the `shouldStop` flag to prevent race conditions and ensure proper reset behavior.
- `reset()` now explicitly clears `holdResolver` and `callingStepIndexRef`, making the scenario restart more predictable and clean.
- Minor log improvements under debug mode.

### 💡 Internal Improvements
- Factored out reusable logic into `evalStepValue()` and `evalStepCondition()` to unify async/sync step evaluation across `set`, `ifThen`, and `callback` steps.
- Jump logic now centralized via `jumpTo()` utility, ensuring consistent block traversal across `ifThen`, `ifElse`, and `ifEnd`.
- Internal state handling made more robust for future scalability and debugging ease.
- Scenario validation (`compileScenario`) now checks `parallel` content blocks.


## 📜 CHANGELOG for `v1.4.0`

### ✨ Added
- `ifThen(condition)`, `ifElse()`, `ifEnd()` block structure: familiar conditional logic using nested blocks.
- `nextStep(label)`: allows you to jump to a specific label manually, even after a `hold()` step.
- `move(...)` now supports relative values using `inc(x)` and `dec(x)`.
- Extended support for `callback()` to accept parameters, including dynamic values.
- Scenario validation (`compileScenario`) now checks for properly closed `ifThen/ifElse/ifEnd` blocks.
- Modular refactoring for better extensibility.

### 🐞 Fixed
- Ensured `ifJump()` does not rely on refs directly from `defineScenario()`.
- Improved safety and label resolution for nested conditional logic.
- Fixed corner cases in `hold()` + jump logic for `nextStep()`.

### 🧪 Testing
- Jest tests added for malformed conditional structures (`ifThen` without `ifEnd`, duplicate `ifElse`, etc.)
- Unit tests extended to cover relative moves.

## 📜 CHANGELOG for `v1.3.1`

### 🐞 Fixed
- Move useScreenLifecycle to a separate export to avoid dependency issues on Snack


## 📜 CHANGELOG for `v1.3.0`

### ✨ Added

- `set(target, value)`: set a ref value directly, from a function, or from an async callback
- `stop()`: terminates the current animation sequence cleanly
- `resume()`: continues execution from the step after the last `goto()` jump
- `ifJump(condition, labelTrue, labelFalse?)`: conditional branching based on a sync or async function or a callback name
- Scenario validation now checks label existence for `goto` and `ifJump`
- Improved label jump tracking with `callingStepIndexRef` for `resume()

### 🐞 Fixed
- Ensured `nextStep()` respects the `shouldStop` flag
- Cleaned up validation logic (moved to `compileScenario`)
- Deduplicated validation errors for clearer debug output

### 🧪 Testing
- New unit test coverage for scenario compilation including nested `use() blocks and label resolution.
- Some validation moved from runtime to compile-time, simplifying runtime hook logic.


## 📜 CHANGELOG for `v1.2.0`

### ✨ Added

- `goto("label")` step to jump within the scenario
- `label("name")` step to declare jump targets
- Support for `use("blockName")` reusable block structure
- `__sourceBlock` annotation for debugging block origins
- Visual timeline label display (`TimelineView`)
- Full `reset()` support restores animated values
- `stop()` now halts looping scenarios safely
- `useScreenLifecycle(onFocus, onBlur)` hook

### 🐞 Fixed

- Scenario would continue running after screen unmount (fixed with `shouldStop`)
- `reset()` didn't clear active animation state properly
- Label detection and step validation improved

### 🧪 Testing

- Added Jest tests and modular `compileScenario` system
- Internal compilation now flattens nested `use()` blocks

---

## 🤝 Contributing
- PRs welcome! Especially for:
- TypeScript types
- New step types (e.g. spring)
- Helper tooling
