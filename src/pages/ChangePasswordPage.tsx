import React, { useState } from "react";
import { updatePassword } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { toast } from "sonner";
import { ShieldCheck, Lock, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

interface ChangePasswordPageProps {
  userData: any;
}

export default function ChangePasswordPage({ userData }: ChangePasswordPageProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      if (user) {
        await updatePassword(user, newPassword);
        
        // Update Firestore
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, {
          mustChangePassword: false
        });
        
        toast.success("Đổi mật khẩu thành công!");
        // App.tsx will automatically re-render and show the dashboard
      }
    } catch (error: any) {
      toast.error("Lỗi: " + error.message);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("Vui lòng đăng nhập lại để thực hiện thao tác này.");
        auth.signOut();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100 space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200 mb-4">
            <Lock size={32} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Đổi mật khẩu</h1>
          <p className="text-slate-500 text-sm">
            Đây là lần đầu bạn đăng nhập. Vui lòng đổi mật khẩu để tiếp tục.
          </p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Mật khẩu mới</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Xác nhận mật khẩu</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Đang xử lý..." : "CẬP NHẬT MẬT KHẨU"}
            <CheckCircle2 size={18} />
          </button>
        </form>

        <button 
          onClick={() => auth.signOut()}
          className="w-full text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
        >
          Đăng xuất
        </button>
      </motion.div>
    </div>
  );
}
