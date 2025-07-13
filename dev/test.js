import TheFinger from '../src/thefinger.js';

const touchArea = document.querySelector('canvas');
const finger = new TheFinger(touchArea, {
    preventDefault: true,
    visualize: true
});

const gestureType = document.querySelector('#gesture_type');
const gestureType2 = document.querySelector('#gesture_type_2');

finger.track('tap', showGestureDetails);
finger.track('double-tap', showGestureDetails);
finger.track('press', showGestureDetails);
finger.track('long-press', showGestureDetails);
finger.track('rotate', showGestureDetails);
finger.track('pinch-spread', showGestureDetails);
finger.track('drag', showGestureDetails);
finger.track('pan', showGestureDetails);
finger.track('two-finger-tap', showGestureDetails);
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

// Integration Tests
if (location.search.includes('test')) {
    runIntegrationTests();
}

async function runIntegrationTests() {
    const touchArea = document.querySelector('canvas');
    const elem = touchArea.getBoundingClientRect();

    const gestures = [
        'tap', 'double-tap', 'press', 'long-press', 'rotate',
        'pinch-spread', 'drag', 'pan', 'two-finger-tap', 'double-tap-and-drag'
    ];

    for (const gesture of gestures) {
        console.log(`Testing ${gesture}`);

        let detectedGestures = [];
        const finger = new TheFinger(touchArea, { preventDefault: true });

        finger.track(gesture, (g) => {
            detectedGestures.push(g);
        });

        await simulateGesture(gesture, touchArea, elem);

        // Wait a bit for any final events
        await new Promise(resolve => setTimeout(resolve, 500));

        const detected = detectedGestures.length > 0;
        if (detected) {
            console.log(`PASS: ${gesture} detected`);
        } else {
            console.log(`FAIL: ${gesture} not detected`);
            console.log('Detected details (empty):', detectedGestures);
        }

        finger.off(touchArea);
    }

    console.log('All tests completed');
}

async function simulateGesture(gesture, target, elem) {
    const centerX = elem.left + 150;
    const centerY = elem.top + 150;

    switch (gesture) {
        case 'tap':
            await simulateTap(centerX, centerY, target);
            break;
        case 'double-tap':
            await simulateDoubleTap(centerX, centerY, target);
            break;
        case 'press':
            await simulatePress(centerX, centerY, target);
            break;
        case 'long-press':
            await simulateLongPress(centerX, centerY, target);
            break;
        case 'rotate':
            await simulateRotate(centerX, centerY, target);
            break;
        case 'pinch-spread':
            await simulatePinchSpread(centerX, centerY, target);
            break;
        case 'drag':
            await simulateDrag(centerX, centerY, target);
            break;
        case 'pan':
            await simulatePan(centerX, centerY, target);
            break;
        case 'two-finger-tap':
            await simulateTwoFingerTap(centerX, centerY, target);
            break;
        case 'double-tap-and-drag':
            await simulateDoubleTapAndDrag(centerX, centerY, target);
            break;
    }
}

function createTouch(target, id, x, y) {
    return new Touch({
        identifier: id,
        target: target,
        clientX: x,
        clientY: y,
        screenX: x,
        screenY: y,
        pageX: x,
        pageY: y
    });
}

function dispatchTouchEvent(type, touches, target) {
    const event = new TouchEvent(type, {
        bubbles: true,
        cancelable: true,
        touches: touches,
        targetTouches: touches,
        changedTouches: touches
    });
    target.dispatchEvent(event);
}

async function simulateTap(x, y, target) {
    const touch = createTouch(target, 0, x, y);
    dispatchTouchEvent('touchstart', [touch], target);
    await new Promise(resolve => setTimeout(resolve, 50));
    dispatchTouchEvent('touchend', [], target);
}

async function simulateDoubleTap(x, y, target) {
    // First tap
    await simulateTap(x, y, target);
    await new Promise(resolve => setTimeout(resolve, 100)); // Within interval
    // Second tap
    await simulateTap(x, y, target);
}

async function simulatePress(x, y, target) {
    const touch = createTouch(target, 0, x, y);
    dispatchTouchEvent('touchstart', [touch], target);
    await new Promise(resolve => setTimeout(resolve, 50));
    dispatchTouchEvent('touchend', [], target);
}

