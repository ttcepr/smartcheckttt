import React, { useState } from "react";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, query, where, getDocs, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";
import { LogIn, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user exists in Firestore
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        // Create default user profile
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          role: "employee", // Default role
          companyId: "", // To be assigned
          createdAt: new Date().toISOString()
        });
        toast.success("Tài khoản mới đã được tạo!");
      } else {
        toast.success("Đăng nhập thành công!");
      }
    } catch (error: any) {
      toast.error("Lỗi đăng nhập: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Handle default credentials for Super Admin if not yet created
      if (email === "admin@thaithaothanh.com" && password === "admin") {
        const superAdminPassword = "admin123"; // Firebase requires at least 6 chars
        try {
          await signInWithEmailAndPassword(auth, email, superAdminPassword);
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            // Try to create the super admin account
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, superAdminPassword);
              await setDoc(doc(db, "users", userCredential.user.uid), {
                email,
                role: "super_admin",
                displayName: "Super Admin",
                createdAt: new Date().toISOString()
              });
            } catch (createErr: any) {
              // If creation fails, it might be because the user exists but password was wrong
              if (createErr.code === 'auth/email-already-in-use') {
                throw new Error("Sai mật khẩu Super Admin!");
              }
              throw createErr;
            }
          } else {
            throw err;
          }
        }
        toast.success("Chào mừng Super Admin!");
        return;
      }

      // Handle default credentials for Company Admin (password 123 -> 123456 for Firebase requirements)
      let loginPassword = password;
      if (password === "123") {
        loginPassword = "123456"; // Firebase requires at least 6 chars
      }

      try {
        await signInWithEmailAndPassword(auth, email, loginPassword);
        toast.success("Đăng nhập thành công!");
      } catch (err: any) {
        // If user not found in Auth but exists in Firestore (pre-created by Super Admin)
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          const q = query(collection(db, "users"), where("email", "==", email));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const userData = snap.docs[0].data();
            if (userData.mustChangePassword && password === "123") {
              // Auto-create the Auth account for the pre-authorized user
              try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, "123456");
                // Update the Firestore document with the new UID
                await setDoc(doc(db, "users", userCredential.user.uid), {
                  ...userData,
                  uid: userCredential.user.uid
                });
                // Delete the old document (the one without the correct UID)
                await deleteDoc(snap.docs[0].ref);
                toast.success("Chào mừng bạn lần đầu đăng nhập!");
                return;
              } catch (createErr: any) {
                if (createErr.code === 'auth/email-already-in-use') {
                  throw new Error("Sai mật khẩu!");
                }
                throw createErr;
              }
            }
          }
        }
        throw new Error("Sai email hoặc mật khẩu!");
      }
    } catch (error: any) {
      toast.error("Lỗi đăng nhập: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">SmartCheck</h1>
          <p className="text-slate-500">Hệ thống chấm công thông minh</p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="admin@company.vn"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Đang xử lý..." : "ĐĂNG NHẬP"}
            <LogIn size={18} />
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Hoặc tiếp tục với</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-all flex items-center justify-center gap-3"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Google Account
        </button>
      </motion.div>
    </div>
  );
}
