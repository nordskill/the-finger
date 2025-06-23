import { TheFinger } from '../src/thefinger.js';

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
finger.track('double-tap-and-drag', showGestureDetails);

function showGestureDetails(gesture) {
    let output = touchArea.width;
    const pixelRatio = window.devicePixelRatio || 1;

    if (gesture.startX <= 10
        || gesture.startY <= 10
        || gesture.startX >= (touchArea.width / pixelRatio) - 10
        || gesture.startY >= (touchArea.height / pixelRatio) - 10) {
        output = 'Gesture started outside the touch area.';
    }
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