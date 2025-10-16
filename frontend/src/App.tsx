import { useEffect, useRef, useState } from "react";

const MIN_SPEED = 50; // px/sec
const MAX_SPEED = 150; // px/sec
const SAFETY = 6;
const ROT_DEG = 180;
const ROT_RAD = (ROT_DEG * Math.PI) / 180;
const EPS = 0.5; // small nudge so we don't stay exactly on the boundary

export default function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);     // positioned container (translate only)
  const visualRef = useRef<HTMLDivElement | null>(null);  // rotated visual element
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const boundsRef = useRef({ left: 0, top: 0, width: 0, height: 0 });

  // Prevent scheduling multiple refreshes during rapid collisions
  const reloadPendingRef = useRef(false);

  // Message and loading state
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Animation state
  const posRef = useRef({ x: 0, y: 0 });
  const velRef = useRef({ vx: 70, vy: 70 });
  const colorRef = useRef("#ffcc00");
  const textRef = useRef<HTMLDivElement | null>(null); // NEW: ref for the inner text

  // --- new helper: fetch latest message (reusable) ---
  const API_URL =
    import.meta.env.VITE_API_URL && import.meta.env.VITE_API_URL !== "undefined"
      ? import.meta.env.VITE_API_URL
      : "";

  const fetchLatestMessage = async () => {
    try {
      // Use relative path if API_URL is empty (production)
      const url =
        API_URL && API_URL.length > 0
          ? `${API_URL}/api/hello`
          : `/api/hello`;
      const res = await fetch(url);
      if (!res.ok) {
        // Try to parse error as text, fallback to status
        let errText = "";
        try {
          errText = await res.text();
        } catch {}
        throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`);
      }
      const data = await res.json();
      setMessage(data?.message ?? JSON.stringify(data));
    } catch (err: any) {
      console.error("API Error:", err);
      setMessage(`Error: ${err?.message || "Failed to fetch"}`);
      // Optionally retry after delay
      setTimeout(fetchLatestMessage, 5000);
    }
  };

  // --- new helper: softRefresh (fade text only, don't change box motion) ---
  const softRefresh = async () => {
    if (reloadPendingRef.current) return;
    reloadPendingRef.current = true;

    const textEl = textRef.current;
    // fade out text if available
    if (textEl) {
      textEl.style.transition = "opacity 220ms ease";
      textEl.style.opacity = "0";
      // wait for fade out
      await new Promise((r) => setTimeout(r, 240));
    }

    // refresh the message (network fetch)
    await fetchLatestMessage();

    // update color immediately (visual continues rotating/moving)
    const visual = visualRef.current;
    if (visual) (visual.style as any).backgroundColor = colorRef.current;

    // fade text back in
    if (textEl) {
      // small timeout to ensure DOM update applied
      requestAnimationFrame(() => {
        textEl.style.opacity = "1";
      });
      // wait for fade in to finish before allowing next refresh
      await new Promise((r) => setTimeout(r, 260));
    }

    reloadPendingRef.current = false;
  };

  // replace previous inline fetch usage with initial fetch
  useEffect(() => {
    // load once on mount
    (async () => {
      await fetchLatestMessage();
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const randBetween = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    const initSpeed = () => {
      const speed = randBetween(MIN_SPEED, MAX_SPEED);
      const angle = randBetween(0, Math.PI * 2);
      velRef.current.vx = Math.cos(angle) * speed;
      velRef.current.vy = Math.sin(angle) * speed;
    };

    const getViewportRect = () => {
      if (window.visualViewport) {
        const vv = window.visualViewport;
        return { left: vv.offsetLeft, top: vv.offsetTop, width: vv.width, height: vv.height };
      }
      return { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
    };

    // Compute visible intersection between container and viewport
    const updateBounds = () => {
      const container = containerRef.current;
      if (!container) return;
      const crect = container.getBoundingClientRect();
      const vrect = getViewportRect();

      const left = Math.max(crect.left, vrect.left) + SAFETY;
      const top = Math.max(crect.top, vrect.top) + SAFETY;
      const right = Math.min(crect.right, vrect.left + vrect.width) - SAFETY;
      const bottom = Math.min(crect.bottom, vrect.top + vrect.height) - SAFETY;

      boundsRef.current.left = left;
      boundsRef.current.top = top;
      boundsRef.current.width = Math.max(0, right - left);
      boundsRef.current.height = Math.max(0, bottom - top);
    };

    const waitForStableBoxSize = (cb: () => void) => {
      const visual = visualRef.current;
      const container = containerRef.current;
      if (!visual || !container) {
        requestAnimationFrame(() => waitForStableBoxSize(cb));
        return;
      }
      let prevW = visual.offsetWidth;
      let prevH = visual.offsetHeight;
      let tries = 0;
      const check = () => {
        const w = visual.offsetWidth;
        const h = visual.offsetHeight;
        if (w === prevW && h === prevH) {
          cb();
          return;
        }
        prevW = w;
        prevH = h;
        if (++tries > 6) {
          cb();
          return;
        }
        requestAnimationFrame(check);
      };
      requestAnimationFrame(check);
    };

    // Setup ResizeObserver and viewport listeners
    let ro: ResizeObserver | null = null;
    const container = containerRef.current;
    if (container) {
      updateBounds();
      ro = new ResizeObserver(() => {
        updateBounds();
      });
      ro.observe(container);
    }

    const onViewportChange = () => {
      updateBounds();
      // clamp position immediately using visual element sizes (rotated effective bbox)
      const visual = visualRef.current;
      if (!visual) return;
      const bw = visual.offsetWidth || 160;
      const bh = visual.offsetHeight || 160;
      const bwEff = Math.abs(bw * Math.cos(ROT_RAD)) + Math.abs(bh * Math.sin(ROT_RAD));
      const bhEff = Math.abs(bw * Math.sin(ROT_RAD)) + Math.abs(bh * Math.cos(ROT_RAD));
      posRef.current.x = Math.max(0, Math.min(posRef.current.x, Math.max(0, boundsRef.current.width - bwEff)));
      posRef.current.y = Math.max(0, Math.min(posRef.current.y, Math.max(0, boundsRef.current.height - bhEff)));
      // apply translate only to outer box (no rotate here)
      const box = boxRef.current;
      if (box) box.style.transform = `translate(${Math.round(posRef.current.x)}px, ${Math.round(posRef.current.y)}px)`;
    };
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", onViewportChange);
      window.visualViewport.addEventListener("scroll", onViewportChange);
    }

    const setup = () => {
      updateBounds();
      const container = containerRef.current;
      const visual = visualRef.current;
      if (!container || !visual) {
        requestAnimationFrame(setup);
        return;
      }

      const cw = boundsRef.current.width || (getViewportRect().width - SAFETY * 2);
      const ch = boundsRef.current.height || (getViewportRect().height - SAFETY * 2);
      const bw = visual.offsetWidth || 160;
      const bh = visual.offsetHeight || 160;
      const bwEff = Math.abs(bw * Math.cos(ROT_RAD)) + Math.abs(bh * Math.sin(ROT_RAD));
      const bhEff = Math.abs(bw * Math.sin(ROT_RAD)) + Math.abs(bh * Math.cos(ROT_RAD));

      posRef.current.x = randBetween(0, Math.max(0, cw - bwEff));
      posRef.current.y = randBetween(0, Math.max(0, ch - bhEff));
      initSpeed();

      // set initial translate on the outer box
      const box = boxRef.current;
      if (box) box.style.transform = `translate(${Math.round(posRef.current.x)}px, ${Math.round(posRef.current.y)}px)`;

      lastTimeRef.current = null;
      rafRef.current = requestAnimationFrame(step);
    };

    const step = (timestamp: number) => {
      const container = containerRef.current;
      const visual = visualRef.current;
      const box = boxRef.current;
      if (!container || !visual || !box) {
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      if (lastTimeRef.current == null) {
        lastTimeRef.current = timestamp;
        rafRef.current = requestAnimationFrame(step);
        return;
      }
      const dt = Math.min(0.05, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      const cw = boundsRef.current.width || (getViewportRect().width - SAFETY * 2);
      const ch = boundsRef.current.height || (getViewportRect().height - SAFETY * 2);
      const bw = visual.offsetWidth || 160;
      const bh = visual.offsetHeight || 160;
      const bwEff = Math.abs(bw * Math.cos(ROT_RAD)) + Math.abs(bh * Math.sin(ROT_RAD));
      const bhEff = Math.abs(bw * Math.sin(ROT_RAD)) + Math.abs(bh * Math.cos(ROT_RAD));

      posRef.current.x += velRef.current.vx * dt;
      posRef.current.y += velRef.current.vy * dt;

      let collided = false;

      if (posRef.current.x < 0) {
        posRef.current.x = EPS;
        velRef.current.vx = Math.abs(velRef.current.vx) || MIN_SPEED;
        collided = true;
      }
      if (posRef.current.x > cw - bwEff) {
        posRef.current.x = Math.max(0, cw - bwEff - EPS);
        velRef.current.vx = -Math.abs(velRef.current.vx) || -MIN_SPEED;
        collided = true;
      }
      if (posRef.current.y < 0) {
        posRef.current.y = EPS;
        velRef.current.vy = Math.abs(velRef.current.vy) || MIN_SPEED;
        collided = true;
      }
      if (posRef.current.y > ch - bhEff) {
        posRef.current.y = Math.max(0, ch - bhEff - EPS);
        velRef.current.vy = -Math.abs(velRef.current.vy) || -MIN_SPEED;
        collided = true;
      }

      if (collided) {
        const randColor = () =>
          "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
        colorRef.current = randColor();
        const speed = Math.hypot(velRef.current.vx, velRef.current.vy);
        let newSpeed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
        const angle = Math.atan2(velRef.current.vy, velRef.current.vx) + (Math.random() - 0.5) * 0.12;
        // Enforce minimum speed to avoid near-zero velocities
        if (newSpeed < MIN_SPEED) newSpeed = MIN_SPEED;
        velRef.current.vx = Math.cos(angle) * newSpeed;
        velRef.current.vy = Math.sin(angle) * newSpeed;
        // Reload once when an edge is hit (small delay so color change is visible)
        softRefresh();
      }

      // update outer translation (position)
      if (box) box.style.transform = `translate(${Math.round(posRef.current.x)}px, ${Math.round(posRef.current.y)}px)`;
      // update visual color and rotation (visual handles rotation)
      if (visual) {
        visual.style.transform = `rotate(${ROT_DEG}deg)`;
        (visual.style as any).backgroundColor = colorRef.current;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    // start once visual size stabilizes
    waitForStableBoxSize(() => {
      updateBounds();
      rafRef.current = requestAnimationFrame(() => setup());
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", onViewportChange);
        window.visualViewport.removeEventListener("scroll", onViewportChange);
      }
      if (ro) ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // outer box is the positioned container (translate only)
  const boxStyle: React.CSSProperties = {
    position: "absolute",
    width: "auto",
    height: "auto",
    left: 0,
    top: 0,
    willChange: "transform",
  };

  // visual square (rotated), text inside will be unrotated (counter-rotation)
  const visualStyle: React.CSSProperties = {
    width: 160,
    height: 160,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontWeight: 700,
    boxShadow: "0 10px 28px rgba(0,0,0,0.35)",
    padding: "8px 12px",
    userSelect: "none",
    cursor: "default",
    transition: "background-color 120ms linear, transform 80ms linear",
    transformOrigin: "center center",
  };

  const textStyle: React.CSSProperties = {
    transform: `rotate(-${ROT_DEG}deg)`, // counter-rotate so text is upright
    whiteSpace: "nowrap",
    fontSize: 16,
    opacity: 1, // initial
    transition: "opacity 220ms ease" // NEW: smooth fade
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        background: "radial-gradient(circle at 20% 20%, #0f172a, #020617 60%)",
      }}
    >
      <div style={{ position: "absolute", top: 16, left: 16, color: "#ffffff", fontSize: 13 }}>
        getService build in progress
      </div>

      {/* outer positioned container (translate applied here) */}
      <div ref={boxRef} style={boxStyle} aria-live="polite">
        {/* rotated visual */}
        <div ref={visualRef} style={visualStyle}>
          {/* inner text: attach ref so softRefresh can fade it */}
          <div ref={textRef} style={textStyle}>
            {loading ? "Loading…" : message}
          </div>
        </div>
      </div>
    </div>
  );
}
