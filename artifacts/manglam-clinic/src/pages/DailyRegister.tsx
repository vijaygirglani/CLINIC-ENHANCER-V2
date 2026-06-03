import { useState, useEffect, useCallback, useRef } from "react";
import { format } from "date-fns";
import { Layout } from "@/components/Layout";
import {
  getDailyStats, updatePatient, deletePatient, getAllDates,
  exportBackup, importBackup, addPatient, getMonthlyStats,
  type Patient, type DailyStats,
} from "@/lib/store";
import {
  Calendar, Download, Edit2, Trash2, Users, IndianRupee, FileText,
  ChevronDown, ChevronUp, Printer, Upload, Save, RotateCcw, BarChart2,
  TrendingUp, Leaf, MessageCircle, Send, X, ShoppingBag, Wifi, Banknote,
  WalletCards, Loader2, MessageSquare,
} from "lucide-react";

// ── Loose Medicine Sale helpers (mirrors Home.tsx) ────────────────────────────
const LOOSE_SALE_KEY = "manglam_loose_sales";
interface LooseSaleEntry { id: string; product: string; amount: number; date: string; time: string; }
function getLooseSalesForDate(date: string): LooseSaleEntry[] {
  try { return (JSON.parse(localStorage.getItem(LOOSE_SALE_KEY) || "[]") as LooseSaleEntry[]).filter(e => e.date === date); }
  catch { return []; }
}
import { exportToExcel, parseExcelFile } from "@/lib/export";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PrintPrescription, printPatientPrescription } from "@/components/PrintPrescription";
import * as z from "zod";

const editSchema = z.object({
  name: z.string().min(1),
  age: z.coerce.number().optional(),
  ageMonths: z.coerce.number().optional(),
  weight: z.string().optional(),
  address: z.string().optional(),
  mobile: z.string(),
  patientNo: z.string().optional(),
  complaintCode: z.string().optional(),
  complaint: z.string().optional(),
  treatment: z.string().optional(),
  advice: z.string().optional(),
  reports: z.string().optional(),
  fees: z.coerce.number().optional(),
});

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Patient Card (copied from Home.tsx) ──────────────────────────────────────
type CardLang = "en" | "hi" | "gu";
const CARD_LABELS: Record<CardLang, {
  clinicName: string; doctor: string; tagline: string;
  patientCard: string; caseNo: string;
  patientName: string; address: string; clinicPhone: string;
  footer: string; footerSub: string;
}> = {
  en: { clinicName: "Manglam Clinic", doctor: "Dr. Vijay Girglani  |  B.A.M.S.", tagline: "AYURVEDIC & GENERAL PRACTICE", patientCard: "✦  PATIENT CARD  ✦", caseNo: "CASE NO.", patientName: "PATIENT NAME", address: "ADDRESS", clinicPhone: "CLINIC PHONE", footer: "MANGLAM HOSPITAL  •  MORBI, GUJARAT", footerSub: "Show this card on your next visit" },
  hi: { clinicName: "मंगलम क्लिनिक", doctor: "डॉ. विजय गिरगलानी  |  बी.ए.एम.एस.", tagline: "आयुर्वेदिक एवं सामान्य चिकित्सा", patientCard: "✦  रोगी कार्ड  ✦", caseNo: "केस नं.", patientName: "रोगी का नाम", address: "पता", clinicPhone: "क्लिनिक फोन", footer: "मंगलम हॉस्पिटल  •  मोरबी, गुजरात", footerSub: "अगली मुलाकात पर यह कार्ड दिखाएं" },
  gu: { clinicName: "મંગલમ ક્લિનિક", doctor: "ડૉ. વિજય ગિરગ્લાણી  |  બી.એ.એમ.એસ.", tagline: "આયુર્વેદિક અને સામાન્ય પ્રેક્ટિસ", patientCard: "✦  દર્દી કાર્ડ  ✦", caseNo: "કેસ નં.", patientName: "દર્દીનું નામ", address: "સરનામું", clinicPhone: "ક્લિનિક ફોન", footer: "મંગલમ હૉસ્પિટલ  •  મોરબી, ગુજરાત", footerSub: "આગલી મુલાકાત વખતે આ કાર્ડ બતાવો" },
};

