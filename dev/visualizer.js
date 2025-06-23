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

    // Draw lines connecting all touch points
    if (touches.length > 1) {
        for (let i = 0; i < touches.length; i++) {
            for (let j = i + 1; j < touches.length; j++) {
                const x1 = (touches[i].clientX - elem.left) * pixelRatio;
                const y1 = (touches[i].clientY - elem.top) * pixelRatio;
                const x2 = (touches[j].clientX - elem.left) * pixelRatio;
                const y2 = (touches[j].clientY - elem.top) * pixelRatio;

                ctx.beginPath();
                ctx.lineWidth = 8;
                ctx.strokeStyle = '#FFF';
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        }
    }

    // Draw all touch points as circles
    for (let i = 0; i < touches.length; i++) {
        const x = (touches[i].clientX - elem.left) * pixelRatio;
        const y = (touches[i].clientY - elem.top) * pixelRatio;

        ctx.beginPath();
        ctx.fillStyle = '#FFF';
        ctx.arc(x, y, 25 * pixelRatio, 0, 2 * Math.PI);
        ctx.fill();
    }
}