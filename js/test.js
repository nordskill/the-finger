import { TheFinger } from './thefinger.js';

const touchArea = document.querySelector('canvas');
const finger = new TheFinger(touchArea, {
    preventDefault: true,
    visualize: true
});

const gestureType = document.querySelector('#gesture_type');
const gestureType2 = document.querySelector('#gesture_type_2');

// finger.track('tap', showGestureDetails);
// finger.track('double-tap', showGestureDetails);
// finger.track('press', showGestureDetails);
// finger.track('long-press', showGestureDetails);
// finger.track('rotate', showGestureDetails);
// finger.track('pinch-spread', showGestureDetails);
// finger.track('drag', showGestureDetails);
// finger.track('pan', showGestureDetails);
// finger.track('two-finger-tap', showGestureDetails);

function showGestureDetails(gesture) {
    gestureType.innerText = JSON.stringify(gesture, null, 2);
    // triangle.style.transform = `rotate(${gesture.angle}deg)`;
    // triangle.style.left = `${gesture.x}px`;
    // triangle.style.top = `${gesture.y}px`;
}
function showGestureDetails2(gesture) {
    gestureType2.innerText = JSON.stringify(gesture, null, 2);
    // triangle.style.transform = `rotate(${gesture.angle}deg)`;
    // triangle.style.left = `${gesture.x}px`;
    // triangle.style.top = `${gesture.y}px`;
}