function drawPatientCard(patient: Patient, lang: CardLang = "en"): HTMLCanvasElement {
  const L = CARD_LABELS[lang];
  const scale = 3;
  const W = 360;
  const AMBER_H=5,HDR_PT=24,LOGO_D=64,LOGO_MB=10,CNAME_H=22,CNAME_MB=3,DR_H=14,DR_MB=10,DIV_H=12,HDR_PB=16;
  const PANEL_MX=16,PANEL_MB=16,STRIPE_H=3,PANEL_PX=16,PANEL_PT=16,PC_LABEL_H=18;
  const CASE_PT=10,CASE_LABEL=12,CASE_NUM=28,CASE_PB=10,CASE_MB=16,ROW_H=40,PANEL_PB=16,FTR_PB=16,FTR_L1=14,FTR_L2=14;
  const caseBoxH=CASE_PT+CASE_LABEL+CASE_NUM+CASE_PB;
  const panelInnerH=STRIPE_H+PANEL_PT+PC_LABEL_H+caseBoxH+CASE_MB+ROW_H*3+PANEL_PB;
  const hdrH=HDR_PT+LOGO_D+LOGO_MB+CNAME_H+CNAME_MB+DR_H+DR_MB+DIV_H+HDR_PB;
  const ftrH=FTR_L1+FTR_L2+FTR_PB+4;
  const H=AMBER_H+hdrH+panelInnerH+PANEL_MB+ftrH+AMBER_H;
  const canvas=document.createElement("canvas");
  canvas.width=W*scale; canvas.height=H*scale;
  const ctx=canvas.getContext("2d")!;
  ctx.scale(scale,scale);
  const rr=(x:number,y:number,w:number,h:number,r:number)=>{ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.arcTo(x+w,y,x+w,y+r,r);ctx.lineTo(x+w,y+h-r);ctx.arcTo(x+w,y+h,x+w-r,y+h,r);ctx.lineTo(x+r,y+h);ctx.arcTo(x,y+h,x,y+h-r,r);ctx.lineTo(x,y+r);ctx.arcTo(x,y,x+r,y,r);ctx.closePath();};
  const amberGrad=ctx.createLinearGradient(0,0,W,0);amberGrad.addColorStop(0,"#c45e10");amberGrad.addColorStop(0.5,"#e07828");amberGrad.addColorStop(1,"#c45e10");
  const bgGrad=ctx.createLinearGradient(0,0,0,H);bgGrad.addColorStop(0,"#1a3a0f");bgGrad.addColorStop(0.5,"#1f4a12");bgGrad.addColorStop(1,"#0f2208");
  rr(0,0,W,H,24);ctx.fillStyle=bgGrad;ctx.fill();ctx.save();ctx.clip();
  ctx.save();ctx.globalAlpha=0.05;ctx.fillStyle="#ffffff";ctx.beginPath();ctx.arc(W-30,50,100,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(-20,H-50,110,0,Math.PI*2);ctx.fill();ctx.restore();
  ctx.fillStyle=amberGrad;ctx.fillRect(0,0,W,AMBER_H);
  let cy=AMBER_H+HDR_PT;
  const logoX=W/2,logoY=cy+LOGO_D/2;
  ctx.save();ctx.shadowColor="rgba(224,120,40,0.5)";ctx.shadowBlur=14;ctx.strokeStyle="rgba(224,120,40,0.4)";ctx.lineWidth=2;ctx.beginPath();ctx.arc(logoX,logoY,LOGO_D/2+3,0,Math.PI*2);ctx.stroke();ctx.restore();
  const logoGrad=ctx.createRadialGradient(logoX-10,logoY-10,4,logoX,logoY,LOGO_D/2);logoGrad.addColorStop(0,"#e07828");logoGrad.addColorStop(1,"#b84f0a");ctx.fillStyle=logoGrad;ctx.beginPath();ctx.arc(logoX,logoY,LOGO_D/2,0,Math.PI*2);ctx.fill();
  ctx.fillStyle="#ffffff";ctx.font=`900 28px serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("M",logoX,logoY+1);
  cy+=LOGO_D+LOGO_MB;ctx.fillStyle="#ffffff";ctx.font=`bold 20px serif`;ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(L.clinicName,W/2,cy+CNAME_H-4);cy+=CNAME_H+CNAME_MB;
  ctx.fillStyle="#d4a574";ctx.font=`italic 10.5px serif`;ctx.fillText(L.doctor,W/2,cy+DR_H-3);cy+=DR_H+DR_MB;
  const lineY=cy+DIV_H/2;ctx.strokeStyle="rgba(212,165,116,0.3)";ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(20,lineY);ctx.lineTo(W/2-62,lineY);ctx.stroke();ctx.beginPath();ctx.moveTo(W/2+62,lineY);ctx.lineTo(W-20,lineY);ctx.stroke();ctx.fillStyle="rgba(212,165,116,0.8)";ctx.font=`600 7px sans-serif`;ctx.textBaseline="middle";ctx.fillText(L.tagline,W/2,lineY);cy+=DIV_H+HDR_PB;
  const pX=PANEL_MX,pW=W-PANEL_MX*2,pY=cy;
  ctx.save();ctx.shadowColor="rgba(0,0,0,0.35)";ctx.shadowBlur=18;ctx.shadowOffsetY=4;rr(pX,pY,pW,panelInnerH,16);ctx.fillStyle="#ffffff";ctx.fill();ctx.restore();
  ctx.save();rr(pX,pY,pW,panelInnerH,16);ctx.clip();ctx.fillStyle=amberGrad;ctx.fillRect(pX,pY,pW,STRIPE_H);
  let py=pY+STRIPE_H+PANEL_PT;
  ctx.fillStyle="#7c3a0a";ctx.font=`700 7.5px sans-serif`;(ctx as any).letterSpacing="2px";ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(L.patientCard,W/2,py+10);(ctx as any).letterSpacing="0px";py+=PC_LABEL_H;
  const cBX=pX+12,cBW=pW-24;rr(cBX,py,cBW,caseBoxH,10);ctx.fillStyle="#fdf0e6";ctx.fill();ctx.fillStyle="#b8825a";ctx.font=`700 6.5px sans-serif`;(ctx as any).letterSpacing="1.5px";ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillText(L.caseNo,cBX+14,py+CASE_PT+CASE_LABEL-2);(ctx as any).letterSpacing="0px";
  const rawD=patient.mobile.replace(/\D/g,"");const caseNo=rawD.padStart(10,"0");ctx.fillStyle="#c45e10";ctx.font=`900 22px monospace`;ctx.textBaseline="alphabetic";ctx.fillText(caseNo,cBX+14,py+CASE_PT+CASE_LABEL+CASE_NUM-4);
  const icX=cBX+cBW-46,icY=py+caseBoxH/2-14;ctx.fillStyle="rgba(196,94,16,0.1)";rr(icX,icY,28,28,7);ctx.fill();ctx.strokeStyle="#c45e10";ctx.lineWidth=1.5;rr(icX+4,icY+6,20,16,3);ctx.stroke();ctx.beginPath();ctx.moveTo(icX+4,icY+11);ctx.lineTo(icX+24,icY+11);ctx.stroke();py+=caseBoxH+CASE_MB;
  const rowPX=pX+12,rowPXR=pX+pW-12;
  const infoRow=(emoji:string,label:string,value:string,isLast:boolean)=>{const rowMid=py+ROW_H/2;ctx.fillStyle="#fdf0e6";ctx.beginPath();ctx.arc(rowPX+11,rowMid,11,0,Math.PI*2);ctx.fill();ctx.font=`11px sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(emoji,rowPX+11,rowMid);const textX=rowPX+22+8;ctx.fillStyle="#94a3b8";ctx.font=`700 7px sans-serif`;(ctx as any).letterSpacing="0.8px";ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillText(label,textX,rowMid-2);(ctx as any).letterSpacing="0px";ctx.fillStyle="#1e293b";ctx.font=`700 11px sans-serif`;ctx.textBaseline="alphabetic";let v=value;const maxW=rowPXR-textX-4;while(ctx.measureText(v).width>maxW&&v.length>2)v=v.slice(0,-1);if(v!==value)v=v.trimEnd()+"…";ctx.fillText(v,textX,rowMid+12);py+=ROW_H;if(!isLast){ctx.strokeStyle="#f1f5f9";ctx.lineWidth=0.8;ctx.beginPath();ctx.moveTo(rowPX,py);ctx.lineTo(rowPXR,py);ctx.stroke();}};
  infoRow("👤",L.patientName,patient.name.toUpperCase(),false);infoRow("📍",L.address,patient.address||"Pipaliya Char Rasta",false);infoRow("📞",L.clinicPhone,"+91 96381 81875",true);
  ctx.restore();
  const fY=pY+panelInnerH+PANEL_MB;ctx.fillStyle="rgba(212,165,116,0.75)";ctx.font=`700 8px sans-serif`;(ctx as any).letterSpacing="1.5px";ctx.textAlign="center";ctx.textBaseline="alphabetic";ctx.fillText(L.footer,W/2,fY+FTR_L1);(ctx as any).letterSpacing="0px";ctx.fillStyle="rgba(255,255,255,0.35)";ctx.font=`9px sans-serif`;ctx.fillText(L.footerSub,W/2,fY+FTR_L1+FTR_L2+2);
  ctx.fillStyle=amberGrad;ctx.fillRect(0,H-AMBER_H,W,AMBER_H);ctx.restore();
  return canvas;
}

