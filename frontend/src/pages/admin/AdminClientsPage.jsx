import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Building,
  Plus,
  Search,
  RotateCcw,
  Bot,
  PhoneCall,
  Calendar,
  CheckCircle2,
  XCircle,
  Eye,
  Edit2,
  Lock,
  Mail,
  Shield,
  Activity,
  CreditCard,
  Clock,
  Sparkles,
  LogIn,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { io } from 'socket.io-client';

export const AdminClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [inspectDetails, setInspectDetails] = useState(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newClientData, setNewClientData] = useState({
    name: '',
    ownerName: '',
    ownerEmail: '',
    password: 'password123',
    plan: 'growth',
    minutesAllowance: 1000,
  });

  const [editClientData, setEditClientData] = useState({
    name: '',
    plan: 'growth',
    minutesAllowance: 1000,
  });

  const toast = useToast();
  const { impersonateClient } = useAuth();
  const navigate = useNavigate();

  const handleImpersonate = (client) => {
    impersonateClient(client);
    toast.success(`Switched to ${client.name} workspace (Impersonation Mode)`);
    navigate('/app/dashboard');
  };

  useEffect(() => {
    fetchClients();

    const socketUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      socket.emit('join_admin');
    });

    socket.on('admin_client_created', () => {
      fetchClients();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/clients');
      if (res?.data) {
        setClients(res.data);
      }
    } catch (err) {
      toast.error('Failed to load agency clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await api.post('/admin/clients', newClientData);
      if (res?.success) {
        toast.success(res.message || 'Client provisioned successfully!');
        setCreateModalOpen(false);
        setNewClientData({
          name: '',
          ownerName: '',
          ownerEmail: '',
          password: 'password123',
          plan: 'growth',
          minutesAllowance: 1000,
        });
        fetchClients();
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to create client');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (client) => {
    const actionName = client.status === 'suspended' ? 'activate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${actionName} "${client.name}"?`)) return;

    try {
      const res = await api.put(`/admin/clients/${client.id || client._id}/toggle-status`);
      if (res?.success) {
        toast.success(res.message || `Client status updated to ${res.status}`);
        fetchClients();
      }
    } catch (err) {
      toast.error('Failed to update client status');
    }
  };

  const openInspectModal = async (client) => {
    setSelectedClient(client);
    setInspectModalOpen(true);
    setInspectLoading(true);
    try {
      const res = await api.get(`/admin/clients/${client.id || client._id}`);
      if (res?.data) {
        setInspectDetails(res.data);
      }
    } catch (err) {
      toast.error('Failed to fetch detailed client workspace');
    } finally {
      setInspectLoading(false);
    }
  };

  const openEditModal = (client) => {
    setSelectedClient(client);
    setEditClientData({
      name: client.name,
      plan: client.plan,
      minutesAllowance: client.minutesAllowance || 1000,
    });
    setEditModalOpen(true);
  };

  const handleUpdateClient = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      setIsSubmitting(true);
      const res = await api.put(`/admin/clients/${selectedClient.id || selectedClient._id}`, editClientData);
      if (res?.success) {
        toast.success('Client updated successfully');
        setEditModalOpen(false);
        fetchClients();
      }
    } catch (err) {
      toast.error('Failed to update client');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.owner?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.owner?.email?.toLowerCase().includes(search.toLowerCase());

    const matchesPlan = filterPlan === 'all' || c.plan === filterPlan;
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  const totalMinutes = clients.reduce((sum, c) => sum + (c.minutesUsed || 0), 0);
  const totalCalls = clients.reduce((sum, c) => sum + (c.callCount || 0), 0);
  const activeCount = clients.filter((c) => c.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded border border-emerald-500/30">
              Agency Management
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Client Workspaces</h1>
          <p className="text-xs text-gray-400 mt-1">
            Provision, manage, and monitor all multi-tenant voice client organizations across your platform.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={RotateCcw} onClick={fetchClients} isLoading={loading}>
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setCreateModalOpen(true)}
            className="shadow-glow"
          >
            Provision New Client
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Total Clients</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{clients.length}</div>
          <span className="text-[10px] text-emerald-400 font-medium mt-1 block">
            {activeCount} Active • {clients.length - activeCount} Suspended
          </span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Active AI Agents</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">
            {clients.reduce((sum, c) => sum + (c.agentCount || 0), 0)}
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block">Across all sub-accounts</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Voice Minutes Consumed</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{totalMinutes.toLocaleString()} m</div>
          <span className="text-[10px] text-amber-400 mt-1 block">Telecom usage tracked</span>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-[#0c0c0e] to-[#141418]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-medium">Calls Completed</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white font-mono">{totalCalls.toLocaleString()}</div>
          <span className="text-[10px] text-purple-400 mt-1 block">Total client interactions</span>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-3 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by client or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#08080a] border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="bg-[#08080a] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="business">Business</option>
            <option value="enterprise">Enterprise</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#08080a] border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Clients Table / Grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#08080a] border-b border-slate-800 text-gray-400 uppercase tracking-wider font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Client Organization</th>
                <th className="py-3 px-4">Owner / Contact</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Voice Minutes</th>
                <th className="py-3 px-4 text-center">Agents</th>
                <th className="py-3 px-4 text-center">Calls</th>
                <th className="py-3 px-4 text-center">Leads</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-gray-500">
                    <Building className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
                    No client workspaces found. Provision a new client to get started.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const used = client.minutesUsed || 0;
                  const allowance = client.minutesAllowance || 1000;
                  const pct = Math.min(100, Math.round((used / allowance) * 100));

                  return (
                    <tr key={client.id || client._id} className="hover:bg-[#101014] transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold flex items-center justify-center shrink-0 border border-emerald-500/25">
                            {client.name?.[0] || 'C'}
                          </div>
                          <div>
                            <span className="font-bold text-white block leading-tight">{client.name}</span>
                            <span className="text-[10px] text-gray-500 font-mono">/{client.slug || 'client'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-300">
                        <span className="font-medium text-white block">{client.owner?.name || 'Owner'}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{client.owner?.email || 'N/A'}</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            client.plan === 'enterprise'
                              ? 'purple'
                              : client.plan === 'business'
                              ? 'indigo'
                              : 'cyan'
                          }
                          size="xs"
                        >
                          <span className="capitalize">{client.plan || 'Growth'}</span>
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center justify-between text-[10px] font-mono mb-1 text-gray-400">
                          <span>{used} m</span>
                          <span className="text-gray-500">{allowance} m</span>
                        </div>
                        <div className="w-full bg-[#18181c] h-1.5 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct > 90 ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                        {client.agentCount || 0}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                        {client.callCount || 0}
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-white">
                        {client.leadCount || 0}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <Badge variant={client.status === 'active' ? 'emerald' : 'rose'} size="xs">
                          {client.status === 'active' ? 'Active' : 'Suspended'}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleImpersonate(client)}
                            className="px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 border border-amber-500/30 transition flex items-center gap-1 text-[11px] font-semibold"
                            title={`Impersonate / Log in as ${client.name}`}
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span className="hidden xl:inline">Impersonate</span>
                          </button>
                          <button
                            onClick={() => openInspectModal(client)}
                            className="p-1.5 rounded-lg bg-[#141418] hover:bg-[#1e1e24] text-gray-300 hover:text-white border border-slate-800 transition"
                            title="Inspect Client Workspace"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(client)}
                            className="p-1.5 rounded-lg bg-[#141418] hover:bg-[#1e1e24] text-emerald-400 hover:text-emerald-300 border border-slate-800 transition"
                            title="Edit Plan & Minutes"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(client)}
                            className={`p-1.5 rounded-lg border transition ${
                              client.status === 'active'
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                            }`}
                            title={client.status === 'active' ? 'Suspend Client' : 'Activate Client'}
                          >
                            {client.status === 'active' ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Provision Client Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Provision New Voice Client"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateClient} className="space-y-4 text-left text-xs">
          <div>
            <label className="block text-gray-300 font-semibold mb-1">Company / Organization Name *</label>
            <input
              type="text"
              required
              placeholder="Premier Dental Clinic"
              value={newClientData.name}
              onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
              className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Owner Contact Name *</label>
              <input
                type="text"
                required
                placeholder="Dr. Sarah Jenkins"
                value={newClientData.ownerName}
                onChange={(e) => setNewClientData({ ...newClientData, ownerName: e.target.value })}
                className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Owner Email *</label>
              <input
                type="email"
                required
                placeholder="sarah@premierdental.com"
                value={newClientData.ownerEmail}
                onChange={(e) => setNewClientData({ ...newClientData, ownerEmail: e.target.value })}
                className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 font-semibold mb-1">Temporary Password *</label>
            <input
              type="text"
              required
              placeholder="password123"
              value={newClientData.password}
              onChange={(e) => setNewClientData({ ...newClientData, password: e.target.value })}
              className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Subscription Plan</label>
              <select
                value={newClientData.plan}
                onChange={(e) => setNewClientData({ ...newClientData, plan: e.target.value })}
                className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="starter">Starter (500 min)</option>
                <option value="growth">Growth (1,000 min)</option>
                <option value="business">Business (2,500 min)</option>
                <option value="enterprise">Enterprise (10,000 min)</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Minutes Allowance</label>
              <input
                type="number"
                required
                value={newClientData.minutesAllowance}
                onChange={(e) => setNewClientData({ ...newClientData, minutesAllowance: e.target.value })}
                className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              A dedicated AI Receptionist (Sarah) and isolated multi-tenant database workspace will be provisioned automatically for this client.
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Provision Client
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Client Plan/Minutes Modal */}
      {selectedClient && (
        <Modal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          title={`Edit Client: ${selectedClient.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleUpdateClient} className="space-y-4 text-left text-xs">
            <div>
              <label className="block text-gray-300 font-semibold mb-1">Company Name</label>
              <input
                type="text"
                required
                value={editClientData.name}
                onChange={(e) => setEditClientData({ ...editClientData, name: e.target.value })}
                className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Plan</label>
              <select
                value={editClientData.plan}
                onChange={(e) => setEditClientData({ ...editClientData, plan: e.target.value })}
                className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="starter">Starter</option>
                <option value="growth">Growth</option>
                <option value="business">Business</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-300 font-semibold mb-1">Minutes Allowance</label>
              <input
                type="number"
                required
                value={editClientData.minutesAllowance}
                onChange={(e) => setEditClientData({ ...editClientData, minutesAllowance: e.target.value })}
                className="w-full bg-[#08080a] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" size="sm" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Inspect Workspace Modal */}
      {selectedClient && (
        <Modal
          isOpen={inspectModalOpen}
          onClose={() => setInspectModalOpen(false)}
          title={`Workspace Inspection: ${selectedClient.name}`}
          maxWidth="max-w-2xl"
        >
          {inspectLoading ? (
            <div className="py-12 text-center text-gray-400">Loading client workspace telemetry...</div>
          ) : inspectDetails ? (
            <div className="space-y-4 text-left text-xs">
              {/* Client Info Header */}
              <div className="p-4 rounded-xl bg-[#08080a] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-base">{inspectDetails.organization?.name}</h3>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Owner: {inspectDetails.owner?.name} ({inspectDetails.owner?.email})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={inspectDetails.organization?.status === 'active' ? 'emerald' : 'rose'} size="sm">
                    {inspectDetails.organization?.status || 'active'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="xs"
                    icon={LogIn}
                    className="border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
                    onClick={() => {
                      setInspectModalOpen(false);
                      handleImpersonate(selectedClient);
                    }}
                  >
                    Log in as Client
                  </Button>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-2">
                <div className="p-3 rounded-xl bg-[#0c0c0e] border border-slate-800">
                  <span className="text-[10px] text-gray-500 uppercase block">Agents</span>
                  <span className="font-bold text-white text-base">{inspectDetails.stats?.agentCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0c0c0e] border border-slate-800">
                  <span className="text-[10px] text-gray-500 uppercase block">Total Calls</span>
                  <span className="font-bold text-white text-base">{inspectDetails.stats?.callCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0c0c0e] border border-slate-800">
                  <span className="text-[10px] text-gray-500 uppercase block">CRM Leads</span>
                  <span className="font-bold text-white text-base">{inspectDetails.stats?.leadCount}</span>
                </div>
                <div className="p-3 rounded-xl bg-[#0c0c0e] border border-slate-800">
                  <span className="text-[10px] text-gray-500 uppercase block">Appointments</span>
                  <span className="font-bold text-white text-base">{inspectDetails.stats?.appointmentCount}</span>
                </div>
              </div>

              {/* Provisioned Agents */}
              <div>
                <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-emerald-400" /> Provisioned AI Agents
                </h4>
                <div className="space-y-1.5">
                  {inspectDetails.agents?.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[#08080a] text-gray-500 text-center">No agents deployed yet</div>
                  ) : (
                    inspectDetails.agents?.map((a) => (
                      <div
                        key={a._id}
                        className="p-2.5 rounded-xl bg-[#0c0c0e] border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                          <span className="font-semibold text-white">{a.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({a.type})</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-400">{a.phoneNumber}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Recent Calls */}
              <div>
                <h4 className="font-bold text-white mb-2 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-emerald-400" /> Recent Client Calls
                </h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {inspectDetails.recentCalls?.length === 0 ? (
                    <div className="p-3 rounded-xl bg-[#08080a] text-gray-500 text-center">No calls recorded yet</div>
                  ) : (
                    inspectDetails.recentCalls?.map((call) => (
                      <div
                        key={call._id}
                        className="p-2 rounded-lg bg-[#0c0c0e] border border-slate-850 flex items-center justify-between text-[11px]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-white">{call.callerNumber || call.callerName}</span>
                          <span className="text-gray-500">via {call.agentId?.name || 'Sarah'}</span>
                        </div>
                        <Badge variant="cyan" size="xs">
                          {call.status}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </Modal>
      )}
    </div>
  );
};
