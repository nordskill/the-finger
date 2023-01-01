import { TheFinger } from './thefinger.js';

const touchArea = document.querySelector('canvas');
const finger = new TheFinger(touchArea, {
    preventDefault: true,
    visualize: true
});

finger.track('tap', gesture => { /* do something*/ });
finger.track('double-tap', gesture => { /* do something*/ });
finger.track('press', gesture => { /* do something*/ });
finger.track('drag', gesture => { console.log(gesture) });
finger.track('rotate', gesture => { /* do something*/ });
finger.track('pinch-spread', gesture => { /* do something*/ });
// finger.track('flick', gesture => {});
// finger.track('pan', gesture => {});
// finger.track('two-finger-tap', gesture => {});