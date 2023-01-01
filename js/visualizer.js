const canvas = document.querySelector('canvas');
let elem = canvas.getBoundingClientRect();
enableVisualization();

function enableVisualization() {
    visualization = true;
    pixelRatio = window.devicePixelRatio;
    canvas.width = elem.width * pixelRatio;
    canvas.height = elem.height * pixelRatio;
    ctx = canvas.getContext('2d');
    window.addEventListener('resize', () => elem = canvas.getBoundingClientRect());
}
function visualize(touches) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (touches.length > 1) {
        ctx.beginPath();
        ctx.lineWidth = 8;
        ctx.moveTo((touches[0].clientX - elem.left) * pixelRatio, (touches[0].clientY - elem.top) * pixelRatio);
        ctx.lineTo((touches[1].clientX - elem.left) * pixelRatio, (touches[1].clientY - elem.top) * pixelRatio);
        ctx.strokeStyle = '#FFF';
        ctx.stroke();
    }

    ctx.beginPath();
    for (let i = 0; i < touches.length; i++) {
        ctx.arc((touches[i].clientX - elem.left) * pixelRatio, (touches[i].clientY - elem.top) * pixelRatio, 25 * pixelRatio, 0, 2 * Math.PI);
    }
    ctx.fillStyle = '#FFF';
    ctx.fill();

}
