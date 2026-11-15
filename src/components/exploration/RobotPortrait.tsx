import { useEffect, useRef } from 'react';

interface RobotPortraitProps {
  className?: string;
  size?: number;
}

const FRAME_WIDTH = 192;
const FRAME_HEIGHT = 256;

/** First robot spritesheet frame, with the JPEG's magenta key removed. */
export function RobotPortrait({ className, size = 72 }: RobotPortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;

    const image = new Image();
    image.src = '/assets/characters/robot.jpeg';
    image.onload = () => {
      context.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      context.drawImage(image, 0, 0, FRAME_WIDTH, FRAME_HEIGHT, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      const pixels = context.getImageData(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      for (let index = 0; index < pixels.data.length; index += 4) {
        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];
        if (red > 185 && blue > 130 && green < 105 && red > green * 1.8) pixels.data[index + 3] = 0;
      }
      context.putImageData(pixels, 0, 0);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={FRAME_WIDTH}
      height={FRAME_HEIGHT}
      style={{ width: size, height: size, objectFit: 'contain' }}
      aria-label="Robô explorador"
    />
  );
}
