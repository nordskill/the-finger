# TheFinger API Documentation

## Overview

`TheFinger` is a function designed to add multi-touch gesture recognition to HTML elements. It's implemented to work with touch events and provides easy customization to suit specific use-cases.

The recognizable gestures are:
- tap
- double tap
- long press
- drag
- flick
- rotation
- pinch-spread
- pan
- two-finger-tap
- double-tap-and-drag

## Basic Usage

To utilize `TheFinger`, first import the function:

```javascript
import { TheFinger } from './thefinger';
```

Then, create a new instance and pass the HTML element you want to track:

```javascript
const element = document.getElementById('target');
const finger = new TheFinger(element);
finger.track('drag', callbackFunction);

```

## Function Parameters

**TheFinger** accepts two parameters:

- `element` (required) - The HTML element that the function will attach event listeners to. This element is the area where the touch gestures will be detected.

- `settings` (optional) - An object containing additional configuration options for the function. The options include:

    - `preventDefault` (optional): A boolean to prevent the default browser handling of touch events on the element.

```javascript
const settings = {
    preventDefault: true
};

const finger = new TheFinger(element, settings);
```

## Methods

**TheFinger** provides several methods to customize its behavior:

- `on(element)` - Attach touch event listeners to the provided HTML element.

- `off(element)` - Remove touch event listeners from the provided HTML element.

- `track(gesture, callback, settings)` - Begins tracking a specified gesture on the element. 

    - `gesture` (required): A string representing the gesture type to be tracked. Available gestures are:
        - **'press'**
        - **'drag'** (read **'flick'** property in callback parameter for flick detection)
        - **'rotate'**
        - **'pinch-spread'**
        - **'double-tap'**
        - **'tap'**

    - `callback` (required): A function that will be executed when the specified gesture is detected.

    - `settings` (optional): An object containing additional configuration options for the gesture. Options include:

        - `preventDefault` (optional): Can be set to `true`, `'horizontal'`, or `'vertical'` to prevent the default browser handling of the gesture in the specified direction(s).

- `untrack(gesture)` - Stops tracking a specified gesture on the element.

    - `gesture` (required): A string representing the gesture type to be untracked. 

## Callback Parameters

The callback function for a gesture receives two parameters:

- `currentTouch` (Object) - Contains information about the current gesture such as coordinates (`x`, `y`), start coordinates (`startX`, `startY`), end coordinates (`endX`, `endY`), speed, angle, initial direction (`initial_direction`), final direction (`final_direction`), and whether it's a flick (`flick`) or not.

- `touchHistory` (Array) - An array containing the history of the current touch gesture. Each element in the array is an object with properties `x`, `y`, and `t` representing the x-coordinate, y-coordinate, and timestamp of the touch point respectively.

## Example

Below is an example of tracking a 'drag' gesture:

```javascript
let element = document.getElementById('target');
let finger = new TheFinger(element);

finger.track('drag', (currentTouch, touchHistory) => {
    console.log('Drag detected at coordinates: ', currentTouch.x, currentTouch.y);
    console.log('Touch history: ', touchHistory);
});
```

This will print the coordinates and the touch history to the console every time a 'drag' gesture is detected on the element.