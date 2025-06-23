const CONSTANTS = {
    PRESS_TIME: 350, // ms
    DOUBLE_TAP_INTERVAL: 250, // ms
    FLICK_THRESHOLD: 0.75, // drag speed
    DOUBLE_TAP_DRAG_THRESHOLD: 5, // px
};

const ELEMENT_STATE = new WeakMap();

class TheFinger {

    #element;
    #settings;
    #areaBox;
    #gestureType = null;
    #moving = false;
    #pressTimer;
    #currentTouch = {};
    #startTime;
    #tapReleaseTime;
    #startX;
    #startY;
    #endX;
    #endY;
    #rotationAngleStart;
    #totalAngleStart;
    #previousAngle = null;
    #angleRelative = null;
    #revs = 0;
    #negativeRev = false;
    #distanceStart;
    #watching = {};
    #preventDefaults = {};
    #touchHistory = new Map();
    #touchSequence = [];
    #initialDirection;
    #doubleTapDragActive = false;
    #doubleTapDragStart = null;

    gestures = {

        'press': {
            start: () => {
                this.#gestureType = 'press';
                return {
                    type: 'press',
                    data: { x: this.#startX, y: this.#startY }
                };
            },
            move: () => { },
            end: () => { }
        },

        'tap': {
            start: () => { },
            move: () => {
                clearTimeout(this.#pressTimer);
            },
            end: (touches, timestamp) => {
                if (!this.#moving && timestamp - this.#startTime < CONSTANTS.PRESS_TIME) {
                    clearTimeout(this.#pressTimer);
                    if (timestamp < this.#tapReleaseTime + CONSTANTS.DOUBLE_TAP_INTERVAL + CONSTANTS.PRESS_TIME) {
                        this.#tapReleaseTime = null;
                        return {
                            type: 'double-tap',
                            data: { x: this.#startX, y: this.#startY }
                        };
                    } else {
                        this.#tapReleaseTime = timestamp;
                        return {
                            type: 'tap',
                            data: { x: this.#startX, y: this.#startY }
                        };
                    }
                }
                return null;
            }
        },

        'two-finger-tap': {
            start: () => { },
            move: () => { },
            end: (touches, timestamp) => {
                if (this.#touchSequence.length === 2 && !this.#moving &&
                    timestamp - this.#startTime < CONSTANTS.PRESS_TIME) {
                    // Get the positions of both touch points
                    const touchPositions = [...this.#touchHistory.values()].map(h => ({
                        x: h.x[0],
                        y: h.y[0]
                    }));

                    if (touchPositions.length === 2) {
                        // Calculate center point between the two touches
                        const x = (touchPositions[0].x + touchPositions[1].x) / 2;
                        const y = (touchPositions[0].y + touchPositions[1].y) / 2;

                        return {
                            type: 'two-finger-tap',
                            data: {
                                x,
                                y,
                                touches: touchPositions
                            }
                        };
                    }
                }
                return null;
            }
        },

        'long-press': {
            start: (touches, timestamp) => {
                if (touches.length !== 1) return;

                this.#pressTimer = setTimeout(() => {
                    this.#gestureType = 'long-press';
                    this.#currentTouch = { x: this.#startX, y: this.#startY };
                    this._executeCallback('long-press', [this.#currentTouch]);
                }, CONSTANTS.PRESS_TIME);
            },
            move: () => {
                clearTimeout(this.#pressTimer);
            },
            end: () => {
                clearTimeout(this.#pressTimer);
            }
        },

        'drag': {
            start: () => { },
            move: (touches) => {
                if (touches.length !== 1) return null;

                const touch = touches[0];
                const x = touch.clientX - this.#areaBox.left;
                const y = touch.clientY - this.#areaBox.top;

                // Get previous x, y coordinates using helper method
                const { prevX, prevY } = this._getPreviousCoordinates(touches, this.#startX, this.#startY);

                this.#currentTouch = {
                    x,
                    y,
                    startX: this.#startX,
                    startY: this.#startY,
                    step: this._getStepSpeed(),
                    speed: this._getSpeed(),
                    angle: this._getAngle(prevX, prevY, x, y)
                };

                if (!this.#initialDirection) {
                    this.#initialDirection = this._getDirection(this.#startX, this.#startY, x, y);
                    this.#currentTouch.initial_direction = this.#initialDirection;
                }

                return {
                    type: 'drag',
                    data: this.#currentTouch
                };
            },
            end: () => {
                if (!this.#moving || this.#touchHistory.size === 0 || this.#gestureType !== 'drag') return null;

                const history = this.#touchHistory.values().next().value;
                if (!history?.x?.length || !history?.y?.length) return null;

                const x_arr = history.x;
                const y_arr = history.y;

                this.#endX = x_arr[x_arr.length - 1];
                this.#endY = y_arr[y_arr.length - 1];

                this.#currentTouch.endX = this.#endX;
                this.#currentTouch.endY = this.#endY;
                this.#currentTouch.speed = this._getSpeed();
                this.#currentTouch.initial_direction = this.#initialDirection;

                if (x_arr.length > 1 && y_arr.length > 1) {
                    this.#currentTouch.final_direction = this._getDirection(
                        x_arr[x_arr.length - 2],
                        y_arr[y_arr.length - 2],
                        this.#currentTouch.endX,
                        this.#currentTouch.endY
                    );
                }

                this.#currentTouch.flick = this.#currentTouch.speed >= CONSTANTS.FLICK_THRESHOLD;

                return {
                    type: 'drag',
                    data: this.#currentTouch
                };
            }
        },

        'pan': {
            start: (touches) => {
                if (touches.length < 2) return null;
                const { x, y } = this._getAveragePosition(touches);
                this.#startX = x;
                this.#startY = y;
            },
            move: (touches) => {
                if (touches.length < 2) return null;

                const { x, y, touchesArr } = this._getAveragePosition(touches);

                // Get previous x, y coordinates using helper method
                const { prevX, prevY } = this._getPreviousCoordinates(touches, this.#startX, this.#startY);

                this.#currentTouch = {
                    touches: touchesArr,
                    x,
                    y,
                    startX: this.#startX,
                    startY: this.#startY,
                    step: this._getStepSpeed(),
                    speed: this._getSpeed(),
                    angle: this._getAngle(prevX, prevY, x, y)
                };

                if (!this.#initialDirection) {
                    this.#initialDirection = this._getDirection(this.#startX, this.#startY, x, y);
                    this.#currentTouch.initial_direction = this.#initialDirection;
                }

                return { type: 'pan', data: this.#currentTouch };
            },
            end: () => {
                if (
                    this.#touchSequence.length < 2 ||
                    !this.#moving ||
                    this.#touchHistory.size === 0
                ) return null;

                // build touches[] from the last point of every finger's history
                const touchesFinal = [...this.#touchHistory.values()].map(h => ({
                    x: h.x[h.x.length - 1],
                    y: h.y[h.y.length - 1]
                }));

                const len = touchesFinal.length;
                const x = touchesFinal.reduce((s, t) => s + t.x, 0) / len;
                const y = touchesFinal.reduce((s, t) => s + t.y, 0) / len;

                // Get previous position for angle calculation
                let prevX = this.#currentTouch.x || this.#startX;
                let prevY = this.#currentTouch.y || this.#startY;

                // Get average of 5th-to-last positions if available
                let sumPrevX = 0, sumPrevY = 0;
                let count = 0;

                for (const [_, history] of this.#touchHistory.entries()) {
                    if (history.x.length >= 5 && history.y.length >= 5) {
                        sumPrevX += history.x[history.x.length - 5];
                        sumPrevY += history.y[history.y.length - 5];
                        count++;
                    }
                }

                if (count > 0) {
                    prevX = sumPrevX / count;
                    prevY = sumPrevY / count;
                }

                const speed = this._getSpeed();

                this.#currentTouch = {
                    touches: touchesFinal,
                    x,
                    y,
                    startX: this.#startX,
                    startY: this.#startY,
                    step: this._getStepSpeed(),
                    speed,
                    angle: this._getAngle(prevX, prevY, x, y),
                    endX: x,
                    endY: y,
                    initial_direction: this.#initialDirection,
                    final_direction: this._getDirection(this.#startX, this.#startY, x, y),
                    flick: speed >= CONSTANTS.FLICK_THRESHOLD
                };

                return { type: 'pan', data: this.#currentTouch };
            }
        },

        'rotate': {
            start: (touches) => {
                if (touches.length !== 2) return;

                const [touch1, touch2] = touches;
                const x1 = touch1.clientX;
                const y1 = touch1.clientY;
                const x2 = touch2.clientX;
                const y2 = touch2.clientY;

                this.#rotationAngleStart = this._getAngle(x1, y1, x2, y2);

                this.#totalAngleStart = this.#rotationAngleStart > 180
                    ? (360 * this.#revs + this.#rotationAngleStart) - 360
                    : 360 * this.#revs + this.#rotationAngleStart;
            },
            move: (touches) => {
                if (touches.length !== 2) return null;

                const [touch1, touch2] = touches;
                const x1 = touch1.clientX;
                const y1 = touch1.clientY;
                const x2 = touch2.clientX;
                const y2 = touch2.clientY;

                const angleAbsolute = this._getAngle(x1, y1, x2, y2);

                this._calculateRotation(angleAbsolute);

                const data = {
                    touches: [
                        { x: x1, y: y1 },
                        { x: x2, y: y2 }
                    ],
                    rotation: this.#angleRelative - this.#totalAngleStart,
                    angleAbsolute,
                    angleRelative: this.#angleRelative
                };

                this.#currentTouch = data;

                return {
                    type: 'rotate',
                    data
                };
            },
            end: () => { }
        },

        'pinch-spread': {
            start: (touches) => {
                if (touches.length !== 2) return;

                const [touch1, touch2] = touches;
                const x1 = touch1.clientX;
                const y1 = touch1.clientY;
                const x2 = touch2.clientX;
                const y2 = touch2.clientY;

                this.#distanceStart = this._getDistance(x1, y1, x2, y2);
            },
            move: (touches) => {
                if (touches.length !== 2 || !this.#watching['pinch-spread']) return null;

                const [touch1, touch2] = touches;
                const x1 = touch1.clientX;
                const y1 = touch1.clientY;
                const x2 = touch2.clientX;
                const y2 = touch2.clientY;

                const distance = this._getDistance(x1, y1, x2, y2);
                const scale = this._getScale(this.#distanceStart, distance);

                const data = {
                    touches: [
                        { x: x1, y: y1 },
                        { x: x2, y: y2 }
                    ],
                    distance,
                    scale
                };

                this.#currentTouch = data;

                return {
                    type: 'pinch-spread',
                    data
                };
            },
            end: () => {
                if (this.#gestureType !== 'pinch-spread' ||
                    !this.#moving ||
                    this.#touchHistory.size === 0) return null;

                this.#currentTouch.end = true;

                return {
                    type: 'pinch-spread',
                    data: this.#currentTouch
                };
            }
        },

        'double-tap-and-drag': {
            start: (touches, timestamp) => {
                if (touches.length !== 1) return;
                if (
                    this.#tapReleaseTime &&
                    timestamp < this.#tapReleaseTime + CONSTANTS.DOUBLE_TAP_INTERVAL + CONSTANTS.PRESS_TIME
                ) {
                    this.#doubleTapDragActive = true;
                    const touch = touches[0];
                    this.#doubleTapDragStart = {
                        x: touch.clientX - this.#areaBox.left,
                        y: touch.clientY - this.#areaBox.top
                    };
                } else {
                    this.#doubleTapDragActive = false;
                }
            },
            move: (touches, timestamp) => {
                if (!this.#doubleTapDragActive || touches.length !== 1) return null;
                const touch = touches[0];
                const x = touch.clientX - this.#areaBox.left;
                const y = touch.clientY - this.#areaBox.top;
                const dx = x - this.#doubleTapDragStart.x;
                const dy = y - this.#doubleTapDragStart.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > CONSTANTS.DOUBLE_TAP_DRAG_THRESHOLD) {
                    this.#gestureType = 'double-tap-and-drag';
                    this.#currentTouch = {
                        x,
                        y,
                        startX: this.#doubleTapDragStart.x,
                        startY: this.#doubleTapDragStart.y,
                        dx,
                        dy,
                        dist
                    };
                    return {
                        type: 'double-tap-and-drag',
                        data: this.#currentTouch
                    };
                }
                return null;
            },
            end: () => {
                this.#doubleTapDragActive = false;
                this.#doubleTapDragStart = null;
            }
        },
    };

    constructor(element, settings = {}) {
        this.#element = element;
        this.#settings = settings;

        this._detectGesture = this._detectGesture.bind(this);

        if (element) this.on(element);
    }

    // Public API methods
    on(element) {
        this.#element = element;
        element.addEventListener('touchstart', this._detectGesture);
        element.addEventListener('touchmove', this._detectGesture);
        element.addEventListener('touchend', this._detectGesture);
        ELEMENT_STATE.set(element, {});
    }

    off(element) {
        element = element || this.#element;
        element.removeEventListener('touchstart', this._detectGesture);
        element.removeEventListener('touchmove', this._detectGesture);
        element.removeEventListener('touchend', this._detectGesture);
        ELEMENT_STATE.delete(element);
    }

    track(gesture, callback, settings) {
        this.#watching[gesture] = callback;
        if (settings) {
            if (settings.preventDefault === true) {
                this.#preventDefaults[gesture] = true;
            }
            if (settings.preventDefault === 'horizontal') {
                this.#preventDefaults[gesture] = 'horizontal';
            }
            if (settings.preventDefault === 'vertical') {
                this.#preventDefaults[gesture] = 'vertical';
            }
        }
    }

    untrack(gesture) {
        delete this.#watching[gesture];
    }

    // Private methods
    _detectGesture(e) {
        if (this.#settings?.preventDefault) e.preventDefault();

        const { touches, type, timeStamp: timestamp } = e;

        switch (type) {
            case 'touchstart':
                this._handleTouchStart(touches, timestamp);
                break;
            case 'touchmove':
                this._handleTouchMove(touches, timestamp);
                break;
            case 'touchend':
                this._handleTouchEnd(touches, timestamp);
                break;
        }

        this._handlePreventDefault(e);

        if (this.#settings?.visualize) visualize(touches);
    }

    _handleTouchStart(touches, timestamp) {
        this.#startTime = timestamp;
        this.#previousAngle = null;
        this.#angleRelative = null;
        this.#revs = 0;
        this.#negativeRev = false;
        this.#gestureType = null;

        this._createTouches(touches, timestamp);

        // Run all gesture start handlers
        const gestureValues = Object.values(this.gestures);
        for (let i = 0; i < gestureValues.length; i++) {
            const gesture = gestureValues[i];
            if (gesture.start) {
                const result = gesture.start(touches, timestamp);
                if (result) {
                    this.#gestureType = result.type;
                    this._executeCallback(result.type, [result.data, this.#touchHistory]);
                }
            }
        }
    }

    _handleTouchMove(touches, timestamp) {
        this.#moving = true;
        this._saveToHistory(touches, timestamp);

        // Run all gesture move handlers
        const gestureValues = Object.values(this.gestures);
        for (let i = 0; i < gestureValues.length; i++) {
            const gesture = gestureValues[i];
            if (gesture.move) {
                const result = gesture.move(touches, timestamp);
                if (result) {
                    this.#gestureType = result.type;
                    this._executeCallback(result.type, [result.data, this.#touchHistory]);
                }
            }
        }
    }

    _handleTouchEnd(touches, timestamp) {
        // Run all gesture end handlers
        const gestureValues = Object.values(this.gestures);
        for (let i = 0; i < gestureValues.length; i++) {
            const gesture = gestureValues[i];
            if (gesture.end) {
                const result = gesture.end(touches, timestamp);
                if (result) {
                    this.#gestureType = result.type;
                    this._executeCallback(result.type, [result.data, this.#touchHistory]);
                }
            }
        }

        if (touches.length === 0) {
            this.#touchHistory = new Map();
            this.#touchSequence = [];
        }

        this.#moving = false;
        this.#initialDirection = null;
    }

    _handlePreventDefault(e) {
        if (this.#preventDefaults[this.#gestureType] === true) {
            e.preventDefault();
            return;
        }

        const angle = this.#currentTouch.angle;
        if (angle == null || Number.isNaN(angle)) return;

        if (this.#preventDefaults[this.#gestureType] === 'horizontal') {
            if ((angle > 45 && angle < 135) || (angle > 225 && angle < 315)) {
                e.preventDefault();
            }
        } else if (this.#preventDefaults[this.#gestureType] === 'vertical') {
            if ((angle > 315 || angle < 45) || (angle > 135 && angle < 225)) {
                e.preventDefault();
            }
        }
    }

    _createTouches(touches, timestamp) {
        this.#areaBox = this.#element.getBoundingClientRect();

        for (const touch of touches) {
            const id = touch.identifier;

            if (!this.#touchHistory.has(id)) {
                const startX = touch.clientX - this.#areaBox.left;
                const startY = touch.clientY - this.#areaBox.top;

                this.#startX = startX;
                this.#startY = startY;

                this.#touchHistory.set(id, {
                    x: [startX],
                    y: [startY],
                    t: [timestamp]
                });
                this.#touchSequence.push(id);           // <── NEW
            }
        }
    }

    _saveToHistory(touches, timestamp) {
        if (this.#touchHistory.size === 0) return;

        for (const touch of touches) {
            const history = this.#touchHistory.get(touch.identifier);
            if (history) {
                history.x.push(touch.clientX - this.#areaBox.left);
                history.y.push(touch.clientY - this.#areaBox.top);
                history.t.push(timestamp);
            }
        }
    }

    _getStepSpeed() {
        let x_delta = 0;

        const length = this.#touchSequence.length;
        for (let i = 0; i < length; i++) {
            const id = this.#touchSequence[i];
            const history = this.#touchHistory.get(id);
            if (history && history.x.length > 1) {
                const xs = history.x;
                x_delta = Math.abs(xs[xs.length - 1] - xs[xs.length - 2]);
                break; // Exit after first valid touch for step speed
            }
        }

        return x_delta;
    }

    _getSpeed() {
        const firstId = this.#touchSequence[0];         // earliest-started finger
        const history = this.#touchHistory.get(firstId);
        if (!history?.x?.length || !history?.y?.length || !history?.t?.length) return 0;

        const n = Math.min(5, history.x.length);
        const xs = history.x.slice(-n);
        const ys = history.y.slice(-n);
        const ts = history.t.slice(-n);

        const time = ts[ts.length - 1] - ts[0];
        if (time === 0) return 0;

        const dist = this._getDistance(xs[0], ys[0], xs[xs.length - 1], ys[ys.length - 1]);
        return dist / time;
    }

    _getDistance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    _getAveragePosition(touches) {
        const len = touches.length;
        let sumX = 0, sumY = 0;

        for (let i = 0; i < len; i++) {
            sumX += touches[i].clientX - this.#areaBox.left;
            sumY += touches[i].clientY - this.#areaBox.top;
        }

        const x = sumX / len;
        const y = sumY / len;

        return {
            x,
            y,
            touchesArr: Array.from(touches).map(t => ({
                x: t.clientX - this.#areaBox.left,
                y: t.clientY - this.#areaBox.top
            }))
        };
    }

    _getScale(distanceStart, distance) {
        return distance / distanceStart;
    }

    _getAngle(prevX, prevY, currX, currY) {
        const dX = currX - prevX;
        const dY = currY - prevY;
        const radians = Math.atan2(dY, dX);
        let angle = radians * 180 / Math.PI + 90;

        if (angle < 0) angle += 360;
        if (angle > 360) angle -= 360;

        return angle;
    }

    _getDirection(prevX, prevY, x, y) {
        const angle = this._getAngle(prevX, prevY, x, y);

        if (angle >= 315 || angle < 45) return 'top';
        if (angle >= 45 && angle < 135) return 'right';
        if (angle >= 135 && angle < 225) return 'bottom';
        if (angle >= 225 && angle < 315) return 'left';
    }

    _calculateRotation(angleAbsolute) {
        if (this.#previousAngle === null) {
            this.#previousAngle = angleAbsolute;
            return;
        }

        if (angleAbsolute - this.#previousAngle <= -180) {
            if (this.#negativeRev) {
                this.#revs = 0;
                this.#negativeRev = false;
            } else {
                this.#revs++;
            }
        } else if (angleAbsolute - this.#previousAngle >= 180) {
            if (this.#revs === 0 && !this.#negativeRev) {
                this.#negativeRev = true;
            } else {
                this.#revs--;
            }
        }

        this.#angleRelative = (this.#negativeRev || this.#revs < 0)
            ? (360 * this.#revs + angleAbsolute) - 360
            : 360 * this.#revs + angleAbsolute;

        this.#previousAngle = angleAbsolute;
    }

    _getPreviousCoordinates(touches, defaultX, defaultY) {
        // Default to start coordinates if no better option
        let prevX = defaultX;
        let prevY = defaultY;

        if (touches.length > 1) { // If we have multiple touches
            let sumPrevX = 0, sumPrevY = 0;
            let count = 0;

            // Check if we have enough history (5 points)
            for (const touch of touches) {
                const h = this.#touchHistory.get(touch.identifier);
                if (h && h.x.length >= 5 && h.y.length >= 5) {
                    sumPrevX += h.x[h.x.length - 5];
                    sumPrevY += h.y[h.y.length - 5];
                    count++;
                }
            }

            // If we have multiple touches with enough history, use their average
            if (count > 0) {
                prevX = sumPrevX / count;
                prevY = sumPrevY / count;
                return { prevX, prevY };
            }

            // If not enough history, use earliest records
            sumPrevX = 0;
            sumPrevY = 0;
            count = 0;

            for (const touch of touches) {
                const h = this.#touchHistory.get(touch.identifier);
                if (h && h.x.length > 0 && h.y.length > 0) {
                    sumPrevX += h.x[0];
                    sumPrevY += h.y[0];
                    count++;
                }
            }

            if (count > 0) {
                prevX = sumPrevX / count;
                prevY = sumPrevY / count;
            }
        } else if (touches.length === 1) { // If we have a single touch
            const touchId = touches[0].identifier;
            const history = this.#touchHistory.get(touchId);

            if (history && history.x.length > 1 && history.y.length > 1) {
                if (history.x.length >= 5) {
                    prevX = history.x[history.x.length - 5];
                    prevY = history.y[history.y.length - 5];
                } else {
                    // If not enough history, use earliest record
                    prevX = history.x[0];
                    prevY = history.y[0];
                }
            }
        }

        return { prevX, prevY };
    }

    _executeCallback(gestureType, params) {
        if (this.#touchHistory.size > 0 && this.#watching[gestureType]) {
            this.#watching[gestureType].apply(this, params);
        }
    }
}

// Add default export for easier importing
export default TheFinger;   