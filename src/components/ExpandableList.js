"use client";

import { useState } from "react";

export default function ExpandableList({
  items,
  renderItem,
  className,
  style,
  initialLimit = 5,
  as = "div",
  colSpan,
}) {
  const [expanded, setExpanded] = useState(false);
  const visibleItems = expanded ? items : items.slice(0, initialLimit);
  const canExpand = items.length > initialLimit;
  const Container = as;

  const toggle = (
    <button
      type="button"
      className="show-more-button"
      aria-expanded={expanded}
      onClick={() => setExpanded((value) => !value)}
      style={{
        border: "1px solid var(--line)",
        background: "var(--paper)",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        color: "var(--leaf-600)",
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {expanded ? "Show less" : `Show ${items.length - initialLimit} more`}
    </button>
  );

  return (
    <>
      <Container className={className} style={style}>
        {visibleItems.map((item, index) => renderItem(item, index))}
        {canExpand && as === "tbody" && (
          <tr>
            <td colSpan={colSpan} style={{ textAlign: "center", padding: 12 }}>
              {toggle}
            </td>
          </tr>
        )}
      </Container>
      {canExpand && as !== "tbody" && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 12 }}>
          {toggle}
        </div>
      )}
    </>
  );
}
