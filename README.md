# 🎬 react-native-animation-scenario

A lightweight, declarative animation hook for React Native that lets you create smooth, timed animation sequences using a human-readable scenario format.

Designed for onboarding flows, cinematic transitions, UI tutorials, or any place where animation tells a story.

---

## ✨ Features

- ✅ Declarative animation timeline with step-by-step control
- 🧠 Supports `move`, `delay`, `parallel`, `callback`, `vibrate`, and `hold` steps
- 🎛 Works in both `"auto"` and `"manual"` step modes
- 🔁 Loopable scenarios
- 📦 Minimal dependencies – just React Native + Animated
- 🧩 Drop-in `TimelineView` for debug or dev overlay
- 🔐 Safe callback and ref validation

---

## 📦 Installation

```
npm install react-native-animation-scenario
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
| ---------- | -------------------------------------------- |
| `move`     | Animate a ref value to a target              |
| `delay`    | Pause for a given duration                   |
| `parallel` | Animate multiple values simultaneously       |
| `callback` | Run external logic (sync or async)           |
| `vibrate`  | Trigger haptic feedback                      |
| `hold`     | Pause animation until `nextStep()` is called |

---

## 🧠 Modes
- mode: "auto" – steps play sequentially
- mode: "manual" – steps only run via nextStep()
- loop: true – repeat the scenario forever

---

## 🧪 Timeline Debug
Add the TimelineView to display step progress:

```
<TimelineView />
```
Great for development or visual debugging of onboarding flows.

---

## 🛡 Safeguards
- 🚫 Throws error if an initialValue or callback is missing
- 🔒 All animations use Animated.Value and native drivers by default

---

## 📄 License
MIT

---

## 🤝 Contributing
- PRs welcome! Especially for:
- TypeScript types
- New step types (e.g. spring)
- Helper tooling
