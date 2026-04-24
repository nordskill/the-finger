# The Finger

JavaScript library for detecting touch gestures on HTML elements.

**Supported gestures:**
- tap
- double tap
- press
- long press
- drag
- pinch & spread
- rotate
- pan
- two finger tap
- double tap & drag

Fast `drag`, `pan`, and `double-tap-and-drag` gestures may include `flick: true` in the callback data.

## Installation

```bash
npm install the-finger
```

## Usage

### ES Module
```javascript
import TheFinger from 'the-finger';

const element = document.getElementById('target');
const finger = new TheFinger(element);

finger.track('tap', (gesture) => {
  console.log('Tapped at:', gesture.x, gesture.y);
});
```

### Browser IIFE Build
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
2. `touchHistory` - Map of touch point histories, except for `long-press`

The `gesture` object does not include a `type` property. Its shape depends on the tracked gesture.

### Gesture Properties:

**tap**, **double-tap**, **press**, **long-press**
- `x`
- `y`

**two-finger-tap**
- `x`
- `y`
- `touches`

**drag**
- `x`
- `y`
- `startX`
- `startY`
- `step`
- `speed`
- `angle`
- `initial_direction`
- Final callback adds properties: `endX`, `endY`, `final_direction`, `flick`

**pan**
- `touches`
- `x`
- `y`
- `startX`
- `startY`
- `step`
- `speed`
- `angle`
- `initial_direction`
- Final callback adds properties: `endX`, `endY`, `final_direction`, `flick`

**double-tap-and-drag**
- `x`
- `y`
- `startX`
- `startY`
- `dx`
- `dy`
- `dist`
- Final callback adds properties: `endX`, `endY`, `speed`, `final_direction`, `flick`

**rotate**
- `touches`
- `rotation`
- `angleAbsolute`
- `angleRelative`

**pinch-spread**
- `touches`
- `distance`
- `scale`
- Final callback adds properties: `end: true`

`press` emits immediately on touch start. `long-press` emits after about 350ms if the finger does not move.

### Package Files
- `./dist/thefinger.es.js` - ES module
- `./dist/thefinger.umd.js` - UMD module
- `./dist/thefinger.min.js` - Minified IIFE build for direct browser use
- Build output includes source map files for the generated JavaScript files

## Testing

This library includes development integration helpers that simulate natural finger movements using `index.html`, `dev/test.js`, and `dev/visualizer.js`.

### Running Tests

1. Install development dependencies:

   ```bash
   npm install
   ```

2. Start the browser integration tests:

   ```bash
   npm test
   ```

   This starts Vite, opens the demo page with `?test`, and runs the gesture simulations in the browser. Check DevTools Console for green PASS and red FAIL results.

### Manual Browser Test

1. Start the development server:

   ```bash
   npm start
   ```

   If startup fails with a missing package such as `vite-plugin-browser-sync`, run `npm install` again and retry `npm start`.

2. Open the page in your browser with the `?test` query parameter. Use the local URL printed by Vite, for example:

   http://localhost:5173/?test

3. Check the browser console for test results, which will log PASS or FAIL for each gesture along with detection details.

Tests run sequentially for all supported gestures.

### Creating Future Tests

Tests are implemented in `dev/test.js`. To add tests for new gestures or modify existing ones:

- Add the gesture name to the `gestures` array in `runIntegrationTests()`.
- Implement a new simulation function (e.g., `simulateNewGesture(cx, cy, target)`) that dispatches a sequence of `TouchEvent`s to mimic the gesture's natural finger movements.
- Add a case for the new gesture in the `simulateGesture()` switch statement to call your new function.

Simulations use programmatic `Touch` objects and `TouchEvent` dispatching to replicate real touch interactions, including timings and position changes for realism.

For example, to test a new 'swirl' gesture, you would define `simulateSwirl()` with looped touch moves in a circular pattern and add it to the test flow.

## License

ISC
