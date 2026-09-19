/**
 * Shared chart tooltip styles - professional white background with Arabic RTL support.
 * Used across all dashboard charts for consistent, readable tooltips.
 */

export const TOOLTIP_CONTENT_STYLE: React.CSSProperties = {
  background: "#ffffff",
  border: "1px solid oklch(0.88 0.04 160)",
  borderRadius: "0.75rem",
  fontSize: "13px",
  color: "oklch(0.18 0.02 160)",
  boxShadow:
    "0 10px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.02)",
  padding: "10px 14px",
  fontFamily: "var(--font-cairo)",
  direction: "rtl",
  textAlign: "right",
  lineHeight: "1.5",
  maxWidth: "280px",
};

export const TOOLTIP_LABEL_STYLE: React.CSSProperties = {
  color: "oklch(0.45 0.13 160)",
  fontWeight: 700,
  marginBottom: "6px",
  paddingBottom: "6px",
  borderBottom: "1px solid oklch(0.92 0.02 160)",
  fontSize: "12px",
  fontFamily: "var(--font-cairo)",
};

export const TOOLTIP_ITEM_STYLE: React.CSSProperties = {
  padding: "3px 0",
  fontSize: "13px",
  color: "oklch(0.25 0.03 160)",
  fontFamily: "var(--font-cairo)",
};

export const TOOLTIP_CURSOR_STYLE = {
  fill: "oklch(0.55 0.16 160 / 0.08)",
  stroke: "oklch(0.55 0.16 160)",
  strokeWidth: 1,
  strokeDasharray: "4 4" as const,
};

export const TOOLTIP_CURSOR_LINE_STYLE = {
  stroke: "oklch(0.55 0.16 160)",
  strokeWidth: 1,
  strokeDasharray: "4 4" as const,
};
