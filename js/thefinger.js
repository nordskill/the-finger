const pressTime = 350; // ms
const doubleTapInterval = 250; // ms
const flickTreshold = 0.75; // drag speed

export function TheFinger(element, settings) {

    let area = element,
        areaBox,
        gestureType,
        finger = this,
        moving = false,
        pressTimer,
        currentTouch = {},
        startTime,
        tapReleaseTime,
        startX,
        startY,
        endX,
        endY,
        rotationAngleStart,
        totalAngleStart,
        previousAngle = null,
        angleRelative = null,
        revs = 0,
        negativeRev = false,
        distanceStart,
        watching = {},
        preventDefaults = {},
		touchHistory = [],
		initialDirection;

    this.on = on;
    this.off = off;
    this.track = track;
    this.untrack = untrack;

    if (area) on(area);

    function on(element) {
        area = element;
        element.addEventListener('touchstart', detectGesture);
        element.addEventListener('touchmove', detectGesture);
        element.addEventListener('touchend', detectGesture);
    }
    function off(element) {
        element.removeEventListener('touchstart', detectGesture);
        element.removeEventListener('touchmove', detectGesture);
        element.removeEventListener('touchend', detectGesture);
    }
    function track(gesture, callback, settings) {
        watching[gesture] = callback;
        if (settings) {
            if (settings.preventDefault === true) {
                preventDefaults[gesture] = true;
            }
            if (settings.preventDefault === 'horizontal') {
                preventDefaults[gesture] = 'horizontal';
            }
            if (settings.preventDefault === 'vertical') {
                preventDefaults[gesture] = 'vertical';
            }
        }
    }
    function untrack(gesture) {
        delete watching[gesture];
    }
    function detectGesture(e) {

        if (settings?.preventDefault) e.preventDefault();

        const touches = e.touches;
        const timestamp = e.timeStamp;

        let params = [];

        if (e.type === 'touchstart') {

            startTime = timestamp;
            previousAngle = null;
            angleRelative = null;
            revs = 0;
            negativeRev = false;
            gestureType = null;

            createTouches(touches);

            switch (touches.length) {
                case 1: // 1 finger
                    pressTimer = setTimeout(() => {
                        gestureType = 'press';
                        currentTouch = { x: startX, y: startY };
                        params = [currentTouch];
                        callback(gestureType, params);
                    }, pressTime);
                    break;
                case 2: // 2 fingers
                    const x1 = touches[0].clientX,
                        y1 = touches[0].clientY,
                        x2 = touches[1].clientX,
                        y2 = touches[1].clientY;
                    rotationAngleStart = getAngle(x1, y1, x2, y2);
                    distanceStart = getDistance(x1, y1, x2, y2);

                    if (rotationAngleStart > 180) {
                        totalAngleStart = (360 * revs + rotationAngleStart) - 360;
                    } else {
                        totalAngleStart = 360 * revs + rotationAngleStart;
                    }
                    break;
                default:
                    break;
            }

        }
        if (e.type === 'touchmove') {

            clearTimeout(pressTimer);
            moving = true;

            const x = touches[0].clientX - areaBox.left;
            const y = touches[0].clientY - areaBox.top;

            // if (x > 0 && x < window.innerWidth && y > 0 && y < window.innerHeight) {

            // if (x > area.left && x < area.right && y > area.top && y < area.bottom) {

            saveToHistory(touches);

            currentTouch = {};

            switch (touches.length) {
                case 1:
                    if (gestureType !== 'pinch-spread') {
                        currentTouch.x = x;
                        currentTouch.y = y;
                        currentTouch.startX = startX;
                        currentTouch.startY = startY;
                        currentTouch.step = getStepSpeed(touchHistory);
                        currentTouch.speed = getSpeed();
                        currentTouch.angle = getAngle(startX, startY, x, y);

						if (!initialDirection) {
							initialDirection = getDirection(startX, startY, x, y);
							currentTouch.initial_direction = initialDirection;
						}

                        gestureType = 'drag';
                        params = [currentTouch, touchHistory];
                        callback(gestureType, params);
                    }
                    break;
                case 2:
                    const x1 = touches[0].clientX,
                        y1 = touches[0].clientY,
                        x2 = touches[1].clientX,
                        y2 = touches[1].clientY;
                    const distance = getDistance(x1, y1, x2, y2);
                    const scale = getScale(distanceStart, distance);
                    const angleAbsolute = getAngle(x1, y1, x2, y2);

                    if (angleAbsolute - previousAngle <= -180) {
                        if (negativeRev) {
                            revs === 0;
                            negativeRev = false;
                        } else {
                            revs++;
                        }
                    } else if (angleAbsolute - previousAngle >= 180) {
                        if (revs === 0 && !negativeRev) {
                            negativeRev = true;
                        } else {
                            revs--;
                        }
                    }

                    if (negativeRev || revs < 0) {
                        angleRelative = (360 * revs + angleAbsolute) - 360;
                    } else {
                        angleRelative = 360 * revs + angleAbsolute;
                    }

                    const rotation = angleRelative - totalAngleStart;
                    previousAngle = angleAbsolute;

                    gestureType = 'rotate';
                    currentTouch = {
                        touches: [
                            { x: x1, y: y2 },
                            { x: x2, y: y2 }
                        ],
                        rotation,
                        angleAbsolute,
                        angleRelative
                    }
                    params = [currentTouch, touchHistory];
                    callback(gestureType, params);

                    gestureType = 'pinch-spread';
                    currentTouch = {
                        touches: [
                            { x: x1, y: y2 },
                            { x: x2, y: y2 }
                        ],
                        distance,
                        scale
                    }
                    params = [currentTouch, touchHistory];
                    callback(gestureType, params);

                    break;
                default:
                    break;
            }

            //     } else {
            //         finishTouch();
            //     }
            //
            // } else {
            //     finishTouch();
            // }

        }
        if (e.type === 'touchend') {
            finishTouch();
            moving = false;
        }

        if (preventDefaults[gestureType] === true) e.preventDefault();
        if (preventDefaults[gestureType] === 'horizontal') {
            if (
                currentTouch.angle > 45 && currentTouch.angle < 135 ||
                currentTouch.angle > 225 && currentTouch.angle < 315
            ) {
                e.preventDefault();
            }
        }
        if (preventDefaults[gestureType] === 'vertical') {
            if (
                currentTouch.angle > 315 && currentTouch.angle < 45 ||
                currentTouch.angle > 135 && currentTouch.angle < 225
            ) {
                e.preventDefault();
            }
        }

        if (settings?.visualize) visualize(touches);
        
        function createTouches(touches) {
            for (const key of Object.keys(touches)) {
                if (!touchHistory[key]) {
                    const touch = touches[key];
                    areaBox = area.getBoundingClientRect();
                    startX = touch.clientX - areaBox.left;
                    startY = touch.clientY - areaBox.top;
                    touchHistory.push(touch);
                    touchHistory[key] = {
                        x: [startX],
                        y: [startY],
                        t: [timestamp]
                    }
                }
            }
        }
        function saveToHistory(touches) {

            if (touchHistory.length > 0) {
                for (const key of Object.keys(touches)) {
                    touchHistory[key].x.push(touches[key].clientX);
                    touchHistory[key].y.push(touches[key].clientY);
                    touchHistory[key].t.push(timestamp);
                }
            }

        }
        function getStepSpeed(touchHistory) {
            let xDelta;
            touchHistory.forEach(touch => {
                const xArr = touch.x;
                const xLast = xArr[xArr.length - 1];
                const xPreLast = xArr[xArr.length - 2];
                xDelta = Math.abs(xLast - xPreLast);
            });
            return xDelta;
        }
        function finishTouch() {

            if (!moving && timestamp - startTime < pressTime) {

                clearTimeout(pressTimer);

                if (timestamp < tapReleaseTime + doubleTapInterval + pressTime) {
                    tapReleaseTime = null;
                    gestureType = 'double-tap';
                } else {
                    tapReleaseTime = timestamp;
                    gestureType = 'tap';
                }

                currentTouch = { x: startX, y: startY };
                params = [currentTouch];
                callback(gestureType, params);

            } else if (moving && touchHistory.length > 0) {

                if (gestureType !== 'pinch-spread') {

                    const xArray = touchHistory[0].x;
                    const yArray = touchHistory[0].y;
                    endX = xArray[xArray.length - 1];
                    endY = yArray[yArray.length - 1];
                    currentTouch.endX = endX;
                    currentTouch.endY = endY;

					currentTouch.speed = getSpeed();
					currentTouch.initial_direction = initialDirection;

					currentTouch.final_direction = getDirection(
						touchHistory[0].x[touchHistory[0].x.length - 2],
						touchHistory[0].y[touchHistory[0].y.length - 2],
						currentTouch.endX,
						currentTouch.endY
					);

                    gestureType = 'drag';

                    if (currentTouch.speed >= flickTreshold) {
						currentTouch.flick = true;
					} else {
						currentTouch.flick = false;
					}

                    params = [currentTouch, touchHistory];
                    callback(gestureType, params);

                } else {
                    currentTouch.end = true;
                    params = [currentTouch, touchHistory];
                    callback(gestureType, params);
                    touchHistory = [];
                }

            }

            if (touches.length === 0) touchHistory = [];

			initialDirection = null;

        }
        function getSpeed() {

            let tailArrayX = touchHistory[0].x;
            let tailArrayY = touchHistory[0].y;
            let tailArrayT = touchHistory[0].t;
            let time, xDistance, yDistance, distance;

            // extract last 5 records from history

            if (touchHistory[0].x.length >= 5) {
                tailArrayX = touchHistory[0].x.slice(-5, touchHistory[0].x.length);
                tailArrayY = touchHistory[0].y.slice(-5, touchHistory[0].y.length);
                tailArrayT = touchHistory[0].t.slice(-5, touchHistory[0].t.length);
            }

            time = tailArrayT[tailArrayT.length - 1] - tailArrayT[0];

            distance = getDistance(
                tailArrayX[0],
                tailArrayY[0],
                tailArrayX[tailArrayX.length - 1],
                tailArrayY[tailArrayY.length - 1]
            );

            return distance / time;

        }
        function getDistance(x1, y1, x2, y2) {
            const height = y2 - y1,
                width = x2 - x1;
            return Math.hypot(width, height);
        }
        function getScale(distanceStart, distance) {
            return distance / distanceStart;
        }
        function callback(gestureType, params) {
            if (touchHistory.length > 0) {
                if (watching[gestureType]) watching[gestureType].apply(this, params);
            }
        }
        function getAngle(sX, sY, eX, eY) {
            const dX = eX - sX;
            const dY = eY - sY;
            const radians = Math.atan2(dY, dX);
            let angle = radians * 180 / Math.PI + 90;
            if (angle < 0) angle += 360;
            if (angle > 360) angle -= 360;
            return angle;
        }
		function getDirection(startX, startY, x, y) {

			const angle = getAngle(startX, startY, x, y);

			if (angle >= 315 || angle < 45) {
				return 'top';
			}
			if (angle >= 45 && angle < 135) {
				return 'right';
			}
			if (angle >= 135 && angle < 225) {
				return 'bottom';
			}
			if (angle >= 225 && angle < 315) {
				return 'left';
			}
        }

    }

}