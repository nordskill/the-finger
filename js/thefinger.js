// Constants
const CONSTANTS = {
    PRESS_TIME: 350, // ms
    DOUBLE_TAP_INTERVAL: 250, // ms
    FLICK_THRESHOLD: 0.75, // drag speed
};

export class TheFinger {
    // Private fields
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
    #touchHistory = [];
    #initialDirection;

    // Public gesture handlers - the single source of truth
    gestures = {
        tap: {
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

        press: {
            start: (touches, timestamp) => {
                if (touches.length !== 1) return;

                this.#pressTimer = setTimeout(() => {
                    this.#gestureType = 'press';
                    this.#currentTouch = { x: this.#startX, y: this.#startY };
                    this._executeCallback('press', [this.#currentTouch]);
                }, CONSTANTS.PRESS_TIME);
            },
            move: () => {
                clearTimeout(this.#pressTimer);
            },
            end: () => {
                clearTimeout(this.#pressTimer);
            }
        },

        drag: {
            start: () => { },
            move: (touches) => {
                if (touches.length !== 1 || this.#gestureType === 'pinch-spread') return null;

                const touch = touches[0];
                const x = touch.clientX - this.#areaBox.left;
                const y = touch.clientY - this.#areaBox.top;

                this.#currentTouch = {
                    x,
                    y,
                    startX: this.#startX,
                    startY: this.#startY,
                    step: this._getStepSpeed(),
                    speed: this._getSpeed(),
                    angle: this._getAngle(this.#startX, this.#startY, x, y)
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
                if (!this.#moving || this.#touchHistory.length === 0) return null;

                const touchHistory = this.#touchHistory[0];
                if (!touchHistory?.x?.length || !touchHistory?.y?.length) return null;

                const xArray = touchHistory.x;
                const yArray = touchHistory.y;

                this.#endX = xArray[xArray.length - 1];
                this.#endY = yArray[yArray.length - 1];

                this.#currentTouch.endX = this.#endX;
                this.#currentTouch.endY = this.#endY;
                this.#currentTouch.speed = this._getSpeed();
                this.#currentTouch.initial_direction = this.#initialDirection;

                if (xArray.length > 1 && yArray.length > 1) {
                    this.#currentTouch.final_direction = this._getDirection(
                        xArray[xArray.length - 2],
                        yArray[yArray.length - 2],
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

        rotate: {
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
                if (touches.length !== 2) return null;

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
                    this.#touchHistory.length === 0) return null;

                this.#currentTouch.end = true;

                return {
                    type: 'pinch-spread',
                    data: this.#currentTouch
                };
            }
        }
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
    }

    off(element) {
        element = element || this.#element;
        element.removeEventListener('touchstart', this._detectGesture);
        element.removeEventListener('touchmove', this._detectGesture);
        element.removeEventListener('touchend', this._detectGesture);
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

    // Protected methods (extensible)
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
        Object.values(this.gestures).forEach(gesture => {
            if (gesture.start) gesture.start(touches, timestamp);
        });
    }

    _handleTouchMove(touches, timestamp) {
        this.#moving = true;
        this._saveToHistory(touches, timestamp);

        // Run all gesture move handlers
        Object.values(this.gestures).forEach(gesture => {
            if (gesture.move) {
                const result = gesture.move(touches, timestamp);
                if (result) {
                    this.#gestureType = result.type;
                    this._executeCallback(result.type, [result.data, this.#touchHistory]);
                }
            }
        });
    }

    _handleTouchEnd(touches, timestamp) {
        // Run all gesture end handlers
        Object.values(this.gestures).forEach(gesture => {
            if (gesture.end) {
                const result = gesture.end(touches, timestamp);
                if (result) {
                    this.#gestureType = result.type;
                    this._executeCallback(result.type, [result.data, this.#touchHistory]);
                }
            }
        });

        if (touches.length === 0) {
            this.#touchHistory = [];
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
        if (!angle) return;

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

        for (const key of Object.keys(touches)) {
            if (!this.#touchHistory[key]) {
                const touch = touches[key];
                this.#startX = touch.clientX - this.#areaBox.left;
                this.#startY = touch.clientY - this.#areaBox.top;
                this.#touchHistory.push(touch);
                this.#touchHistory[key] = {
                    x: [this.#startX],
                    y: [this.#startY],
                    t: [timestamp]
                };
            }
        }
    }

    _saveToHistory(touches, timestamp) {
        if (this.#touchHistory.length === 0) return;

        for (const key of Object.keys(touches)) {
            const history = this.#touchHistory[key];
            if (history) {
                const touch = touches[key];
                history.x.push(touch.clientX - this.#areaBox.left);
                history.y.push(touch.clientY - this.#areaBox.top);
                history.t.push(timestamp);
            }
        }
    }

    _getStepSpeed() {
        let xDelta = 0;
        this.#touchHistory.forEach(touch => {
            if (touch.x?.length > 1) {
                const xArr = touch.x;
                xDelta = Math.abs(xArr[xArr.length - 1] - xArr[xArr.length - 2]);
            }
        });
        return xDelta;
    }

    _getSpeed() {
        const touchHistory = this.#touchHistory[0];
        if (!touchHistory?.x?.length || !touchHistory?.y?.length || !touchHistory?.t?.length) {
            return 0;
        }

        const historySize = Math.min(5, touchHistory.x.length);
        const tailArrayX = touchHistory.x.slice(-historySize);
        const tailArrayY = touchHistory.y.slice(-historySize);
        const tailArrayT = touchHistory.t.slice(-historySize);

        if (tailArrayT.length < 2) return 0;

        const time = tailArrayT[tailArrayT.length - 1] - tailArrayT[0];
        if (time === 0) return 0;

        const distance = this._getDistance(
            tailArrayX[0],
            tailArrayY[0],
            tailArrayX[tailArrayX.length - 1],
            tailArrayY[tailArrayY.length - 1]
        );

        return distance / time;
    }

    _getDistance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    _getScale(distanceStart, distance) {
        return distance / distanceStart;
    }

    _executeCallback(gestureType, params) {
        if (this.#touchHistory.length > 0 && this.#watching[gestureType]) {
            this.#watching[gestureType].apply(this, params);
        }
    }

    _getAngle(sX, sY, eX, eY) {
        const dX = eX - sX;
        const dY = eY - sY;
        const radians = Math.atan2(dY, dX);
        let angle = radians * 180 / Math.PI + 90;

        if (angle < 0) angle += 360;
        if (angle > 360) angle -= 360;

        return angle;
    }

    _getDirection(startX, startY, x, y) {
        const angle = this._getAngle(startX, startY, x, y);

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

}