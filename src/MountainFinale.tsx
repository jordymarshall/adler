import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowUpRight } from "lucide-react";

export function MountainFinale() {
  const section = useRef<HTMLElement>(null);
  const landscape = useRef<SVGSVGElement>(null);
  const [scene, setScene] = useState("static");
  useEffect(() => {
    const motion = matchMedia(
      "(min-width: 900px) and (min-height: 700px) and (prefers-reduced-motion: no-preference)",
    );
    let frame = 0;
    function update() {
      frame = 0;
      const node = section.current!;
      const box = node.getBoundingClientRect();
      const progress = motion.matches
        ? Math.min(1, Math.max(0, -box.top / (box.height - innerHeight)))
        : 1;
      node.style.setProperty("--descent", String(progress));
      if (motion.matches) {
        const travel = Math.min(1, Math.max(0, (progress - 0.1) / 0.8));
        const eased = travel * travel * (3 - 2 * travel);
        const close = Math.min(1, Math.max(0, (travel - 0.65) / 0.35));
        const height = 950 - close * 300;
        const width = (height * innerWidth) / innerHeight;
        const centerX =
          800 +
          Math.sin(travel * Math.PI * 2) * Math.sin(travel * Math.PI) * 90;
        const centerY = 430 + eased * 1810;
        landscape.current!.setAttribute(
          "viewBox",
          `${centerX - width / 2} ${centerY - height / 2} ${width} ${height}`,
        );
      } else landscape.current!.setAttribute("viewBox", "0 0 1600 2450");
      setScene(
        !motion.matches
          ? "static"
          : progress >= 0.9
            ? "seed"
            : progress > 0.16
              ? "descent"
              : "summit",
      );
    }
    function queue() {
      if (!frame) frame = requestAnimationFrame(update);
    }
    update();
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    motion.addEventListener("change", queue);
    return () => {
      removeEventListener("scroll", queue);
      removeEventListener("resize", queue);
      motion.removeEventListener("change", queue);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <section
      className="mountain-finale"
      ref={section}
      data-scene={scene}
      aria-label="From your someday to a first step"
    >
      <div className="mountain-stage">
        <svg
          className="mountain-landscape"
          ref={landscape}
          viewBox="0 0 1600 2450"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="mountain-sky" x2="0" y2="1">
              <stop stopColor="#f4f3e9" />
              <stop offset="1" stopColor="#e4e9d5" />
            </linearGradient>
            <linearGradient id="mountain-face" x1=".2" y1="0" x2=".8" y2="1">
              <stop stopColor="#9ca98a" />
              <stop offset=".5" stopColor="#748368" />
              <stop offset="1" stopColor="#bec7a6" />
            </linearGradient>
            <linearGradient id="mountain-shadow" x2=".7" y2="1">
              <stop stopColor="#475f50" />
              <stop offset="1" stopColor="#8e9c79" />
            </linearGradient>
            <linearGradient id="mountain-earth" x2="0" y2="1">
              <stop stopColor="#e5e5cb" />
              <stop offset="1" stopColor="#eee3ce" />
            </linearGradient>
            <radialGradient id="seed-light">
              <stop stopColor="#fff9df" stopOpacity=".9" />
              <stop offset="1" stopColor="#fff9df" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="seed-shell" x2="1" y2="1">
              <stop stopColor="#b98b50" />
              <stop offset=".5" stopColor="#895d35" />
              <stop offset="1" stopColor="#62482e" />
            </linearGradient>
          </defs>
          <rect
            x="-1000"
            y="-1000"
            width="3600"
            height="5000"
            fill="url(#mountain-sky)"
          />
          <circle cx="1150" cy="215" r="125" fill="#e7dec3" opacity=".6" />
          <path
            d="M-400 1400L-40 830L140 1000L405 590L600 810L930 430L1270 890L1520 620L1970 1340V2200H-400Z"
            fill="#c7cfb8"
          />
          <path
            d="M-400 1590L60 1120L310 1290L590 880L760 1080L1110 780L1350 1050L1700 930L1970 1570V2300H-400Z"
            fill="#aebb9f"
          />
          <path
            d="M-500 2340Q-80 1750 220 1350L490 870L650 540L800 265L948 555L1135 870Q1370 1250 1710 1640L2130 2370Z"
            fill="url(#mountain-face)"
          />
          <path
            d="M800 265L755 680L848 865L686 1160L760 1480L370 1840L-300 2350L-500 2340Q-80 1750 220 1350L490 870L650 540Z"
            fill="url(#mountain-shadow)"
          />
          <path
            d="M800 265L948 555L1135 870L950 730L880 740L842 515L790 567Z"
            fill="#f2f0df"
          />
          <path d="M800 265L755 680L708 623L669 710L650 540Z" fill="#dce3d0" />
          <path
            d="M842 515L895 886L1035 1000L1170 1320L1430 1510L1050 1220L850 1000L790 750Z"
            fill="#bac4a5"
            opacity=".7"
          />
          <path
            d="M650 735L480 1110L550 1235L295 1670L485 1480L605 1190L555 1040Z"
            fill="#536c59"
            opacity=".6"
          />
          <path
            d="M815 1055L860 1370L670 1630L740 1810L900 1610L940 1380Z"
            fill="#d1d5b6"
            opacity=".45"
          />
          <g fill="none" stroke="#d4dcc1" strokeWidth="2" opacity=".35">
            <path d="M95 1530Q300 1470 466 1240T711 875" />
            <path d="M-10 1740Q285 1680 485 1430T766 1140" />
            <path d="M-90 1930Q190 1830 450 1680T850 1320" />
            <path d="M1040 920Q1070 1210 1285 1380T1570 1600" />
            <path d="M960 1200Q1180 1520 1400 1620T1710 1920" />
            <path d="M310 2020Q730 1680 1000 1750T1540 2060" />
          </g>
          <path
            d="M-1000 2080Q-10 1770 370 1820T1050 1900T2400 1720V3600H-1000Z"
            fill="#bbc7a0"
          />
          <path
            d="M-1000 2150Q-60 1990 470 1950T1140 2050T2600 1830V3600H-1000Z"
            fill="url(#mountain-earth)"
          />
          <g
            fill="none"
            stroke="#f4eccb"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path
              d="M805 360C835 460 941 489 930 620S686 737 716 895S1070 972 1042 1120"
              strokeWidth="24"
            />
            <path
              d="M1042 1120C1010 1270 667 1280 640 1430S976 1530 976 1670"
              strokeWidth="17"
            />
            <path
              d="M976 1670C978 1810 689 1827 710 1920S838 1970 816 2037"
              strokeWidth="10"
            />
            <path
              d="M816 2037Q791 2080 800 2110"
              strokeWidth="4"
              stroke="#a28c5e"
            />
          </g>
          <g fill="#f4eccb" stroke="#788660" strokeWidth="3">
            <circle cx="716" cy="895" r="13" />
            <circle cx="640" cy="1430" r="11" />
            <circle cx="710" cy="1920" r="8" />
          </g>
          <g fill="#566e52" opacity=".65">
            <path d="M300 1710L319 1665L340 1710H326L347 1740H295L313 1710Z" />
            <path d="M1190 1760L1212 1704L1239 1760H1220L1248 1794H1180L1201 1760Z" />
            <path d="M1120 1728L1136 1690L1152 1728H1142L1160 1754H1116L1130 1728Z" />
          </g>
          <ellipse
            cx="800"
            cy="2160"
            rx="240"
            ry="190"
            fill="url(#seed-light)"
          />
          <g
            className="mountain-roots"
            fill="none"
            stroke="#b79c6c"
            strokeLinecap="round"
          >
            <path d="M800 2155Q816 2215 800 2275T819 2335" strokeWidth="3" />
            <path
              d="M806 2190Q756 2187 737 2230T687 2260M801 2220Q850 2212 871 2254T920 2290M799 2265Q762 2272 748 2310M810 2301Q855 2297 870 2330"
              strokeWidth="2"
            />
            <path
              d="M751 2207L704 2209M731 2237L725 2278M860 2236L901 2230M878 2265L879 2300M768 2290L725 2293"
              strokeWidth="1.3"
            />
          </g>
          <g className="mountain-seed">
            <path
              d="M800 2098C761 2114 762 2160 800 2174C837 2155 837 2113 800 2098Z"
              fill="url(#seed-shell)"
            />
            <path
              d="M800 2106Q784 2141 800 2167"
              fill="none"
              stroke="#d7b77b"
              strokeWidth="2"
            />
            <path
              d="M800 2105Q793 2082 804 2063"
              stroke="#658251"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M801 2074Q770 2073 772 2048Q800 2048 801 2074Z"
              fill="#8b9d62"
            />
            <path
              d="M799 2080Q828 2059 835 2080Q817 2093 799 2080Z"
              fill="#657f50"
            />
          </g>
        </svg>
        <div className="mountain-summit-copy" aria-hidden={scene === "seed"}>
          <span className="section-kicker">A GOAL THAT MATTERS TO YOU</span>
          <h2>Your someday.</h2>
          <span className="mountain-scroll-hint">
            Every path has a beginning <ArrowDown size={16} />
          </span>
        </div>
        <div
          className="mountain-seed-copy"
          inert={scene !== "seed" && scene !== "static"}
          aria-hidden={scene !== "seed" && scene !== "static"}
        >
          <h2>Let’s give it a start.</h2>
          <p>One goal. One manageable first step.</p>
          <Link className="btn dark" to="/app/goals/new">
            Take your first step <ArrowUpRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
