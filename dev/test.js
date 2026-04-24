import TheFinger from '../src/thefinger.js';

const touchArea = document.querySelector('canvas');
const finger = new TheFinger(touchArea, {
    preventDefault: true,
    visualize: true
});

const gestureType = document.querySelector('#gesture_type');
const gestureType2 = document.querySelector('#gesture_type_2');
let activeTestErrors = null;

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

        const detectedGestures = [];
        const errors = [];
        const finger = new TheFinger(touchArea, { preventDefault: true });

        activeTestErrors = errors;
        window.addEventListener('error', recordTestError);
        window.addEventListener('unhandledrejection', recordUnhandledRejection);

        finger.track(gesture, recordGesture);

        try {
            await simulateGesture(gesture, touchArea, elem);

            // Wait a bit for any final events
            await wait(500);
        } catch (error) {
            errors.push(error);
        }

        const detected = detectedGestures.length > 0;
        const validationErrors = validateGestureResult(gesture, detectedGestures);
        const testErrors = [
            ...validationErrors,
            ...errors.map(formatError)
        ];

        if (detected && testErrors.length === 0) {
            logPass(`${gesture} detected`);
        } else {
            if (!detected) {
                testErrors.unshift(`Expected ${gesture} to emit at least one callback, but no callbacks were received.`);
            }

            logFail(gesture);
            console.log('Detected details:', detectedGestures);
            console.log('Expected:', getGestureExpectations(gesture));
            console.log('Errors:', testErrors);
        }

        window.removeEventListener('error', recordTestError);
        window.removeEventListener('unhandledrejection', recordUnhandledRejection);
        activeTestErrors = null;
        finger.off(touchArea);

        function recordGesture(gestureData) {
            detectedGestures.push(gestureData);
        }
    }

    console.log('All tests completed');
}

function logPass(message) {
    console.log(`%cPASS: ${message}`, 'color: #16a34a; font-weight: bold;');
}

function logFail(message) {
    console.log(`%cFAIL: ${message}`, 'color: #dc2626; font-weight: bold;');
}

function recordTestError(event) {
    if (!activeTestErrors) return;

    activeTestErrors.push(event.error || event.message);
}

function recordUnhandledRejection(event) {
    if (!activeTestErrors) return;

    activeTestErrors.push(event.reason);
}

function validateGestureResult(gesture, detectedGestures) {
    if (detectedGestures.length === 0) return [];

    switch (gesture) {
        case 'drag':
        case 'pan':
            return validateFinalGesture(
                gesture,
                detectedGestures,
                ['endX', 'endY', 'final_direction', 'flick']
            );
        case 'pinch-spread':
            return validateFinalGestureEnd(gesture, detectedGestures);
        case 'double-tap-and-drag':
            return validateFinalGesture(
                gesture,
                detectedGestures,
                ['endX', 'endY', 'speed', 'final_direction', 'flick']
            );
        default:
            return [];
    }
}

function validateFinalGesture(gesture, detectedGestures, expectedProperties) {
    const missingByEvent = [];

    for (let i = 0; i < detectedGestures.length; i++) {
        const gestureData = detectedGestures[i];
        const missingProperties = [];

        for (const property of expectedProperties) {
            if (!(property in gestureData)) {
                missingProperties.push(property);
            }
        }

        if (missingProperties.length === 0) return [];

        missingByEvent.push(`#${i + 1} missing ${missingProperties.join(', ')}`);
    }

    return [
        `Expected ${gesture} to emit a final callback with ${expectedProperties.join(', ')}.`,
        `Received ${detectedGestures.length} callback(s), but none matched: ${missingByEvent.join('; ')}.`
    ];
}

function validateFinalGestureEnd(gesture, detectedGestures) {
    const mismatches = [];

    for (let i = 0; i < detectedGestures.length; i++) {
        const gestureData = detectedGestures[i];

        if (gestureData.end === true) return [];

        mismatches.push(`#${i + 1} has end=${String(gestureData.end)}`);
    }

    return [
        `Expected ${gesture} to emit a final callback with end: true.`,
        `Received ${detectedGestures.length} callback(s), but none matched: ${mismatches.join('; ')}.`
    ];
}

function getGestureExpectations(gesture) {
    switch (gesture) {
        case 'drag':
        case 'pan':
            return 'At least one callback, plus a final callback with endX, endY, final_direction, flick.';
        case 'pinch-spread':
            return 'At least one callback, plus a final callback with end: true.';
        case 'double-tap-and-drag':
            return 'At least one callback, plus a final callback with endX, endY, speed, final_direction, flick.';
        default:
            return 'At least one callback.';
    }
}

function formatError(error) {
    if (error instanceof Error) return `${error.name}: ${error.message}`;
    if (typeof error === 'string') return error;
    return JSON.stringify(error);
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
