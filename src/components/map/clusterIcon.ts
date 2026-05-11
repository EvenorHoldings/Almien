import L from 'leaflet';

/**
 * Obsidian-Tactical cluster icon factory.
 * Square 0px-radius badge, signal-green count, JetBrains Mono.
 */
export const createTacticalClusterIcon = (cluster: { getChildCount: () => number }) => {
  const count = cluster.getChildCount();
  const size = count < 10 ? 32 : count < 100 ? 38 : 46;

  return L.divIcon({
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        background:#000;
        border:1px solid #7C3AED;
        box-shadow:0 0 0 2px rgba(0,255,133,0.15);
        display:flex;
        align-items:center;
        justify-content:center;
        font-family:'JetBrains Mono', ui-monospace, monospace;
        font-weight:700;
        font-size:${size > 40 ? 13 : 11}px;
        color:#7C3AED;
        letter-spacing:0.05em;
      ">${count}</div>
    `,
    className: 'tactical-cluster',
    iconSize: L.point(size, size),
  });
};
