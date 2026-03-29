import { auth } from "../lib/firebase";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Shield, Mail, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ProfilePageProps {
  userData: any;
}

export default function ProfilePage({ userData }: ProfilePageProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center gap-4 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="text-slate-600">
          <User size={24} />
        </button>
        <h1 className="text-xl font-bold text-slate-800">Tài khoản</h1>
      </header>

      <main className="p-6 space-y-6 max-w-md mx-auto">
        {/* Profile Card */}
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm text-center space-y-4">
          <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto flex items-center justify-center text-blue-600">
            <User size={48} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{userData?.displayName || "Người dùng"}</h2>
            <p className="text-slate-500">{userData?.email}</p>
          </div>
          <div className="inline-flex px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
            {userData?.role || "Nhân viên"}
          </div>
        </div>

        {/* Info List */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden divide-y divide-slate-50">
          <InfoItem icon={<Mail size={20} />} label="Email" value={userData?.email} />
          <InfoItem icon={<Shield size={20} />} label="Vai trò" value={userData?.role} />
          <InfoItem icon={<Calendar size={20} />} label="Ngày tham gia" value={userData?.createdAt ? format(new Date(userData.createdAt), "dd/MM/yyyy") : "—"} />
        </div>

        {/* Admin Shortcuts */}
        {(userData?.role === 'company_admin' || userData?.role === 'super_admin') && (
          <button 
            onClick={() => navigate(userData.role === 'super_admin' ? "/super-admin" : "/admin")}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-200"
          >
            <Shield size={20} />
            TRANG QUẢN TRỊ
          </button>
        )}

        <button 
          onClick={handleLogout}
          className="w-full py-4 bg-white border border-rose-100 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2"
        >
          <LogOut size={20} />
          ĐĂNG XUẤT
        </button>
      </main>
    </div>
  );
}

function InfoItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4 p-5">
      <div className="text-slate-400">{icon}</div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-slate-700 font-medium">{value}</p>
      </div>
    </div>
  );
}
