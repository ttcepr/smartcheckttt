import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./lib/firebase";

// Pages (to be created)
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AttendancePage from "./pages/AttendancePage";
import AdminDashboard from "./pages/AdminDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import ProfilePage from "./pages/ProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const docRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          // If user exists in Auth but not in Firestore (e.g. first Google login)
          // The LoginPage handles this, but we can also handle it here if needed
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Force password change if required
  if (user && userData?.mustChangePassword) {
    return <ChangePasswordPage userData={userData} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <Routes>
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
          
          <Route path="/" element={user ? <Dashboard userData={userData} /> : <Navigate to="/login" />} />
          <Route path="/attendance" element={user ? <AttendancePage userData={userData} /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <ProfilePage userData={userData} /> : <Navigate to="/login" />} />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/*" 
            element={
              user && (userData?.role === 'company_admin' || userData?.role === 'super_admin') 
                ? <AdminDashboard userData={userData} /> 
                : <Navigate to="/" />
            } 
          />
          
          {/* Super Admin Routes */}
          <Route 
            path="/super-admin/*" 
            element={
              user && userData?.role === 'super_admin' 
                ? <SuperAdminDashboard userData={userData} /> 
                : <Navigate to="/" />
            } 
          />
        </Routes>
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}
