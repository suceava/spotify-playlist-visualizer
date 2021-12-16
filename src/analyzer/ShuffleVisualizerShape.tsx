export function ShuffleVisualizerShape(props: any) {
  const { cx, cy, fill, track } = props;
  if (!cx || !cy) {
    return null;
  }

  return (
    <>
      <defs>
        <clipPath id={`clipPath-${cy}`}>
          <circle cx={cx} cy={cy} r={24} />
        </clipPath>
      </defs>
    <circle
      cx={cx}
      cy={cy}
      r={26}
      fill={fill}
    />
      <image
        xlinkHref={track.album.images[0].url}
        x={cx - 24}
        y={cy - 24}
        clipPath={`url(#clipPath-${cy})`}
        width={48}
        height={48}
      />
    </>
  );
}