async function simulateLongPress(x, y, target) {
    const touch = createTouch(target, 0, x, y);
    dispatchTouchEvent('touchstart', [touch], target);
    await new Promise(resolve => setTimeout(resolve, 400)); // Longer than PRESS_TIME (350ms)
    dispatchTouchEvent('touchend', [], target);
}

async function simulateRotate(cx, cy, target) {
    // Start with two touches
    let touch1 = createTouch(target, 0, cx - 50, cy);
    let touch2 = createTouch(target, 1, cx + 50, cy);
    dispatchTouchEvent('touchstart', [touch1, touch2], target);

    await new Promise(resolve => setTimeout(resolve, 50));

    // Simulate rotation by moving one touch
    for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI / 2;
        touch1 = createTouch(target, 0, cx + 50 * Math.cos(angle) - 50 * Math.sin(angle), cy + 50 * Math.sin(angle) + 50 * Math.cos(angle));
        dispatchTouchEvent('touchmove', [touch1, touch2], target);
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    dispatchTouchEvent('touchend', [], target);
}

async function simulatePinchSpread(cx, cy, target) {
    // Start with two touches far apart
    let touch1 = createTouch(target, 0, cx - 100, cy);
    let touch2 = createTouch(target, 1, cx + 100, cy);
    dispatchTouchEvent('touchstart', [touch1, touch2], target);

    await new Promise(resolve => setTimeout(resolve, 50));

    // Move closer for pinch
    for (let i = 0; i < 10; i++) {
        const dist = 100 - (i * 10);
        touch1 = createTouch(target, 0, cx - dist, cy);
        touch2 = createTouch(target, 1, cx + dist, cy);
        dispatchTouchEvent('touchmove', [touch1, touch2], target);
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    dispatchTouchEvent('touchend', [], target);
}

async function simulateDrag(cx, cy, target) {
    const touch = createTouch(target, 0, cx, cy);
    dispatchTouchEvent('touchstart', [touch], target);

    await new Promise(resolve => setTimeout(resolve, 50));

    // Move right
    for (let i = 0; i < 10; i++) {
        const newX = cx + (i * 10);
        const movedTouch = createTouch(target, 0, newX, cy);
        dispatchTouchEvent('touchmove', [movedTouch], target);
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    dispatchTouchEvent('touchend', [], target);
}

async function simulatePan(cx, cy, target) {
    let touch1 = createTouch(target, 0, cx - 50, cy);
    let touch2 = createTouch(target, 1, cx + 50, cy);
    dispatchTouchEvent('touchstart', [touch1, touch2], target);

    await new Promise(resolve => setTimeout(resolve, 50));

    // Move both right
    for (let i = 0; i < 10; i++) {
        const dx = i * 10;
        touch1 = createTouch(target, 0, cx - 50 + dx, cy);
        touch2 = createTouch(target, 1, cx + 50 + dx, cy);
        dispatchTouchEvent('touchmove', [touch1, touch2], target);
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    dispatchTouchEvent('touchend', [], target);
}

async function simulateTwoFingerTap(cx, cy, target) {
    const touch1 = createTouch(target, 0, cx - 50, cy);
    const touch2 = createTouch(target, 1, cx + 50, cy);
    dispatchTouchEvent('touchstart', [touch1, touch2], target);
    await new Promise(resolve => setTimeout(resolve, 50));
    dispatchTouchEvent('touchend', [], target);
}

async function simulateDoubleTapAndDrag(cx, cy, target) {
    // First tap
    await simulateTap(cx, cy, target);
    await new Promise(resolve => setTimeout(resolve, 100)); // Within interval

    // Second tap and drag
    const touch = createTouch(target, 0, cx, cy);
    dispatchTouchEvent('touchstart', [touch], target);

    await new Promise(resolve => setTimeout(resolve, 50));

    // Drag
    for (let i = 0; i < 10; i++) {
        const newX = cx + (i * 10);
        const movedTouch = createTouch(target, 0, newX, cy);
        dispatchTouchEvent('touchmove', [movedTouch], target);
        await new Promise(resolve => setTimeout(resolve, 20));
    }

    dispatchTouchEvent('touchend', [], target);
}