import { cn } from "../lib/utils";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Wifi, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronLeft,
  RefreshCw,
  ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../lib/firebase";

interface AttendancePageProps {
  userData: any;
}

export default function AttendancePage({ userData }: AttendancePageProps) {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [company, setCompany] = useState<any>(null);
  const [status, setStatus] = useState<'checking' | 'ready' | 'success' | 'error'>('checking');
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchCompanyInfo();
    getCurrentLocation();
    return () => clearInterval(timer);
  }, []);

  const fetchCompanyInfo = async () => {
    if (!userData?.companyId) {
      setStatus('error');
      setErrorMsg("Chưa thiết lập chi nhánh");
      return;
    }
    try {
      const q = query(collection(db, "companies"), where("__name__", "==", userData.companyId), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setCompany(snap.docs[0].data());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getCurrentLocation = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      toast.error("Trình duyệt không hỗ trợ GPS");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsLocating(false);
        setStatus('ready');
      },
      (err) => {
        console.error(err);
        toast.error("Không thể lấy vị trí GPS");
        setIsLocating(false);
        setStatus('error');
        setErrorMsg("Vui lòng bật GPS để chấm công");
      },
      { enableHighAccuracy: true }
    );
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // in metres
  };

  const handleCheckIn = async () => {
    if (!location || !company) return;

    const distance = calculateDistance(location.lat, location.lng, company.lat, company.lng);
    
    if (distance > (company.radius || 100)) {
      toast.error(`Bạn đang ở quá xa vị trí chấm công (${Math.round(distance)}m)`);
      return;
    }

    try {
      setStatus('checking');
      await addDoc(collection(db, "attendance"), {
        userId: userData.uid,
        companyId: userData.companyId,
        checkInTime: new Date().toISOString(),
        location: location,
        date: format(new Date(), "yyyy-MM-dd"),
        status: "on_time", // Logic for late can be added here
        createdAt: new Date().toISOString()
      });
      
      setStatus('success');
      toast.success("Chấm công thành công!");
      setTimeout(() => navigate("/"), 2000);
    } catch (e: any) {
      toast.error("Lỗi: " + e.message);
      setStatus('ready');
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate("/")} className="p-2 -ml-2 text-slate-600">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Chấm công</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-12">
        {/* Clock Display */}
        <div className="text-center space-y-2">
          <h2 className="text-6xl font-bold tracking-tighter text-slate-900">
            {format(currentTime, "HH:mm")}
          </h2>
          <p className="text-slate-500 font-medium">
            {format(currentTime, "EEEE, dd MMMM, yyyy", { locale: vi })}
          </p>
        </div>

        {/* Status Indicators */}
        <div className="w-full max-w-sm grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
            <Wifi size={20} className="text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">WIFI</span>
            <span className="text-xs font-bold text-slate-600">SmartCheck_Office</span>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
            <MapPin size={20} className={cn("transition-colors", location ? "text-blue-600" : "text-slate-400")} />
            <span className="text-[10px] font-bold text-slate-400 uppercase">VỊ TRÍ GPS</span>
            <span className="text-xs font-bold text-slate-600">
              {isLocating ? "Đang định vị..." : location ? "Đã xác định" : "Chưa có vị trí"}
            </span>
          </div>
        </div>

        {/* Main Check-in Button */}
        <div className="relative">
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="success"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-48 h-48 bg-emerald-500 rounded-full flex flex-col items-center justify-center text-white shadow-2xl shadow-emerald-200 border-8 border-emerald-50"
              >
                <CheckCircle2 size={64} />
                <span className="font-bold mt-2 uppercase tracking-widest text-sm">Thành công</span>
              </motion.div>
            ) : (
              <motion.button
                key="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCheckIn}
                disabled={status === 'checking' || !location}
                className={cn(
                  "w-48 h-48 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all border-8 border-slate-50",
                  location ? "bg-blue-600 shadow-blue-200" : "bg-slate-300 shadow-none cursor-not-allowed"
                )}
              >
                {status === 'checking' ? (
                  <RefreshCw size={48} className="animate-spin" />
                ) : (
                  <>
                    <span className="text-2xl font-black uppercase tracking-tighter">CHECK-IN</span>
                    <span className="text-[10px] font-bold opacity-70 mt-1">Bấm để chấm công</span>
                  </>
                )}
              </motion.button>
            )}
          </AnimatePresence>
          
          {/* Pulse Effect */}
          {location && status === 'ready' && (
            <div className="absolute inset-0 -z-10 animate-ping rounded-full bg-blue-400 opacity-20"></div>
          )}
        </div>

        {/* Info Banner */}
        <div className="w-full max-w-sm">
          {location ? (
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
              <ShieldCheck className="text-blue-600 shrink-0" size={20} />
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-900 uppercase">Vị trí hợp lệ</p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Bạn đang ở trong khu vực cho phép của {company?.name || "chi nhánh"}.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
              <AlertTriangle className="text-amber-600 shrink-0" size={20} />
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-900 uppercase">Chưa có vị trí</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">
                  Vui lòng cho phép truy cập GPS để hệ thống xác minh vị trí của bạn.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="p-6 text-center">
        <button 
          onClick={getCurrentLocation}
          className="text-blue-600 text-sm font-bold flex items-center justify-center gap-2 mx-auto"
        >
          <RefreshCw size={16} />
          Cập nhật lại vị trí
        </button>
      </footer>
    </div>
  );
}
