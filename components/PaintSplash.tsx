type PaintSplashProps = {
  color: "ember" | "tidewater" | "marigold" | "plum" | "skyburst";
  className?: string;
};

const colorMap: Record<PaintSplashProps["color"], string> = {
  ember: "#FF4D3D",
  tidewater: "#0A6E6B",
  marigold: "#F4B400",
  plum: "#6A2C70",
  skyburst: "#2E6BE6",
};

// A hand-drawn-feeling splash shape. Rendered behind cards/headlines as the
// site's signature recurring motif — never as a full background, always a
// bleed of color at the edge of something.
export default function PaintSplash({ color, className = "" }: PaintSplashProps) {
  const fill = colorMap[color];
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M62 138C40 96 78 44 128 36C168 29 186 62 224 54C270 45 292 4 336 18C384 34 392 92 372 132C356 164 312 158 296 192C280 226 312 264 288 298C262 334 208 328 176 306C144 284 148 244 116 224C80 202 34 202 22 164C14 150 50 158 62 138Z"
        fill={fill}
      />
    </svg>
  );
}
