import { useEffect, useRef } from 'react';

const DotMatrix = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let time = 0;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const drawDots = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const spacing = 35; // Slightly reduced spacing
            
            for (let x = 0; x < canvas.width; x += spacing) {
                for (let y = 0; y < canvas.height; y += spacing) {
                    // Increased amplitude of movement
                    const offsetX = Math.sin(time + y * 0.03) * 3;
                    const offsetY = Math.cos(time + x * 0.03) * 3;
                    
                    // Calculate distance from center for size variation
                    const centerX = canvas.width / 2;
                    const centerY = canvas.height / 2;
                    const distance = Math.sqrt(
                        Math.pow(x - centerX, 2) + 
                        Math.pow(y - centerY, 2)
                    );
                    const maxDistance = Math.sqrt(
                        Math.pow(canvas.width / 2, 2) + 
                        Math.pow(canvas.height / 2, 2)
                    );
                    const size = 1.5 + (1.5 * (1 - distance / maxDistance));
                    
                    ctx.beginPath();
                    ctx.arc(x + offsetX, y + offsetY, size, 0, Math.PI * 2);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.fill();
                }
            }

            time += 0.01;
            animationFrameId = requestAnimationFrame(drawDots);
        };

        resize();
        drawDots();

        window.addEventListener('resize', resize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 -z-10"
        />
    );
};

export default DotMatrix;