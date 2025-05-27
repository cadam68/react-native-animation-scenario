# 🎬 react-native-animation-scenario

A lightweight, declarative animation timeline hook for React Native — perfect for scenarios like onboarding, tutorials, interactive demos, and more. Easily control complex UI animations step-by-step or automatically.

Works with [React Native](https://reactnative.dev/) and [Expo](https://expo.dev).

---

## ✨ Features

- ✅ Declarative animation timeline with step-by-step control
- 🧠 Supports `move`, `delay`, `parallel`, `callback`, `vibrate`, `hold`, `label`, `goto` and `use` steps
- 🎛 Works in both `"auto"` and `"manual"` step modes
- 🔁 Loopable scenarios
- 📦 Minimal dependencies – just React Native + Animated
- 🧩 Drop-in `TimelineView` for debug or dev overlay
- 🔐 Safe callback and ref validation

---

## ⚡ Try it live

[Snack demo on Expo](https://snack.expo.dev/@cadam68/animation-demo)

---

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
useAnimationScenario();      // Main hook
defineScenario([]);          // Safely define your scenario
move(), delay(), callback(); // Step helpers
useScreenLifecycle();        // Hook for screen focus lifecycle
```

---

## 🛠 Usage

```
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

| Type       | Description                                  |
|------------|----------------------------------------------|
| `move`     | Animate a ref value to a target              |
| `delay`    | Pause for a given duration                   |
| `parallel` | Animate multiple values simultaneously       |
| `callback` | Run external logic (sync or async)           |
| `vibrate`  | Trigger haptic feedback                      |
| `hold`     | Pause animation until `nextStep()` is called |
| `label`    | Mark jump targets                            |
| `goto`     | Jump to a label                              |
| `use`      | Insert a block                               |

---

## 🧠 Modes
- mode: "auto" – steps play sequentially
- mode: "manual" – steps only run via nextStep()
- loop: true – repeat the scenario forever

---

## 🧩 Reusable Blocks

```
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

## 🧪 Timeline Debug
Add the TimelineView to display step progress:

```
<TimelineView /> <!-- Optional -->
```
Great for development or visual debugging of onboarding flows.

---

## 🛡 Safeguards
- 🚫 Throws error if an initialValue or callback is missing
- 🔒 All animations use Animated.Value and native drivers by default

---

## 📄 License
MIT – Created by Cyril Adam

---

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
