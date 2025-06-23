# The Finger

JavaScript library for detecting touch gestures on HTML elements.

**Supported gesturs:**
- tap
- double tap
- press
- long press
- flick / swipe
- drag
- pinch & spread
- rotate
- pan
- two finger tap
- double tap & drag

## Installation

```bash
npm install the-finger
```

## Usage

### ES Module
```javascript
import { TheFinger } from 'the-finger';

const element = document.getElementById('target');
const finger = new TheFinger(element);

finger.track('tap', (gesture) => {
  console.log('Tapped at:', gesture.x, gesture.y);
});
```

### Browser
```html
<script src="https://unpkg.com/the-finger/dist/thefinger.min.js"></script>
<script>
  const finger = new TheFinger(element);
</script>
```

## Gesture Names for `.track()` Method

- `tap`
- `double-tap`  
- `press`
- `long-press`
- `drag` (includes `flick` property when speed > 0.75)
- `pan`
- `rotate`
- `pinch-spread`
- `two-finger-tap`
- `double-tap-and-drag`

## API

### Constructor
```javascript
new TheFinger(element, settings)
```

**Parameters:**
- `element` - HTML element to track
- `settings` (optional)
  - `preventDefault: true` - Prevent default touch behavior
  - `visualize: true` - Show touch points (requires visualizer.js)

### Methods

#### track(gesture, callback, settings)
Start tracking a gesture.

```javascript
finger.track('drag', (gesture, touchHistory) => {
  console.log(gesture.x, gesture.y);
}, {
  preventDefault: 'horizontal' // 'vertical', true, or false
});
```

#### untrack(gesture)
Stop tracking a gesture.

```javascript
finger.untrack('drag');
```

#### on(element) / off(element)
Manually attach/detach touch listeners.

## Gesture Data

Each gesture callback receives:
1. `gesture` - Object with gesture-specific data (coordinates, distance, angle, etc.)
2. `touchHistory` - Map of touch point histories

### Common properties:
- `x`, `y` - Current position
- `startX`, `startY` - Starting position  
- `type` - Gesture type

### Gesture-specific properties:
- **drag/pan**: `distance`, `angle`, `direction`, `speed`, `flick`
- **rotate**: `rotation`, `angleAbsolute`, `angleRelative`
- **pinch-spread**: `scale`, `distance`

### Build Outputs
- `dist/thefinger.es.js` - ES module
- `dist/thefinger.umd.js` - UMD module
- `dist/thefinger.min.js` - Minified IIFE for browsers

## License

ISC