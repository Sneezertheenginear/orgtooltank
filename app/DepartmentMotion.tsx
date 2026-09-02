"use client";

type DepartmentMotionProps = {
  type:
    | "electronics"
    | "desktop"
    | "music"
    | "trucking"
    | "organizations"
    | "warehouse"
    | "researcher"
    | "apparel"
    | "cybersecurity";
};

export default function DepartmentMotion({ type }: DepartmentMotionProps) {
  if (type === "electronics") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-[30%] h-px w-[18%] bg-white/10" />
        <div className="absolute right-[8%] top-[55%] h-px w-[18%] bg-white/10" />

        <div className="absolute left-[18%] top-[30%] h-2 w-2 rounded-full bg-cyan-300/70 animate-pulse" />
        <div className="absolute right-[18%] top-[55%] h-2 w-2 rounded-full bg-orange-300/70 animate-pulse" />
      </div>
    );
  }

  if (type === "desktop") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* soft window shapes */}
        <div className="absolute left-[4%] top-[28%] h-24 w-32 rounded-xl border border-black/10 bg-white/25" />
        <div className="absolute left-[14%] top-[50%] h-16 w-24 rounded-lg border border-black/10 bg-white/20" />
        <div className="absolute right-[8%] top-[36%] h-20 w-28 rounded-xl border border-black/10 bg-white/20" />

        {/* file lines */}
        <div className="absolute left-[8%] top-[38%] h-px w-16 bg-black/15" />
        <div className="absolute left-[8%] top-[42%] h-px w-12 bg-black/10" />

        {/* moving scan line */}
        <div className="desktop-scan absolute left-0 top-[55%] h-px w-[24%] bg-black/25" />

        <style>{`
          @keyframes desktopScan {
            0% {
              transform: translateX(-120%);
              opacity: 0;
            }

            15% {
              opacity: 1;
            }

            85% {
              opacity: 1;
            }

            100% {
              transform: translateX(520%);
              opacity: 0;
            }
          }

          .desktop-scan {
            animation: desktopScan 7s linear infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .desktop-scan {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }

  if (type === "music") {
    const bars = [20, 36, 58, 32, 72, 46, 64, 28, 50, 38, 68, 30, 54];

    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center gap-2 opacity-[0.14]">
          {bars.map((height, index) => (
            <div
              key={index}
              className="music-bar w-1 rounded-full bg-black/70"
              style={{
                height: `${height}px`,
                animationDelay: `${index * 0.1}s`,
              }}
            />
          ))}
        </div>

        <div className="absolute left-[8%] top-[64%] h-px w-[84%] bg-black/[0.06]" />

        <style>{`
          @keyframes musicWave {
            0%,
            100% {
              transform: scaleY(0.45);
              opacity: 0.35;
            }

            50% {
              transform: scaleY(1);
              opacity: 1;
            }
          }

          .music-bar {
            transform-origin: center;
            animation: musicWave 1.4s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .music-bar {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }

  if (type === "trucking") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* main route */}
        <div className="absolute left-[8%] top-[52%] h-px w-[84%] bg-black/10" />

        {/* secondary route */}
        <div className="absolute left-[22%] top-[35%] h-px w-[28%] rotate-[8deg] bg-black/[0.07]" />
        <div className="absolute right-[18%] top-[63%] h-px w-[24%] -rotate-[10deg] bg-black/[0.07]" />

        {/* checkpoints */}
        <div className="truck-stop truck-stop-1 absolute left-[20%] top-[calc(52%-5px)] h-3 w-3 rounded-full border border-black/15 bg-white" />
        <div className="truck-stop truck-stop-2 absolute left-[48%] top-[calc(52%-5px)] h-3 w-3 rounded-full border border-black/15 bg-white" />
        <div className="truck-stop truck-stop-3 absolute right-[18%] top-[calc(52%-5px)] h-3 w-3 rounded-full border border-black/15 bg-white" />

        {/* moving load signal */}
        <div className="truck-load absolute left-[8%] top-[calc(52%-4px)] h-2 w-7 rounded-full bg-orange-400/55" />

        {/* small tracking signal */}
        <div className="truck-signal absolute left-[12%] top-[34%] h-2 w-2 rounded-full bg-blue-400/55" />

        <style>{`
        @keyframes truckMove {
          0% {
            transform: translateX(0);
            opacity: 0;
          }

          10% {
            opacity: 0.9;
          }

          90% {
            opacity: 0.9;
          }

          100% {
            transform: translateX(900px);
            opacity: 0;
          }
        }

        @keyframes truckStopPulse {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.3);
            opacity: 0.8;
          }
        }

        @keyframes truckSignal {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.3;
          }

          50% {
            transform: translateY(-8px);
            opacity: 0.75;
          }
        }

        .truck-load {
          animation: truckMove 8s linear infinite;
        }

        .truck-stop {
          animation: truckStopPulse 3s ease-in-out infinite;
        }

        .truck-stop-2 {
          animation-delay: 0.8s;
        }

        .truck-stop-3 {
          animation-delay: 1.6s;
        }

        .truck-signal {
          animation: truckSignal 4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .truck-load,
          .truck-stop,
          .truck-signal {
            animation: none;
          }
        }
      `}</style>
      </div>
    );
  }

  if (type === "organizations") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* document */}
        <div className="org-document absolute left-[9%] top-[24%] h-28 w-20 rounded-lg border border-black/15 bg-white/40">
          <div className="absolute left-4 top-7 h-px w-12 bg-black/20" />
          <div className="absolute left-4 top-11 h-px w-9 bg-black/15" />
          <div className="absolute left-4 top-15 h-px w-11 bg-black/15" />
        </div>

        {/* center organization node */}
        <div className="org-center absolute right-[22%] top-[43%] h-4 w-4 rounded-full border border-black/20 bg-black/20" />

        {/* outer people */}
        <div className="org-node org-node-1 absolute right-[12%] top-[25%] h-3 w-3 rounded-full bg-black/20" />
        <div className="org-node org-node-2 absolute right-[8%] top-[58%] h-3 w-3 rounded-full bg-black/20" />
        <div className="org-node org-node-3 absolute right-[32%] top-[65%] h-3 w-3 rounded-full bg-black/20" />

        {/* connections */}
        <div className="absolute right-[14%] top-[35%] h-px w-[12%] rotate-[35deg] bg-black/10" />
        <div className="absolute right-[12%] top-[52%] h-px w-[12%] -rotate-[25deg] bg-black/10" />
        <div className="absolute right-[22%] top-[57%] h-px w-[13%] rotate-[35deg] bg-black/10" />

        {/* moving workflow dots */}
        <div className="org-flow org-flow-1 absolute left-[28%] top-[37%] h-2 w-2 rounded-full bg-blue-400/60" />
        <div className="org-flow org-flow-2 absolute left-[28%] top-[50%] h-2 w-2 rounded-full bg-emerald-400/55" />

        <style>{`
        @keyframes orgDocumentFloat {
          0%, 100% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes orgNodePulse {
          0%, 100% {
            transform: scale(0.8);
            opacity: 0.25;
          }

          50% {
            transform: scale(1.35);
            opacity: 0.8;
          }
        }

        @keyframes orgCenterPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.35);
            opacity: 0.7;
          }
        }

        @keyframes orgWorkflow {
          0% {
            transform: translateX(0);
            opacity: 0;
          }

          15% {
            opacity: 0.8;
          }

          85% {
            opacity: 0.8;
          }

          100% {
            transform: translateX(650px);
            opacity: 0;
          }
        }

        .org-document {
          animation: orgDocumentFloat 6s ease-in-out infinite;
        }

        .org-center {
          animation: orgCenterPulse 2.6s ease-in-out infinite;
        }

        .org-node {
          animation: orgNodePulse 3s ease-in-out infinite;
        }

        .org-node-2 {
          animation-delay: 0.8s;
        }

        .org-node-3 {
          animation-delay: 1.6s;
        }

        .org-flow {
          animation: orgWorkflow 8s linear infinite;
        }

        .org-flow-2 {
          animation-delay: 3.5s;
        }

        @media (prefers-reduced-motion: reduce) {
          .org-document,
          .org-center,
          .org-node,
          .org-flow {
            animation: none;
          }
        }
      `}</style>
      </div>
    );
  }

  if (type === "warehouse") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Shelf lines */}
        <div className="absolute left-[8%] right-[8%] top-[30%] h-px bg-black/10" />
        <div className="absolute left-[8%] right-[8%] top-[62%] h-px bg-black/10" />

        {/* Warehouse boxes */}
        {[
          { left: "12%", top: "18%", delay: "0s" },
          { left: "28%", top: "18%", delay: "0.6s" },
          { left: "44%", top: "18%", delay: "1.2s" },
          { left: "60%", top: "18%", delay: "1.8s" },
          { left: "76%", top: "18%", delay: "2.4s" },

          { left: "20%", top: "50%", delay: "0.3s" },
          { left: "36%", top: "50%", delay: "0.9s" },
          { left: "52%", top: "50%", delay: "1.5s" },
          { left: "68%", top: "50%", delay: "2.1s" },
        ].map((box, index) => (
          <div
            key={index}
            className="warehouse-box absolute h-8 w-10 rounded-md border border-black/20 bg-black/[0.03]"
            style={{
              left: box.left,
              top: box.top,
              animationDelay: box.delay,
            }}
          >
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black/10" />
            <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-black/10" />
          </div>
        ))}

        {/* Moving scanner beam */}
        <div className="warehouse-scan absolute left-[8%] top-[42%] h-px w-[14%] bg-amber-500/60 shadow-[0_0_8px_rgba(245,158,11,0.45)]" />

        {/* Moving package */}
        <div className="warehouse-package absolute bottom-[14%] left-[10%]">
          <div className="relative h-9 w-11 rounded-md border border-black/25 bg-white/60 shadow-sm">
            <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-black/10" />
          </div>
        </div>

        <style jsx>{`
          .warehouse-box {
            animation: warehousePulse 3.4s ease-in-out infinite;
          }

          .warehouse-scan {
            animation: warehouseScan 5s ease-in-out infinite;
          }

          .warehouse-package {
            animation: warehouseMove 7s ease-in-out infinite;
          }

          @keyframes warehousePulse {
            0%,
            100% {
              opacity: 0.35;
              transform: translateY(0);
            }

            50% {
              opacity: 0.8;
              transform: translateY(-3px);
            }
          }

          @keyframes warehouseScan {
            0% {
              transform: translateX(0);
              opacity: 0;
            }

            15% {
              opacity: 1;
            }

            80% {
              opacity: 1;
            }

            100% {
              transform: translateX(520%);
              opacity: 0;
            }
          }

          @keyframes warehouseMove {
            0% {
              transform: translateX(0);
              opacity: 0;
            }

            10% {
              opacity: 1;
            }

            90% {
              opacity: 1;
            }

            100% {
              transform: translateX(620%);
              opacity: 0;
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .warehouse-box,
            .warehouse-scan,
            .warehouse-package {
              animation: none;
            }
          }
        `}</style>
      </div>
    );
  }

  if (type === "researcher") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* source nodes */}
        <div className="research-node research-node-1 absolute left-[14%] top-[28%] h-3 w-3 rounded-full bg-blue-400/55" />
        <div className="research-node research-node-2 absolute left-[34%] top-[48%] h-3 w-3 rounded-full bg-black/25" />
        <div className="research-node research-node-3 absolute left-[58%] top-[30%] h-3 w-3 rounded-full bg-emerald-400/50" />
        <div className="research-node research-node-4 absolute right-[16%] top-[55%] h-3 w-3 rounded-full bg-orange-400/50" />

        {/* connection paths */}
        <div className="absolute left-[14%] top-[31%] h-px w-[22%] rotate-[18deg] bg-black/10" />
        <div className="absolute left-[34%] top-[45%] h-px w-[25%] -rotate-[15deg] bg-black/10" />
        <div className="absolute right-[16%] top-[44%] h-px w-[27%] rotate-[18deg] bg-black/10" />

        {/* document / source card */}
        <div className="research-card absolute right-[10%] top-[20%] h-24 w-32 rounded-xl border border-black/10 bg-white/45 shadow-sm">
          <div className="absolute left-4 top-5 h-px w-20 bg-black/20" />
          <div className="absolute left-4 top-9 h-px w-16 bg-black/15" />
          <div className="absolute left-4 top-13 h-px w-12 bg-black/10" />
        </div>

        {/* moving evidence signal */}
        <div className="research-flow absolute left-[10%] top-[66%] h-2 w-2 rounded-full bg-violet-400/60" />

        {/* scanning line */}
        <div className="research-scan absolute left-[8%] top-[72%] h-px w-[18%] bg-black/20" />

        <style>{`
        @keyframes researchPulse {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.3;
          }

          50% {
            transform: scale(1.35);
            opacity: 0.85;
          }
        }

        @keyframes researchCardFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes researchFlow {
          0% {
            transform: translateX(0);
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          85% {
            opacity: 1;
          }

          100% {
            transform: translateX(750px);
            opacity: 0;
          }
        }

        @keyframes researchScan {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }

          20% {
            opacity: 0.7;
          }

          80% {
            opacity: 0.7;
          }

          100% {
            transform: translateX(620%);
            opacity: 0;
          }
        }

        .research-node {
          animation: researchPulse 3s ease-in-out infinite;
        }

        .research-node-2 {
          animation-delay: 0.7s;
        }

        .research-node-3 {
          animation-delay: 1.4s;
        }

        .research-node-4 {
          animation-delay: 2.1s;
        }

        .research-card {
          animation: researchCardFloat 6s ease-in-out infinite;
        }

        .research-flow {
          animation: researchFlow 8s linear infinite;
        }

        .research-scan {
          animation: researchScan 7s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .research-node,
          .research-card,
          .research-flow,
          .research-scan {
            animation: none;
          }
        }
      `}</style>
      </div>
    );
  }

  if (type === "apparel") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* fabric grid */}
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />

        {/* shirt outline */}
        <div className="apparel-shirt absolute left-[14%] top-[22%]">
          <div className="relative h-24 w-20 rounded-lg border border-black/15 bg-white/35">
            <div className="absolute -left-5 top-3 h-8 w-7 rotate-[28deg] rounded-md border border-black/10 bg-white/25" />
            <div className="absolute -right-5 top-3 h-8 w-7 -rotate-[28deg] rounded-md border border-black/10 bg-white/25" />
            <div className="absolute left-1/2 top-0 h-5 w-8 -translate-x-1/2 rounded-b-full border-x border-b border-black/10" />
          </div>
        </div>

        {/* design swatches */}
        <div className="apparel-swatch apparel-swatch-1 absolute left-[42%] top-[32%] h-8 w-8 rounded-md bg-blue-400/35" />
        <div className="apparel-swatch apparel-swatch-2 absolute left-[52%] top-[47%] h-8 w-8 rounded-md bg-orange-400/35" />
        <div className="apparel-swatch apparel-swatch-3 absolute left-[62%] top-[28%] h-8 w-8 rounded-md bg-emerald-400/30" />

        {/* moving design line */}
        <div className="apparel-thread absolute left-[30%] top-[65%] h-px w-[16%] bg-black/20" />

        {/* tag */}
        <div className="apparel-tag absolute right-[12%] top-[38%] h-14 w-20 rounded-md border border-black/10 bg-white/40 shadow-sm">
          <div className="absolute left-3 top-4 h-px w-12 bg-black/15" />
          <div className="absolute left-3 top-7 h-px w-8 bg-black/10" />
        </div>

        <style>{`
        @keyframes apparelFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes apparelPulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.35;
          }

          50% {
            transform: scale(1.15);
            opacity: 0.8;
          }
        }

        @keyframes apparelThread {
          0% {
            transform: translateX(0);
            opacity: 0;
          }

          15% {
            opacity: 0.8;
          }

          85% {
            opacity: 0.8;
          }

          100% {
            transform: translateX(520%);
            opacity: 0;
          }
        }

        @keyframes apparelTag {
          0%,
          100% {
            transform: rotate(-2deg);
          }

          50% {
            transform: rotate(2deg);
          }
        }

        .apparel-shirt {
          animation: apparelFloat 6s ease-in-out infinite;
        }

        .apparel-swatch {
          animation: apparelPulse 3s ease-in-out infinite;
        }

        .apparel-swatch-2 {
          animation-delay: 0.8s;
        }

        .apparel-swatch-3 {
          animation-delay: 1.6s;
        }

        .apparel-thread {
          animation: apparelThread 7s linear infinite;
        }

        .apparel-tag {
          animation: apparelTag 5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .apparel-shirt,
          .apparel-swatch,
          .apparel-thread,
          .apparel-tag {
            animation: none;
          }
        }
      `}</style>
      </div>
    );
  }

  if (type === "cybersecurity") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* faint security grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, currentColor 1px, transparent 1px), linear-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />

        {/* shield */}
        <div className="cyber-shield absolute left-[14%] top-[24%] h-24 w-20 rounded-[40%_40%_55%_55%] border border-black/15 bg-white/35">
          <div className="absolute left-1/2 top-[28%] h-3 w-3 -translate-x-1/2 rounded-full bg-blue-400/55" />
          <div className="absolute left-1/2 top-[43%] h-7 w-px -translate-x-1/2 bg-black/15" />
        </div>

        {/* security nodes */}
        <div className="cyber-node cyber-node-1 absolute left-[38%] top-[32%] h-3 w-3 rounded-full bg-emerald-400/55" />
        <div className="cyber-node cyber-node-2 absolute left-[58%] top-[50%] h-3 w-3 rounded-full bg-orange-400/55" />
        <div className="cyber-node cyber-node-3 absolute right-[16%] top-[30%] h-3 w-3 rounded-full bg-blue-400/55" />

        {/* connections */}
        <div className="absolute left-[22%] top-[36%] h-px w-[18%] rotate-[10deg] bg-black/10" />
        <div className="absolute left-[39%] top-[40%] h-px w-[20%] rotate-[18deg] bg-black/10" />
        <div className="absolute right-[16%] top-[40%] h-px w-[26%] -rotate-[15deg] bg-black/10" />

        {/* moving scan beam */}
        <div className="cyber-scan absolute left-[8%] top-[68%] h-px w-[18%] bg-cyan-400/55 shadow-[0_0_8px_rgba(34,211,238,0.35)]" />

        {/* threat pulse */}
        <div className="cyber-threat absolute right-[12%] top-[60%] h-4 w-4 rounded-full border border-red-400/40 bg-red-400/20" />

        <style>{`
        @keyframes cyberShieldFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-7px);
          }
        }

        @keyframes cyberNodePulse {
          0%,
          100% {
            transform: scale(0.85);
            opacity: 0.3;
          }

          50% {
            transform: scale(1.35);
            opacity: 0.85;
          }
        }

        @keyframes cyberScan {
          0% {
            transform: translateX(-120%);
            opacity: 0;
          }

          15% {
            opacity: 0.9;
          }

          85% {
            opacity: 0.9;
          }

          100% {
            transform: translateX(620%);
            opacity: 0;
          }
        }

        @keyframes cyberThreat {
          0%,
          100% {
            transform: scale(0.8);
            opacity: 0.25;
          }

          50% {
            transform: scale(1.35);
            opacity: 0.7;
          }
        }

        .cyber-shield {
          animation: cyberShieldFloat 6s ease-in-out infinite;
        }

        .cyber-node {
          animation: cyberNodePulse 3s ease-in-out infinite;
        }

        .cyber-node-2 {
          animation-delay: 0.8s;
        }

        .cyber-node-3 {
          animation-delay: 1.6s;
        }

        .cyber-scan {
          animation: cyberScan 6s linear infinite;
        }

        .cyber-threat {
          animation: cyberThreat 2.5s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .cyber-shield,
          .cyber-node,
          .cyber-scan,
          .cyber-threat {
            animation: none;
          }
        }
      `}</style>
      </div>
    );
  }

  return null;
}
