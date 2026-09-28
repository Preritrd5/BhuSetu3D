// "use client";

// import React from "react";
// import Link from "next/link";
// import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
// import { useAuth } from "@/hooks/useAuth";

// export function CTASection() {
//   const { isAuthenticated } = useAuth();

//   return (
//     <section className="py-24 px-4 sm:px-6 lg:px-12 bg-[#0F1210] border-b border-[rgba(244,240,232,0.08)] text-center relative overflow-hidden">
//       {/* Geodetic Grid Background */}
//       <div className="absolute inset-0 bg-geodetic-grid opacity-30 pointer-events-none" />

//       <div className="max-w-4xl mx-auto space-y-8 relative z-10">
//         <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#23847D] font-semibold">
//           <span className="w-1.5 h-1.5 rounded-full bg-[#176C68]" />
//           <span>SPATIAL DIGITAL TWIN ENVIRONMENT</span>
//         </div>

//         <div className="space-y-4">
//           <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#F4F0E8] font-mono leading-tight">
//             Enter BhuSetu 3D
//           </h2>
//           <p className="text-base sm:text-lg text-[#D9D2C5] max-w-2xl mx-auto leading-relaxed font-sans">
//             Explore the live 3D city digital twin, inspect multi-tier cadastral properties, evaluate
//             subsurface utilities, and investigate evidence-backed spatial findings.
//           </p>
//         </div>

//         <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
//           <Link
//             href="/3d-city"
//             className="px-7 py-3 rounded-[6px] bg-[#B56E48] hover:bg-[#C47B50] text-[#F4F0E8] text-sm font-mono font-bold flex items-center gap-2 shadow-sm transition-all hover:-translate-y-0.5"
//           >
//             <span>Launch 3D Workspace</span>
//             <ArrowRight className="w-4 h-4" />
//           </Link>

//           {isAuthenticated ? (
//             <Link
//               href="/overview"
//               className="px-7 py-3 rounded-[6px] border border-[rgba(244,240,232,0.12)] hover:border-[rgba(244,240,232,0.25)] bg-[#141816] hover:bg-[#1A201D] text-[#F4F0E8] text-sm font-mono flex items-center gap-2 transition-all hover:-translate-y-0.5"
//             >
//               <span>Platform Overview</span>
//             </Link>
//           ) : (
//             <Link
//               href="/login"
//               className="px-7 py-3 rounded-[6px] border border-[rgba(244,240,232,0.12)] hover:border-[rgba(244,240,232,0.25)] bg-[#141816] hover:bg-[#1A201D] text-[#F4F0E8] text-sm font-mono flex items-center gap-2 transition-all hover:-translate-y-0.5"
//             >
//               <Lock className="w-4 h-4 text-[#23847D]" />
//               <span>Official Sign In</span>
//             </Link>
//           )}
//         </div>

//         <div className="pt-8 border-t border-[rgba(244,240,232,0.08)] flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[#6F7772]">
//           <span className="flex items-center gap-1.5 text-[#23847D]">
//             <ShieldCheck className="w-4 h-4 text-[#176C68]" />
//             Row-Level Security (RLS) Protected
//           </span>
//           <span>·</span>
//           <span>PostGIS 3D Conformal (EPSG:32643)</span>
//           <span>·</span>
//           <span>SHA-256 Hash Chained Audit Trail</span>
//         </div>
//       </div>
//     </section>
//   );
// }
