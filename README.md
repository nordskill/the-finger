# The Finger

JavaScript library which detects touch gesture types:
- tap
- double tap
- long press
- drag
- flick
- rotation
- pinch & spread

## How to Use

```
import { TheFinger } from './thefinger.js';

const touchArea = document.querySelector('#my-elem');
const finger = new TheFinger(touchArea);

finger.track('tap', gesture => { /* do something */ });
finger.track('double-tap', gesture => { /* do something */ });
finger.track('press', gesture => { /* do something */ });
finger.track('drag', gesture => { console.log(gesture) });
finger.track('rotate', gesture => { /* do something */ });
finger.track('pinch-spread', gesture => { /* do something */ });
```
