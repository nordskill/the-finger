import { TheFinger } from './thefinger.js';

const touchArea = document.querySelector('canvas');
const finger = new TheFinger(touchArea, {
    preventDefault: true,
    visualize: true
});

const gestureType = document.querySelector('#gesture_type');

finger.track('tap', gesture => { gestureType.innerText = 'tap'; });
finger.track('double-tap', gesture => { gestureType.innerText = 'double-tap'; });
finger.track('press', gesture => { gestureType.innerText = 'press'; });
// finger.track('long-press', gesture => { gestureType.innerText = 'long-press'; });
finger.track('rotate', gesture => { gestureType.innerText = 'rotate'; });
finger.track('pinch-spread', gesture => { gestureType.innerText = 'pinch-spread'; });
finger.track('drag', gesture => { gesture.flick ? gestureType.innerText = 'flick' : gestureType.innerText = 'drag'; });
// finger.track('pan', gesture => { gestureType.innerText = 'pan'; });
// finger.track('two-finger-tap', gesture => { gestureType.innerText = 'two-finger-tap'; });