function PatientCardModal({ patient, onClose }: { patient: Patient; onClose: () => void }) {
  const rawDigits = patient.mobile.replace(/\D/g, "");
  const caseNo = rawDigits.padStart(10, "0");
  const CLINIC_MOBILE = "9638181875";
  const CLINIC_ADDRESS = "Pipaliya Char Rasta";
  const clinicPhone = CLINIC_MOBILE.replace(/(\d{5})(\d{5})/, "$1 $2");
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState("");
  const [lang, setLang] = useState<CardLang>("en");
  const [showLangPicker, setShowLangPicker] = useState(false);
  const L = CARD_LABELS[lang];
  const patientWaLabel = rawDigits.length >= 10 ? `Send to ${rawDigits.slice(-10)}` : "Send on WhatsApp";

  const doShare = async (chosenLang: CardLang) => {
    setShowLangPicker(false); setLang(chosenLang); setSharing(true); setShareError("");
    try {
      const canvas = drawPatientCard(patient, chosenLang);
      const blob: Blob = await new Promise((res, rej) => canvas.toBlob((b: Blob | null) => b ? res(b) : rej(new Error("toBlob failed")), "image/png", 1.0));
      const waNumber = rawDigits.length === 10 ? `91${rawDigits}` : rawDigits.startsWith("91") && rawDigits.length === 12 ? rawDigits : rawDigits;
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        const file = new File([blob], "manglam-patient-card.png", { type: "image/png" });
        if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
          try { await navigator.share({ files: [file], title: "Manglam Clinic — Patient Card" }); setSharing(false); return; } catch (e: any) { if (e?.name === "AbortError") { setSharing(false); return; } }
        }
        window.open(`whatsapp://send?phone=${waNumber}`, "_blank");
      } else {
        let copied = false;
        try { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); copied = true; } catch (_) {}
        window.open(`whatsapp://send?phone=${waNumber}`, "_blank");
        setShareError(copied ? `✅ Image copied! Just press Ctrl+V in the chat to send.` : `⚠️ Could not copy image — paste manually after opening chat.`);
      }
    } catch (err: any) { setShareError("Could not generate card. Please try again."); }
    setSharing(false);
  };

  const LANGS: { id: CardLang; label: string; native: string; flag: string }[] = [
    { id: "en", label: "English", native: "English", flag: "🇬🇧" },
    { id: "hi", label: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
    { id: "gu", label: "Gujarati", native: "ગુજરાતી", flag: "🏵️" },
  ];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
        <motion.div initial={{ scale: 0.85, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }} onClick={e => e.stopPropagation()} className="w-full max-w-xs">
          {/* Language tab strip */}
          <div className="flex gap-1 mb-3 p-1 rounded-2xl" style={{ background: "rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
            {LANGS.map(l => (
              <button key={l.id} onClick={() => setLang(l.id)} className="flex-1 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-0.5"
                style={{ background: lang === l.id ? "#ffffff" : "transparent", color: lang === l.id ? "#c45e10" : "rgba(255,255,255,0.7)", boxShadow: lang === l.id ? "0 2px 8px rgba(0,0,0,0.15)" : "none" }}>
                <span style={{ fontSize: 16 }}>{l.flag}</span><span>{l.native}</span>
              </button>
            ))}
          </div>
          {/* Card preview */}
          <div className="rounded-3xl overflow-hidden shadow-2xl" style={{ background: "linear-gradient(180deg, #1a3a0f 0%, #1f4a12 50%, #0f2208 100%)", position: "relative" }}>
            <div style={{ height: 5, background: "linear-gradient(90deg, #c45e10, #e07828, #c45e10)" }} />
            <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: 60, left: -40, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />
            <div className="flex flex-col items-center pt-6 pb-4 px-5" style={{ position: "relative", zIndex: 1 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg, #e07828, #b84f0a)", boxShadow: "0 0 0 3px rgba(224,120,40,0.3), 0 0 18px rgba(224,120,40,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <span style={{ color: "#fff", fontFamily: "serif", fontWeight: 900, fontSize: 26 }}>M</span>
              </div>
              <p style={{ color: "#ffffff", fontFamily: "serif", fontWeight: 700, fontSize: 18, letterSpacing: 0.5, marginBottom: 3 }}>{L.clinicName}</p>
              <p style={{ color: "#d4a574", fontStyle: "italic", fontSize: 10, marginBottom: 10 }}>{L.doctor}</p>
              <div className="flex items-center gap-2 w-full">
                <div style={{ flex: 1, height: 1, background: "rgba(212,165,116,0.3)" }} />
                <p style={{ color: "rgba(212,165,116,0.8)", fontSize: 7, letterSpacing: "1.5px", whiteSpace: "nowrap" }}>{L.tagline}</p>
                <div style={{ flex: 1, height: 1, background: "rgba(212,165,116,0.3)" }} />
              </div>
            </div>
            <div className="mx-4 mb-4 rounded-2xl overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              <div style={{ height: 3, background: "linear-gradient(90deg, #c45e10, #e07828)" }} />
              <div className="px-4 py-4" style={{ background: "#ffffff" }}>
                <p style={{ textAlign: "center", fontSize: 8, fontWeight: 700, letterSpacing: "2px", color: "#7c3a0a", marginBottom: 10 }}>{L.patientCard}</p>
                <div className="rounded-xl px-3 py-2.5 mb-4" style={{ background: "#fdf0e6" }}>
                  <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: "1.5px", color: "#b8825a", marginBottom: 4 }}>{L.caseNo}</p>
                  <p style={{ fontSize: 20, fontWeight: 900, fontFamily: "monospace", color: "#c45e10", letterSpacing: 1 }}>{caseNo}</p>
                </div>
                {[
                  { icon: "👤", label: L.patientName, value: patient.name.toUpperCase() },
                  { icon: "📍", label: L.address, value: patient.address || CLINIC_ADDRESS },
                  { icon: "📞", label: L.clinicPhone, value: `+91 ${clinicPhone}` },
                ].map((row, i, arr) => (
                  <div key={i}>
                    <div className="flex items-center gap-2 py-2">
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#fdf0e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{row.icon}</div>
                      <div className="flex-1 min-w-0">
                        <p style={{ fontSize: 7, fontWeight: 700, letterSpacing: "1px", color: "#94a3b8", marginBottom: 1 }}>{row.label}</p>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.value}</p>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, background: "#f1f5f9" }} />}
                  </div>
                ))}
              </div>
            </div>
            <div className="pb-4 px-4 flex flex-col items-center gap-0.5" style={{ position: "relative", zIndex: 1 }}>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: "1.5px", color: "rgba(212,165,116,0.75)" }}>{L.footer}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.35)" }}>{L.footerSub}</p>
            </div>
            <div style={{ height: 5, background: "linear-gradient(90deg, #c45e10, #e07828, #c45e10)" }} />
          </div>
          {shareError && (
            <div className="mt-2 px-3 py-2 rounded-xl text-center text-xs font-medium"
              style={{ background: shareError.startsWith("✅") ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.15)", color: shareError.startsWith("✅") ? "#15803d" : "#92400e", border: `1px solid ${shareError.startsWith("✅") ? "rgba(34,197,94,0.3)" : "rgba(251,191,36,0.3)"}` }}>
              {shareError}
            </div>
          )}
          <AnimatePresence>
            {showLangPicker && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                className="mt-3 rounded-2xl overflow-hidden shadow-xl" style={{ background: "#fff", border: "1px solid rgba(196,94,16,0.2)" }}>
                <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "#7c3a0a", padding: "10px 16px 6px", letterSpacing: "1px" }}>CHOOSE LANGUAGE TO SHARE</p>
                {LANGS.map(l => (
                  <button key={l.id} onClick={() => doShare(l.id)} className="w-full flex items-center gap-3 px-5 py-3 hover:bg-orange-50 transition-colors" style={{ borderTop: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 20 }}>{l.flag}</span>
                    <div className="text-left">
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#1e293b" }}>{l.label}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8" }}>{l.native}</p>
                    </div>
                    <span style={{ marginLeft: "auto", fontSize: 13, color: "#c45e10" }}>→</span>
                  </button>
                ))}
                <button onClick={() => setShowLangPicker(false)} className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors" style={{ borderTop: "1px solid #f1f5f9" }}>Cancel</button>
              </motion.div>
            )}
          </AnimatePresence>
          {!showLangPicker && (
            <div className="mt-4 flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-white/90 backdrop-blur text-slate-600 font-semibold text-sm hover:bg-white transition-all shadow">Close</button>
              <button onClick={() => setShowLangPicker(true)} disabled={sharing}
                className="flex-[2] py-3 rounded-2xl bg-[#25D366] text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#1ebe5a] transition-all shadow-lg shadow-green-500/30 disabled:opacity-70">
                {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                {sharing ? "Capturing…" : patientWaLabel}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function DailyRegister() {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showMonthly, setShowMonthly] = useState(false);
  const [allDates, setAllDates] = useState<{ date: string; count: number; totalFees: number }[]>([]);
  const [printPatient, setPrintPatient] = useState<Patient | null>(null);
  const [cardPatient, setCardPatient] = useState<Patient | null>(null);
  const [filterType, setFilterType] = useState<"all" | "general" | "ayurvedic">("all");
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());
  const importRef = useRef<HTMLInputElement>(null);
  const excelImportRef = useRef<HTMLInputElement>(null);
  const [showWaReport, setShowWaReport] = useState(false);
  const [waCustomNote, setWaCustomNote] = useState("");
  const { toast } = useToast();

  // Loose sales for selected date
  const [looseSalesForDay, setLooseSalesForDay] = useState<LooseSaleEntry[]>(() => getLooseSalesForDate(format(new Date(), "yyyy-MM-dd")));
  const looseDayTotal = looseSalesForDay.reduce((s, e) => s + e.amount, 0);

  const refresh = useCallback(() => {
    setStats(getDailyStats(selectedDate));
    setAllDates(getAllDates());
    setLooseSalesForDay(getLooseSalesForDate(selectedDate));
  }, [selectedDate]);

  useEffect(() => { refresh(); }, [refresh]);

  const editForm = useForm({ resolver: zodResolver(editSchema), values: editingPatient || {} });

  const filteredPatients = (stats?.patients || []).filter(p => {
    if (filterType === "all") return true;
    if (filterType === "general") return p.registerType !== "ayurvedic";
    return p.registerType === "ayurvedic";
  });

  const monthlyStats = showMonthly ? getMonthlyStats(monthlyYear, monthlyMonth) : null;

  const handleExport = () => {
    if (!stats?.patients?.length) {
      toast({ variant: "destructive", title: "No Data", description: "No patients to export for this date." });
      return;
    }
    const exportData = stats.patients.map((p, i) => ({
      "S.No": i + 1, "Name": p.name,
      "Age": `${p.age || 0} yrs${p.ageMonths ? ` ${p.ageMonths} mo` : ""}`,
      "Weight": p.weight || "-", "Address": p.address || "-", "Mobile/Case": p.mobile,
      "Register": p.registerType === "ayurvedic" ? "Ayurvedic" : "General",
      "Complaint Code": p.complaintCode || "-", "Complaint": p.complaint || "-",
      "Treatment": p.treatment || "-", "Advice": p.advice || "-", "Reports": p.reports || "-",
      "Fees": p.fees || 0, "Date": format(new Date(p.visitDate), "dd-MMM-yyyy"),
    }));
    exportToExcel(exportData, `Manglam_Clinic_${selectedDate}`);
    toast({ title: "Export Successful", description: "Excel file downloaded." });
  };

  const handleBackup = () => {
    const json = exportBackup();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Manglam_Clinic_Backup_${format(new Date(), "yyyy-MM-dd")}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast({ title: "Backup Created", description: "All patient data backed up." });
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (!confirm("This will replace ALL data with the backup. Are you sure?")) return;
      const result = importBackup(ev.target?.result as string);
      if (result.success) { toast({ title: "Restore Successful", description: result.message }); refresh(); }
      else toast({ variant: "destructive", title: "Restore Failed", description: result.message });
    };
    reader.readAsText(file);
    if (importRef.current) importRef.current.value = "";
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const rows = await parseExcelFile(file);
      let imported = 0;
      for (const row of rows) {
        const name = String(row["Name"] || row["name"] || "").trim();
        const mobile = String(row["Mobile"] || row["mobile"] || row["Mobile/Case"] || "").trim();
        if (!name || !mobile) continue;
        const visitDateRaw = String(row["Date"] || row["date"] || row["Visit Date"] || selectedDate);
        let visitDate = selectedDate;
        try { const d = new Date(visitDateRaw); if (!isNaN(d.getTime())) visitDate = format(d, "yyyy-MM-dd"); } catch {}
        addPatient({
          name, mobile, patientNo: String(row["Pt.No"] || ""),
          age: Number(row["Age"] || 0) || 0, weight: String(row["Weight"] || ""),
          address: String(row["Address"] || ""), complaint: String(row["Complaint"] || ""),
          complaintCode: String(row["Complaint Code"] || ""), treatment: String(row["Treatment"] || ""),
          advice: String(row["Advice"] || ""), reports: String(row["Reports"] || ""),
          fees: Number(row["Fees"] || 0) || 0,
          registerType: String(row["Register"] || "").toLowerCase().includes("ayur") ? "ayurvedic" : "general",
          visitDate,
        });
        imported++;
      }
      toast({ title: "Import Successful", description: `${imported} patients imported.` });
      refresh();
    } catch { toast({ variant: "destructive", title: "Import Failed", description: "Could not read the Excel file." }); }
    if (excelImportRef.current) excelImportRef.current.value = "";
  };

  const onEditSubmit = (data: any) => {
    if (!editingPatient) return;
    updatePatient(editingPatient.id, { ...data, fees: Number(data.fees || 0) });
    toast({ title: "Updated", description: "Patient record updated." });
    setEditingPatient(null); refresh();
  };

  const handleDelete = (id: number) => {
    if (!confirm("Delete this record?")) return;
    deletePatient(id);
    toast({ title: "Deleted" }); refresh();
  };

  const exportMonthlyReport = () => {
    if (!monthlyStats) return;
    const rows = monthlyStats.dailyBreakdown.map(d => ({
      "Date": format(new Date(d.date + "T00:00:00"), "dd-MMM-yyyy"),
      "Patients": d.count, "Total Collection (₹)": d.totalFees,
      "General (₹)": d.generalFees, "Ayurvedic (₹)": d.ayurvedicFees,
    }));
    rows.push({ "Date": "TOTAL", "Patients": monthlyStats.totalPatients, "Total Collection (₹)": monthlyStats.totalFees, "General (₹)": monthlyStats.generalFees, "Ayurvedic (₹)": monthlyStats.ayurvedicFees });
    exportToExcel(rows, `Monthly_Report_${MONTHS[monthlyMonth - 1]}_${monthlyYear}`);
    toast({ title: "Monthly Report Exported" });
  };

  const buildDailyReportMsg = () => {
    const generalCount = (stats?.patients || []).filter(p => p.registerType !== "ayurvedic").length;
    const ayurvedicCount = (stats?.patients || []).filter(p => p.registerType === "ayurvedic").length;
    const generalFees = (stats?.patients || []).filter(p => p.registerType !== "ayurvedic").reduce((s, p) => s + (p.fees || 0), 0);
    const ayurvedicFees = (stats?.patients || []).filter(p => p.registerType === "ayurvedic").reduce((s, p) => s + (p.fees || 0), 0);
    const cashFees = (stats?.patients || []).filter(p => p.paymentMode !== "online").reduce((s, p) => s + (p.fees || 0), 0);
    const onlineFees = (stats?.patients || []).filter(p => p.paymentMode === "online").reduce((s, p) => s + (p.fees || 0), 0);
    const dateStr = format(new Date(selectedDate + "T00:00:00"), "dd/MM/yyyy");
    const grandTotal = (stats?.totalFees || 0) + looseDayTotal;
    const looseLine = looseDayTotal > 0
      ? `\n🛒 *Loose Medicine Sales:* ₹${looseDayTotal.toLocaleString("en-IN")} (${looseSalesForDay.length} items)`
      : "";
    const paymentLine = (cashFees > 0 || onlineFees > 0)
      ? `\n\n💵 *Cash:* ₹${cashFees.toLocaleString("en-IN")}   📱 *Online:* ₹${onlineFees.toLocaleString("en-IN")}`
      : "";
    return `*Manglam Clinic Daily Update*

Date: ${dateStr}

Patients Seen Today: ${stats?.totalPatients || 0}

Today's Collection: ₹${grandTotal.toLocaleString("en-IN")}${paymentLine}

General Cases: ${generalCount} (₹${generalFees.toLocaleString("en-IN")})
Ayurvedic Cases: ${ayurvedicCount} (₹${ayurvedicFees.toLocaleString("en-IN")})${looseLine}${waCustomNote.trim() ? `\n\nNote: ${waCustomNote.trim()}` : ""}

Thank you everyone for your trust
Dr. Vijay Girglani
Manglam Hospital, Morbi`;
  };

  const handleSendDailyReport = () => {
    const msg = buildDailyReportMsg();
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    setShowWaReport(false);
    setWaCustomNote("");
    toast({ title: "Opening WhatsApp", description: "Daily report ready to share." });
  };

  return (
    <Layout>
      {printPatient && <PrintPrescription patient={printPatient} />}
      {cardPatient && <PatientCardModal patient={cardPatient} onClose={() => setCardPatient(null)} />}
      <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleRestoreFile} />
      <input ref={excelImportRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleImportExcel} />

      <div className="space-y-5">
        {/* ── STICKY HEADER ── */}
        <div className="sticky top-16 z-30 -mx-4 md:-mx-8 px-4 md:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3 shadow-sm">
          <div className="flex flex-row flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-display font-bold text-slate-900">Daily Register</h2>
              <p className="text-slate-500 text-xs">General + Ayurvedic patients for selected date</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 focus:outline-none focus:border-primary shadow-sm text-slate-700 font-medium text-sm" />
              </div>
              <button onClick={() => { setShowWaReport(true); setWaCustomNote(""); }}
                className="px-3 py-2 rounded-xl font-semibold bg-green-500 text-white hover:bg-green-600 shadow-sm text-sm flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4" /> Daily Report
              </button>
              <button onClick={handleExport} className="px-3 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm text-sm flex items-center gap-1.5">
                <Download className="w-4 h-4" /> Export
              </button>
              <button onClick={() => excelImportRef.current?.click()} className="px-3 py-2 rounded-xl font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm text-sm flex items-center gap-1.5">
                <Upload className="w-4 h-4" /> Import
              </button>
              <button onClick={handleBackup} className="px-3 py-2 rounded-xl font-semibold bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 text-sm flex items-center gap-1.5">
                <Save className="w-4 h-4" /> Backup
              </button>
              <button onClick={() => importRef.current?.click()} className="px-3 py-2 rounded-xl font-semibold bg-orange-500 text-white shadow-sm hover:bg-orange-600 text-sm flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" /> Restore
              </button>
            </div>
          </div>
        </div>

        {/* ── STATS CARDS ── */}
        {/* compute cash/online splits */}
        {(() => {
          const cashFees = (stats?.patients || []).filter(p => p.paymentMode !== "online").reduce((s, p) => s + (p.fees || 0), 0);
          const onlineFees = (stats?.patients || []).filter(p => p.paymentMode === "online").reduce((s, p) => s + (p.fees || 0), 0);
          const onlineCount = (stats?.patients || []).filter(p => p.paymentMode === "online").length;
          return (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total", value: stats?.totalPatients || 0, icon: Users, color: "bg-blue-100 text-primary" },
                  { label: "General", value: (stats?.patients || []).filter(p => p.registerType !== "ayurvedic").length, icon: FileText, color: "bg-slate-100 text-slate-600" },
                  { label: "Ayurvedic", value: (stats?.patients || []).filter(p => p.registerType === "ayurvedic").length, icon: Leaf, color: "bg-emerald-100 text-emerald-600" },
                  { label: "Collection", value: formatCurrency((stats?.totalFees || 0) + looseDayTotal), icon: IndianRupee, color: "bg-emerald-100 text-emerald-600", sub: looseDayTotal > 0 ? `+₹${looseDayTotal} loose` : undefined },
                ].map(({ label, value, icon: Icon, color, sub }: any) => (
                  <div key={label} className="medical-card p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
                      <p className="text-2xl font-display font-bold text-slate-900">{value}</p>
                      {sub && <p className="text-[10px] text-violet-600 font-semibold flex items-center gap-0.5"><ShoppingBag className="w-2.5 h-2.5" />{sub}</p>}
                    </div>
                  </div>
                ))}
              </div>
              {/* Cash vs Online split bar */}
              {(stats?.totalFees || 0) > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="medical-card p-4 flex items-center gap-3 border-l-4 border-l-emerald-400">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                      <Banknote className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cash Collection</p>
                      <p className="text-2xl font-display font-bold text-emerald-700">{formatCurrency(cashFees)}</p>
                      <p className="text-[10px] text-slate-400">{(stats?.patients || []).filter(p => p.paymentMode !== "online").length} patients</p>
                    </div>
                  </div>
                  <div className="medical-card p-4 flex items-center gap-3 border-l-4 border-l-blue-400">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                      <Wifi className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Online Collection</p>
                      <p className="text-2xl font-display font-bold text-blue-700">{formatCurrency(onlineFees)}</p>
                      <p className="text-[10px] text-slate-400">{onlineCount} patients</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        {/* ── FILTER TABS ── */}
        <div className="flex items-center gap-2">
          {(["all", "general", "ayurvedic"] as const).map(type => (
            <button key={type} onClick={() => setFilterType(type)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all capitalize ${
                filterType === type
                  ? type === "ayurvedic" ? "bg-emerald-100 text-emerald-700" : "bg-primary/10 text-primary"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}>
              {type === "all" ? "All Patients" : type === "general" ? "General" : "Ayurvedic"}
            </button>
          ))}
          <span className="text-sm text-slate-400 ml-2">{filteredPatients.length} patients</span>
        </div>

        {/* ── PATIENT TABLE ── */}
        <div className="medical-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200/60">
                <tr>
                  <th className="px-4 py-3 font-semibold text-slate-600">#</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Patient</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Weight</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Complaint</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Treatment</th>
                  <th className="px-4 py-3 font-semibold text-slate-600">Type</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-right">Fees</th>
                  <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((p, i) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          {p.age ? `${p.age}y` : ""}{p.ageMonths ? ` ${p.ageMonths}m` : ""}
                          {p.age && p.mobile ? " · " : ""}{p.mobile}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.weight || "-"}</td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-slate-600">
                        {p.complaintCode && <span className="font-bold text-primary mr-1">[{p.complaintCode}]</span>}
                        {p.complaint || "-"}
                      </td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-slate-600">{p.treatment || "-"}</td>
                      <td className="px-4 py-3">
                        {p.registerType === "ayurvedic"
                          ? <span className="text-xs font-bold px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">Ayurvedic</span>
                          : <span className="text-xs font-bold px-2 py-1 rounded-md bg-blue-100 text-blue-700">General</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {p.fees ? (
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-bold text-slate-900">₹{p.fees}</span>
                            {p.paymentMode === "online"
                              ? <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-600 flex items-center gap-0.5"><Wifi className="w-2.5 h-2.5" />Online</span>
                              : <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-600 flex items-center gap-0.5"><Banknote className="w-2.5 h-2.5" />Cash</span>
                            }
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setCardPatient(p)}
                            title="Send Patient Card"
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <WalletCards className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setPrintPatient(p); setTimeout(() => printPatientPrescription(p), 50); }}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingPatient(p)}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)}
                            className="p-2 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center text-slate-400">
                        <FileText className="w-12 h-12 mb-3 text-slate-300" />
                        <p className="font-medium">No patients for this date</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── MONTHLY REPORT ── */}
        <div className="medical-card overflow-hidden">
          <button onClick={() => setShowMonthly(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <span className="font-semibold text-slate-800">Monthly Collection Report</span>
            </div>
            {showMonthly ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>

          {showMonthly && (
            <div className="border-t border-slate-100">
              <div className="px-6 py-4 bg-slate-50 flex flex-wrap items-center gap-3">
                <select value={monthlyMonth} onChange={e => setMonthlyMonth(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:border-primary">
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <select value={monthlyYear} onChange={e => setMonthlyYear(Number(e.target.value))}
                  className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold focus:outline-none focus:border-primary">
                  {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <button onClick={exportMonthlyReport}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm">
                  <Download className="w-4 h-4" /> Export Monthly
                </button>
              </div>

              {monthlyStats && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 px-6 py-4 bg-gradient-to-br from-primary/5 to-emerald-50/40 border-b border-slate-100">
                    {[
                      { label: "Total Patients", value: monthlyStats.totalPatients },
                      { label: "General Pts.", value: monthlyStats.generalPatients },
                      { label: "Ayurvedic Pts.", value: monthlyStats.ayurvedicPatients },
                      { label: "Total Collection", value: formatCurrency(monthlyStats.totalFees) },
                      { label: "Ayurvedic Fees", value: formatCurrency(monthlyStats.ayurvedicFees) },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{item.label}</p>
                        <p className="text-xl font-display font-bold mt-1 text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {monthlyStats.dailyBreakdown.length > 0 ? (
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 font-semibold text-slate-500">Date</th>
                          <th className="px-6 py-3 font-semibold text-slate-500 text-center">Patients</th>
                          <th className="px-6 py-3 font-semibold text-slate-500 text-right">General</th>
                          <th className="px-6 py-3 font-semibold text-slate-500 text-right">Ayurvedic</th>
                          <th className="px-6 py-3 font-semibold text-slate-500 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {monthlyStats.dailyBreakdown.map(d => (
                          <tr key={d.date} onClick={() => { setSelectedDate(d.date); setShowMonthly(false); }}
                            className="hover:bg-primary/5 transition-colors cursor-pointer">
                            <td className="px-6 py-2.5 font-medium text-slate-700">
                              {format(new Date(d.date + "T00:00:00"), "dd MMM yyyy (EEE)")}
                              {d.date === format(new Date(), "yyyy-MM-dd") && (
                                <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">Today</span>
                              )}
                            </td>
                            <td className="px-6 py-2.5 text-center text-slate-600">{d.count}</td>
                            <td className="px-6 py-2.5 text-right text-blue-700 font-medium">{d.generalFees > 0 ? formatCurrency(d.generalFees) : "—"}</td>
                            <td className="px-6 py-2.5 text-right text-emerald-700 font-medium">{d.ayurvedicFees > 0 ? formatCurrency(d.ayurvedicFees) : "—"}</td>
                            <td className="px-6 py-2.5 text-right font-bold text-slate-900">{formatCurrency(d.totalFees)}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-50 border-t-2 border-slate-300">
                          <td className="px-6 py-3 font-bold text-slate-800">TOTAL</td>
                          <td className="px-6 py-3 text-center font-bold text-slate-800">{monthlyStats.totalPatients}</td>
                          <td className="px-6 py-3 text-right font-bold text-blue-700">{formatCurrency(monthlyStats.generalFees)}</td>
                          <td className="px-6 py-3 text-right font-bold text-emerald-700">{formatCurrency(monthlyStats.ayurvedicFees)}</td>
                          <td className="px-6 py-3 text-right font-bold text-slate-900 text-base">{formatCurrency(monthlyStats.totalFees)}</td>
                        </tr>
                      </tbody>
                    </table>
                  ) : (
                    <div className="px-6 py-10 text-center text-slate-400">
                      <BarChart2 className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p>No data for {MONTHS[monthlyMonth - 1]} {monthlyYear}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* ── DAY-WISE SUMMARY ── */}
        <div className="medical-card overflow-hidden">
          <button onClick={() => setShowSummary(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-600" />
              <span className="font-semibold text-slate-800">Day-wise Collection Summary</span>
              <span className="text-xs text-slate-500 ml-1">({allDates.length} days)</span>
            </div>
            {showSummary ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </button>
          {showSummary && (
            <div className="border-t border-slate-100">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 font-semibold text-slate-500">Date</th>
                    <th className="px-6 py-3 font-semibold text-slate-500">Patients</th>
                    <th className="px-6 py-3 font-semibold text-slate-500 text-right">Collection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allDates.length === 0
                    ? <tr><td colSpan={3} className="px-6 py-6 text-center text-slate-400">No data yet</td></tr>
                    : allDates.map(d => (
                      <tr key={d.date} onClick={() => setSelectedDate(d.date)}
                        className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                        <td className="px-6 py-3 font-medium text-slate-700">
                          {format(new Date(d.date + "T00:00:00"), "dd MMM yyyy")}
                          {d.date === format(new Date(), "yyyy-MM-dd") && (
                            <span className="ml-2 text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded font-bold">Today</span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-slate-600">{d.count} patients</td>
                        <td className="px-6 py-3 text-right font-semibold text-emerald-700">{formatCurrency(d.totalFees)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── WHATSAPP DAILY REPORT MODAL ── */}
      {showWaReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 bg-green-50 rounded-t-2xl">
              <div className="w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">Send Daily Report</p>
                <p className="text-xs text-slate-500">
                  {format(new Date(selectedDate + "T00:00:00"), "dd MMM yyyy")}
                </p>
              </div>
              <button onClick={() => setShowWaReport(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Preview */}
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Report Preview</p>
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                  {buildDailyReportMsg()}
                </div>
              </div>

              {/* Optional note */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                  Add a Note (optional)
                </label>
                <textarea
                  value={waCustomNote}
                  onChange={e => setWaCustomNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. Camp tomorrow, Holiday notice..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 text-sm resize-none"
                />
              </div>

              {/* Stats summary strip */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Total", value: stats?.totalPatients || 0, color: "bg-blue-50 text-blue-700" },
                  { label: "General", value: (stats?.patients || []).filter(p => p.registerType !== "ayurvedic").length, color: "bg-slate-50 text-slate-700" },
                  { label: "Ayurvedic", value: (stats?.patients || []).filter(p => p.registerType === "ayurvedic").length, color: "bg-emerald-50 text-emerald-700" },
                ].map(s => (
                  <div key={s.label} className={`rounded-xl p-3 text-center ${s.color}`}>
                    <p className="text-xl font-bold">{s.value}</p>
                    <p className="text-xs font-semibold mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <p className="text-xl font-bold text-amber-700">₹{(stats?.totalFees || 0).toLocaleString("en-IN")}</p>
                <p className="text-xs font-semibold text-amber-600 mt-0.5">Total Collection</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-emerald-50 p-3 text-center border border-emerald-100">
                  <p className="text-lg font-bold text-emerald-700">₹{(stats?.patients || []).filter(p => p.paymentMode !== "online").reduce((s, p) => s + (p.fees || 0), 0).toLocaleString("en-IN")}</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-0.5">💵 Cash</p>
                </div>
                <div className="rounded-xl bg-blue-50 p-3 text-center border border-blue-100">
                  <p className="text-lg font-bold text-blue-700">₹{(stats?.patients || []).filter(p => p.paymentMode === "online").reduce((s, p) => s + (p.fees || 0), 0).toLocaleString("en-IN")}</p>
                  <p className="text-xs font-semibold text-blue-600 mt-0.5">📱 Online</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => setShowWaReport(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm">
                Cancel
              </button>
              <button onClick={handleSendDailyReport}
                className="flex-1 py-2.5 rounded-xl bg-green-500 text-white font-bold hover:bg-green-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/25 text-sm">
                <Send className="w-4 h-4" /> Send on WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT DIALOG ── */}
      <Dialog open={!!editingPatient} onOpenChange={open => !open && setEditingPatient(null)}>
        <DialogContent className="max-w-md bg-white rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Patient Visit</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Name</label>
                <input {...editForm.register("name")} className="w-full px-3 py-2 rounded-xl border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Mobile / Case No.</label>
                <input {...editForm.register("mobile")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none font-mono" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Age (yrs / mo)</label>
                <div className="flex gap-1">
                  <input type="number" {...editForm.register("age")} className="w-full px-2 py-2 rounded-xl border focus:border-primary outline-none" placeholder="yrs" />
                  <input type="number" {...editForm.register("ageMonths")} className="w-16 px-2 py-2 rounded-xl border focus:border-primary outline-none" placeholder="mo" min={0} max={11} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Weight</label>
                <input {...editForm.register("weight")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" placeholder="e.g. 65 kg" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Address</label>
              <input {...editForm.register("address")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Complaint Code</label>
              <input {...editForm.register("complaintCode")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none uppercase" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Complaint</label>
              <input {...editForm.register("complaint")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Treatment</label>
              <textarea {...editForm.register("treatment")} rows={2} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none resize-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Advice (use F5 for follow-up after 5 days)</label>
              <input {...editForm.register("advice")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Reports</label>
              <input {...editForm.register("reports")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Fees (₹)</label>
              <input type="number" {...editForm.register("fees")} className="w-full px-3 py-2 rounded-xl border focus:border-primary outline-none" />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={() => setEditingPatient(null)} className="px-4 py-2 rounded-xl font-medium bg-slate-100 hover:bg-slate-200 text-slate-700">Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-xl font-medium bg-primary text-white shadow-md hover:bg-primary/90">Save Changes</button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
