import { TheFinger } from './thefinger.js';

const touchArea = document.querySelector('canvas');
const finger = new TheFinger(touchArea, {
    preventDefault: true,
    visualize: true
});

const gestureType = document.querySelector('#gesture_type');

// finger.track('tap', gesture => { gestureType.innerText = 'tap'; });
// finger.track('double-tap', gesture => { gestureType.innerText = 'double-tap'; });
// finger.track('press', gesture => { gestureType.innerText = 'press'; });
// finger.track('long-press', gesture => { gestureType.innerText = 'long-press'; });
// finger.track('rotate', gesture => { gestureType.innerText = JSON.stringify(gesture, null, 2) });
// finger.track('pinch-spread', gesture => { gestureType.innerText = JSON.stringify(gesture, null, 2) });
finger.track('drag', gesture => {
    gestureType.innerText = JSON.stringify(gesture, null, 2);
    triangle.style.transform = `rotate(${gesture.angle}deg)`;
    triangle.style.left = `${gesture.x}px`;
    triangle.style.top = `${gesture.y}px`;
});
// finger.track('pan', gesture => { gestureType.innerText = JSON.stringify(gesture, null, 2) });
// finger.track('two-finger-tap', gesture => { gestureType.innerText = 'two-finger-tap'; });