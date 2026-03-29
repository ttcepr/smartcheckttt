import React, { useState, useEffect } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { 
  Building2, 
  Plus, 
  Trash2, 
  Search, 
  Globe, 
  ShieldCheck,
  MoreVertical,
  Activity
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export default function SuperAdminDashboard() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [newCompany, setNewCompany] = useState({ name: "", address: "", lat: 0, lng: 0, radius: 100 });
  const [adminEmail, setAdminEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    const snap = await getDocs(collection(db, "companies"));
    setCompanies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    setLoading(false);
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCompany) {
        await updateDoc(doc(db, "companies", editingCompany.id), {
          ...newCompany,
          updatedAt: new Date().toISOString()
        });
        toast.success("Đã cập nhật công ty!");
      } else {
        const companyRef = await addDoc(collection(db, "companies"), {
          ...newCompany,
          createdAt: new Date().toISOString()
        });

        if (adminEmail) {
          await addDoc(collection(db, "users"), {
            email: adminEmail,
            role: "company_admin",
            companyId: companyRef.id,
            displayName: "Admin " + newCompany.name,
            mustChangePassword: true,
            createdAt: new Date().toISOString()
          });
        }
        toast.success("Đã thêm công ty và tài khoản quản trị mặc định (MK: 123)!");
      }

      setShowAddModal(false);
      setEditingCompany(null);
      setNewCompany({ name: "", address: "", lat: 0, lng: 0, radius: 100 });
      setAdminEmail("");
      fetchCompanies();
    } catch (e: any) {
      toast.error("Lỗi: " + e.message);
    }
  };

  const handleDeleteCompany = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa công ty này?")) return;
    try {
      await deleteDoc(doc(db, "companies", id));
      toast.success("Đã xóa công ty!");
      fetchCompanies();
    } catch (e: any) {
      toast.error("Lỗi khi xóa: " + e.message);
    }
  };

  const openEditModal = (company: any) => {
    setEditingCompany(company);
    setNewCompany({
      name: company.name,
      address: company.address,
      lat: company.lat,
      lng: company.lng,
      radius: company.radius
    });
    setShowAddModal(true);
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Globe size={24} />
          </div>
          <div>
            <h1 className="font-bold text-xl">Hệ thống SmartCheck</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Super Admin Console</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Tìm kiếm công ty..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 border-transparent rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => {
              setEditingCompany(null);
              setNewCompany({ name: "", address: "", lat: 0, lng: 0, radius: 100 });
              setShowAddModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            THÊM CÔNG TY
          </button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Building2 size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Tổng công ty</p>
              <p className="text-2xl font-bold">{companies.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Đang hoạt động</p>
              <p className="text-2xl font-bold">{companies.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase">Bảo mật</p>
              <p className="text-2xl font-bold">Standard</p>
            </div>
          </div>
        </div>

        {/* Company List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Danh sách các chi nhánh & công ty</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-6 gap-6">
            {filteredCompanies.map(company => (
              <div key={company.id} className="group bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:shadow-blue-50 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors">
                    <Building2 size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(company)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCompany(company.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-900 mb-1">{company.name}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-1">{company.address}</p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase">
                  <span className="flex items-center gap-1"><ShieldCheck size={12} /> ID: {company.id.slice(0, 6)}</span>
                  <span className="flex items-center gap-1"><Globe size={12} /> {company.radius}m Radius</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 space-y-6 shadow-2xl">
            <h2 className="text-2xl font-bold">{editingCompany ? "Cập nhật công ty" : "Thêm công ty mới"}</h2>
            <form onSubmit={handleAddCompany} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Tên công ty</label>
                <input 
                  required
                  type="text" 
                  value={newCompany.name}
                  onChange={e => setNewCompany({...newCompany, name: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Địa chỉ</label>
                <input 
                  required
                  type="text" 
                  value={newCompany.address}
                  onChange={e => setNewCompany({...newCompany, address: e.target.value})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Vĩ độ</label>
                  <input 
                    required
                    type="number" step="any"
                    value={newCompany.lat}
                    onChange={e => setNewCompany({...newCompany, lat: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Kinh độ</label>
                  <input 
                    required
                    type="number" step="any"
                    value={newCompany.lng}
                    onChange={e => setNewCompany({...newCompany, lng: parseFloat(e.target.value)})}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase">Bán kính chấm công (m)</label>
                <input 
                  required
                  type="number"
                  value={newCompany.radius}
                  onChange={e => setNewCompany({...newCompany, radius: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              {!editingCompany && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">Email quản trị (Admin)</label>
                  <input 
                    required
                    type="email" 
                    value={adminEmail}
                    onChange={e => setAdminEmail(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="admin@thaithanhthanh.com"
                  />
                </div>
              )}
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingCompany(null);
                  }}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl"
                >
                  HỦY
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200"
                >
                  {editingCompany ? "CẬP NHẬT" : "TẠO MỚI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
