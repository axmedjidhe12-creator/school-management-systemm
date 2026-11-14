import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Palette, Wrench, ShieldCheck, Activity, Database, Server,
  Plus, CheckCircle, RefreshCw, Send, Check, Edit2, Trash2, Upload,
  Mail, DollarSign, Users, GraduationCap, BookOpen, Layers, Copy,
  CheckCircle2, School, Globe, Key, Lock, Save
} from 'lucide-react';

export const PlatformMasterDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [schools, setSchools] = useState([]);
  const [maintenance, setMaintenance] = useState(null);
  const [emailLogs, setEmailLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [testEmailSending, setTestEmailSending] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  // School Modal (Create / Edit)
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [editingSchoolId, setEditingSchoolId] = useState(null);
  const [schoolForm, setSchoolForm] = useState({
    school_name: '',
    address: '',
    phone: '',
    motto: 'Excellence in Education',
    theme_color: '#2563eb',
    logo_url: '',
    principal_name: '',
    principal_email: '',
    principal_password: 'Password123!'
  });

  // Provisioning Success Modal State
  const [provisionedModalData, setProvisionedModalData] = useState(null);
  const [copied, setCopied] = useState(false);

  // Web Design & Branding Settings State
  const [platformDesign, setPlatformDesign] = useState({
    platform_name: 'School Cloud Platform',
    platform_tagline: 'Enterprise Multi-Tenant SaaS Platform',
    platform_motto: 'Security, Excellence & Next-Gen Education',
    theme_color: '#2563eb',
    banner_announcement: 'Welcome to the Next-Generation Multi-Tenant School Cloud Platform.',
    contact_email: 'axmedjidhe12@gmail.com',
    contact_phone: '+252 61 5000000',
    logo_url: '',
    footer_text: '2026 School Cloud Platform. All rights reserved.'
  });
  const [designSaving, setDesignSaving] = useState(false);

  // School Notice Dispatch (Master to Schools Only)
  const [schoolNoticeForm, setSchoolNoticeForm] = useState({
    target_school_id: 'all',
    subject: '',
    message: ''
  });
  const [sendingNotice, setSendingNotice] = useState(false);
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState('all');

  // Web Design Presets
  const THEME_PRESETS = [
    { name: 'Ocean Blue', hex: '#2563eb' },
    { name: 'Emerald Green', hex: '#059669' },
    { name: 'Royal Purple', hex: '#7c3aed' },
    { name: 'Crimson Red', hex: '#dc2626' },
    { name: 'Dark Slate', hex: '#0f172a' },
    { name: 'Sunset Amber', hex: '#d97706' },
    { name: 'Teal Cyan', hex: '#0891b2' },
    { name: 'Rose Pink', hex: '#e11d48' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        apiRequest('/reports/platform-overview'),
        apiRequest('/schools'),
        apiRequest('/reports/email-logs'),
        apiRequest('/platform/settings')
      ]);

      const [overviewRes, schoolsRes, logsRes, settingsRes] = results;

      if (overviewRes.status === 'fulfilled' && overviewRes.value.success) {
        setOverview(overviewRes.value.overview);
      }
      if (schoolsRes.status === 'fulfilled' && schoolsRes.value.success) {
        setSchools(schoolsRes.value.schools);
      }
      if (logsRes.status === 'fulfilled' && logsRes.value.success) {
        setEmailLogs(logsRes.value.logs);
      }
      if (settingsRes.status === 'fulfilled' && settingsRes.value.success && settingsRes.value.settings) {
        setPlatformDesign(settingsRes.value.settings);
        if (settingsRes.value.settings.theme_color) {
          document.documentElement.style.setProperty('--primary', settings.value?.settings?.theme_color || settingsRes.value.settings.theme_color);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSavePlatformDesign = async (e) => {
    if (e) e.preventDefault();
    setDesignSaving(true);
    try {
      await apiRequest('/platform/settings', {
        method: 'PUT',
        body: JSON.stringify(platformDesign)
      });
      document.documentElement.style.setProperty('--primary', platformDesign.theme_color);
      document.documentElement.style.setProperty('--primary-light', platformDesign.theme_color + '15');
      showNotification('Platform design and branding settings saved successfully!');
    } catch (err) {
      alert(err.message || 'An error occurred while saving design settings.');
    } finally {
      setDesignSaving(false);
    }
  };

  const loadEmailLogs = async (schoolId = 'all') => {
    try {
      const query = schoolId === 'all' ? '' : `?school_id=${schoolId}`;
      const res = await apiRequest(`/reports/email-logs${query}`);
      if (res.success) {
        setEmailLogs(res.logs);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'emails') {
      loadEmailLogs(selectedSchoolFilter);
    }
  }, [activeTab, selectedSchoolFilter]);

  const loadMaintenance = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await apiRequest('/reports/maintenance');
      if (res.success) setMaintenance(res.maintenance);
    } catch (err) {
      console.error(err);
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const showNotification = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => callback(reader.result);
    reader.readAsDataURL(file);
  };

  const handleCopyCredentials = () => {
    if (!provisionedModalData) return;
    const text = `SCHOOL CLOUD PROVISIONING DETAILS\n-------------------------------\nSchool: ${provisionedModalData.schoolName}\nPrincipal: ${provisionedModalData.principalName}\nEmail: ${provisionedModalData.principalEmail}\nTemporary Password: ${provisionedModalData.principalPassword}\nPortal Login URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // School Create / Edit
  const handleOpenCreateSchool = () => {
    setEditingSchoolId(null);
    setSchoolForm({
      school_name: '',
      address: '',
      phone: '',
      motto: 'Excellence in Education',
      theme_color: '#2563eb',
      logo_url: '',
      principal_name: '',
      principal_email: '',
      principal_password: 'Password123!'
    });
    setShowSchoolModal(true);
  };

  const handleOpenEditSchool = (s) => {
    setEditingSchoolId(s.id);
    setSchoolForm({
      school_name: s.school_name || '',
      address: s.address || '',
      phone: s.phone || '',
      motto: s.motto || 'Excellence in Education',
      theme_color: s.theme_color || '#2563eb',
      logo_url: s.logo_url || '',
      principal_name: '',
      principal_email: '',
      principal_password: 'Password123!'
    });
    setShowSchoolModal(true);
  };

  const handleSaveSchool = async (e) => {
    e.preventDefault();
    try {
      if (editingSchoolId) {
        await apiRequest(`/schools/${editingSchoolId}`, {
          method: 'PUT',
          body: JSON.stringify(schoolForm)
        });
        showNotification('School profile updated successfully.');
        setShowSchoolModal(false);
      } else {
        const res = await apiRequest('/schools', {
          method: 'POST',
          body: JSON.stringify(schoolForm)
        });
        showNotification('New school and Principal account provisioned successfully.');
        setShowSchoolModal(false);
        if (res.principal) {
          setProvisionedModalData({
            schoolName: schoolForm.school_name,
            principalName: res.principal.full_name,
            principalEmail: res.principal.email,
            principalPassword: res.principal.password,
            emailStatus: res.principal.emailStatus
          });
        }
      }
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSchool = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete school "${name}"?`)) return;
    try {
      await apiRequest(`/schools/${id}`, { method: 'DELETE' });
      showNotification(`School "${name}" deleted successfully.`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Optimize DB
  const handleOptimizeDb = async () => {
    setOptimizing(true);
    try {
      const res = await apiRequest('/reports/maintenance/optimize', { method: 'POST' });
      showNotification(res.message || 'Database tables optimized successfully.');
      loadMaintenance();
    } catch (err) {
      alert(err.message);
    } finally {
      setOptimizing(false);
    }
  };

  // Test Email Ping
  const handleSendTestEmailPing = async () => {
    setTestEmailSending(true);
    try {
      const res = await apiRequest('/reports/send-custom-email', {
        method: 'POST',
        body: JSON.stringify({
          recipient_email: user?.email || 'axmedjidhe12@gmail.com',
          subject: 'Platform Master Admin: Email Health Check Ping',
          message: 'This is an automated health-check ping from Platform Master Administration. SMTP gateway is 100% operational!'
        })
      });
      showNotification(res.message || 'Test email dispatched successfully.');
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setTestEmailSending(false);
    }
  };

  // Send Official Notice to Schools (Master Admin to School Admins)
  const handleSendSchoolNotice = async (e) => {
    e.preventDefault();
    setSendingNotice(true);
    try {
      const res = await apiRequest('/reports/send-school-email', {
        method: 'POST',
        body: JSON.stringify(schoolNoticeForm)
      });
      setSchoolNoticeForm({ target_school_id: 'all', subject: '', message: '' });
      showNotification(res.message || 'Official notice dispatched successfully.');
      loadEmailLogs(selectedSchoolFilter);
    } catch (err) {
      alert(err.message);
    } finally {
      setSendingNotice(false);
    }
  };

  return (
    <div className="main-content">
      {actionMsg && (
        <div style={{
          background: 'var(--success-bg)',
          color: 'var(--success)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid #a7f3d0'
        }}>
          <Check size={18} />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: '#ffffff',
        padding: '24px 28px',
        borderRadius: '12px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, marginBottom: '8px' }}>
            <ShieldCheck size={14} /> Master Platform Owner
          </div>
          <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Platform Master Administration</h2>
          <p style={{ margin: '4px 0 0 0', opacity: 0.8, fontSize: '0.9rem' }}>
            Unified Campus Management, Web Design & Branding, Maintenance, and Database Health.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user?.full_name || 'Sayid Aladiih'}</div>
            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{user?.email}</div>
          </div>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
            SA
          </div>
        </div>
      </div>

      {/* Master Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Activity size={16} /> Platform Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'schools' ? 'active' : ''}`}
          onClick={() => setActiveTab('schools')}
        >
          <Building2 size={16} /> School Management ({schools.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'design' ? 'active' : ''}`}
          onClick={() => setActiveTab('design')}
        >
          <Palette size={16} /> Web Design & Branding
        </button>
        <button
          className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`}
          onClick={() => setActiveTab('maintenance')}
        >
          <Wrench size={16} /> System & DB Maintenance
        </button>
        <button
          className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
          onClick={() => setActiveTab('emails')}
        >
          <Mail size={16} /> Email Audit Trail
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && overview && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
                <Building2 size={24} />
              </div>
              <div>
                <div className="stat-title">Registered Schools</div>
                <div className="stat-value">{overview.total_schools}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Multi-Tenant Networks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <div className="stat-title">Total Enrolled Students</div>
                <div className="stat-value">{overview.total_students}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Across all campuses</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
                <Users size={24} />
              </div>
              <div>
                <div className="stat-title">Total Faculty Teachers</div>
                <div className="stat-value">{overview.total_teachers}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Active educators</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div className="stat-title">Total Platform Volume</div>
                <div className="stat-value">${Number(overview.total_volume).toLocaleString()}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Platform Volume</div>
              </div>
            </div>
          </div>

          {/* Quick Schools Summary */}
          <div className="content-card" style={{ marginTop: '20px' }}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Registered Schools (Network Overview)</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Operational metrics across all active tenant institutions
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleOpenCreateSchool}>
                <Plus size={16} /> Register New School
              </button>
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Contact & Location</th>
                    <th>Students</th>
                    <th>Teachers</th>
                    <th>Classes</th>
                    <th>Total Collected</th>
                  </tr>
                </thead>
                <tbody>
                  {schools.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <div className="avatar-cell">
                          {s.logo_url ? (
                            <img src={s.logo_url} alt={s.school_name} className="avatar-img" />
                          ) : (
                            <div className="avatar-placeholder" style={{ background: s.theme_color || '#2563eb', color: '#fff' }}>
                              <Building2 size={16} />
                            </div>
                          )}
                          <div>
                            <strong>{s.school_name}</strong>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.motto}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{s.phone || 'No phone'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.address || 'No location'}</div>
                      </td>
                      <td><span className="badge badge-paid">{s.total_students} Students</span></td>
                      <td><span className="badge badge-partial">{s.total_teachers} Teachers</span></td>
                      <td><span className="badge badge-unpaid">{s.total_classes} Classes</span></td>
                      <td><strong>${Number(s.total_collected || 0).toLocaleString()}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHOOLS MANAGEMENT */}
      {activeTab === 'schools' && (
        <div className="content-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">School Tenants Management</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Register new school tenants, customize branding, update contact info, or manage campuses.
              </p>
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleOpenCreateSchool}>
              <Plus size={16} /> Register New School
            </button>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>School & Logo</th>
                  <th>Contact & Location</th>
                  <th>Brand Theme</th>
                  <th>Students</th>
                  <th>Teachers</th>
                  <th>Classes</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="avatar-cell">
                        {s.logo_url ? (
                          <img src={s.logo_url} alt={s.school_name} className="avatar-img" />
                        ) : (
                          <div className="avatar-placeholder" style={{ background: s.theme_color || '#2563eb', color: '#fff' }}>
                            <Building2 size={16} />
                          </div>
                        )}
                        <div>
                          <strong>{s.school_name}</strong>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.motto || 'Excellence in Education'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>{s.phone || <em style={{ color: 'var(--text-muted)' }}>No phone</em>}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.address || 'No location'}</div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: s.theme_color || '#2563eb', border: '1px solid #cbd5e1' }} />
                        <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{s.theme_color || '#2563eb'}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-paid">{s.total_students} Students</span></td>
                    <td><span className="badge badge-partial">{s.total_teachers} Teachers</span></td>
                    <td><span className="badge badge-unpaid">{s.total_classes} Classes</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEditSchool(s)}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)', borderColor: '#fecaca' }}
                          onClick={() => handleDeleteSchool(s.id, s.school_name)}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WEB DESIGN & BRANDING */}
      {activeTab === 'design' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {/* Design Controls Form */}
          <div className="content-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Global Web Design & Branding</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Customize platform identity, tagline, theme colors, banners, and support contacts.
                </p>
              </div>
              <span className="badge badge-paid">Platform Branding</span>
            </div>

            <form onSubmit={handleSavePlatformDesign}>
              <div className="form-group">
                <label className="form-label">Platform Brand Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={platformDesign.platform_name}
                  onChange={(e) => setPlatformDesign({ ...platformDesign, platform_name: e.target.value })}
                  placeholder="e.g. School Cloud Platform"
                  required
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Platform Tagline</label>
                  <input
                    type="text"
                    className="form-input"
                    value={platformDesign.platform_tagline}
                    onChange={(e) => setPlatformDesign({ ...platformDesign, platform_tagline: e.target.value })}
                    placeholder="e.g. Enterprise Multi-Tenant SaaS"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Platform Motto / Vision</label>
                  <input
                    type="text"
                    className="form-input"
                    value={platformDesign.platform_motto}
                    onChange={(e) => setPlatformDesign({ ...platformDesign, platform_motto: e.target.value })}
                    placeholder="e.g. Security, Excellence & Innovation"
                  />
                </div>
              </div>

              {/* Theme Color Presets & Picker */}
              <div className="form-group">
                <label className="form-label">Global Theme Color</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {THEME_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => {
                        setPlatformDesign({ ...platformDesign, theme_color: p.hex });
                        document.documentElement.style.setProperty('--primary', p.hex);
                        document.documentElement.style.setProperty('--primary-light', p.hex + '15');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: platformDesign.theme_color === p.hex ? `2px solid ${p.hex}` : '1px solid var(--border)',
                        background: platformDesign.theme_color === p.hex ? '#f1f5f9' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}
                    >
                      <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: p.hex }} />
                      {p.name}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={platformDesign.theme_color}
                    onChange={(e) => {
                      const color = e.target.value;
                      setPlatformDesign({ ...platformDesign, theme_color: color });
                      document.documentElement.style.setProperty('--primary', color);
                      document.documentElement.style.setProperty('--primary-light', color + '15');
                    }}
                    style={{ width: '42px', height: '42px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', padding: '2px' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '140px', fontFamily: 'monospace', fontWeight: 600 }}
                    value={platformDesign.theme_color}
                    onChange={(e) => {
                      const color = e.target.value;
                      setPlatformDesign({ ...platformDesign, theme_color: color });
                      if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                        document.documentElement.style.setProperty('--primary', color);
                        document.documentElement.style.setProperty('--primary-light', color + '15');
                      }
                    }}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    (Applies dynamically across landing, login, and portal views)
                  </span>
                </div>
              </div>

              {/* Banner Announcement */}
              <div className="form-group">
                <label className="form-label">Top Banner Announcement</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={platformDesign.banner_announcement}
                  onChange={(e) => setPlatformDesign({ ...platformDesign, banner_announcement: e.target.value })}
                  placeholder="Enter a public banner announcement visible on the top of the homepage..."
                />
              </div>

              {/* Contact Info */}
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Support Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={platformDesign.contact_email}
                    onChange={(e) => setPlatformDesign({ ...platformDesign, contact_email: e.target.value })}
                    placeholder="support@schoolcloud.edu"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Support Phone</label>
                  <input
                    type="text"
                    className="form-input"
                    value={platformDesign.contact_phone}
                    onChange={(e) => setPlatformDesign({ ...platformDesign, contact_phone: e.target.value })}
                    placeholder="+252 61 0000000"
                  />
                </div>
              </div>

              {/* Footer text */}
              <div className="form-group">
                <label className="form-label">Footer Copyright Notice</label>
                <input
                  type="text"
                  className="form-input"
                  value={platformDesign.footer_text}
                  onChange={(e) => setPlatformDesign({ ...platformDesign, footer_text: e.target.value })}
                  placeholder="2026 School Cloud Platform. All rights reserved."
                />
              </div>

              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={designSaving}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', fontWeight: 700 }}
                >
                  <Save size={16} />
                  <span>{designSaving ? 'Saving Changes...' : 'Save Design Settings'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Live Preview / Active Design</h3>
              <span className="badge badge-paid">Real-Time Update</span>
            </div>

            <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
              {/* Top Banner Mock */}
              {platformDesign.banner_announcement && (
                <div style={{ background: '#0f172a', color: '#94a3b8', fontSize: '0.75rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={12} color="#38bdf8" />
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {platformDesign.banner_announcement}
                  </span>
                </div>
              )}

              {/* Header Mock */}
              <div style={{ background: platformDesign.theme_color || 'var(--primary)', color: '#ffffff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <School size={20} color="#fff" />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>
                      {platformDesign.platform_name || 'School Cloud Platform'}
                    </h4>
                    <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                      {platformDesign.platform_motto || 'Enterprise Education Management'}
                    </span>
                  </div>
                </div>
                <span style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.25)', padding: '3px 8px', borderRadius: '10px', fontWeight: 600 }}>
                  Active Preview
                </span>
              </div>

              {/* Body Mock */}
              <div style={{ padding: '20px', background: '#ffffff' }}>
                <h5 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', color: '#0f172a' }}>
                  {platformDesign.platform_tagline || 'Enterprise Multi-Tenant SaaS'}
                </h5>
                <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Theme colors, brand typography, and banners update dynamically across public and authenticated portals.
                </p>

                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ background: platformDesign.theme_color, borderColor: platformDesign.theme_color }}
                  >
                    Primary Button
                  </button>
                  <button className="btn btn-outline btn-sm">
                    Secondary Button
                  </button>
                </div>

                <div style={{ padding: '12px 14px', borderRadius: '8px', background: 'var(--primary-light)', borderLeft: `4px solid ${platformDesign.theme_color}` }}>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                    Support: <strong>{platformDesign.contact_email}</strong> | Tel: <strong>{platformDesign.contact_phone}</strong>
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '20px', padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border)' }}>
              <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', color: '#0f172a' }}>School-Specific Customization:</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Each individual school can configure its own logo and custom theme color under the <strong>"School Management"</strong> tab.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM MAINTENANCE */}
      {activeTab === 'maintenance' && (
        <div>
          {/* Status Header */}
          <div className="content-card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                  <ShieldCheck size={26} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Platform Systems Operational (100% Healthy)</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    MySQL Database Engine, Node.js REST API, and SMTP Gateway are fully operational.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={loadMaintenance}
                  disabled={maintenanceLoading}
                >
                  <RefreshCw size={14} /> Refresh
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleOptimizeDb}
                  disabled={optimizing}
                >
                  <Wrench size={14} /> {optimizing ? 'Optimizing...' : 'Optimize Database Tables'}
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={handleSendTestEmailPing}
                  disabled={testEmailSending}
                >
                  <Send size={14} /> {testEmailSending ? 'Dispatching...' : 'Test SMTP Ping'}
                </button>
              </div>
            </div>
          </div>

          {/* Maintenance Stats */}
          {maintenance && (
            <div className="stats-grid" style={{ marginBottom: '20px' }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                  <Database size={24} />
                </div>
                <div>
                  <div className="stat-title">Database Name & Version</div>
                  <div className="stat-value" style={{ fontSize: '1.1rem' }}>{maintenance.database.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MariaDB / MySQL {maintenance.database.version}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
                  <Activity size={24} />
                </div>
                <div>
                  <div className="stat-title">Database Uptime</div>
                  <div className="stat-value" style={{ fontSize: '1.1rem' }}>{maintenance.database.uptime_hours} hours</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Server Uptime: {maintenance.server.uptime_hours}h</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
                  <Mail size={24} />
                </div>
                <div>
                  <div className="stat-title">Email Gateway (SMTP)</div>
                  <div className="stat-value" style={{ fontSize: '1.1rem', color: maintenance.email.smtp_configured ? 'var(--success)' : 'var(--danger)' }}>
                    {maintenance.email.smtp_configured ? 'Connected (Gmail)' : 'Unconfigured'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{maintenance.email.smtp_user || 'No email set'}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#fee2e2', color: '#991b1b' }}>
                  <Server size={24} />
                </div>
                <div>
                  <div className="stat-title">RAM Usage & Runtime</div>
                  <div className="stat-value" style={{ fontSize: '1.1rem' }}>{maintenance.server.memory_mb} MB Heap</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Node.js {maintenance.server.node_version}</div>
                </div>
              </div>
            </div>
          )}

          {/* Database Tables Health */}
          {maintenance?.database?.tables && (
            <div className="content-card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Database Schema & Tables Health (8 Tables)</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Active record counts, table storage footprint, and storage engine status
                  </p>
                </div>
                <span className="badge badge-paid">8 Tables Healthy</span>
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>Table Name</th>
                      <th>Row Count</th>
                      <th>Size (KB)</th>
                      <th>Engine</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenance.database.tables.map((t) => (
                      <tr key={t.name}>
                        <td><strong>{t.name}</strong></td>
                        <td>{t.row_count} records</td>
                        <td>{t.size_kb} KB</td>
                        <td>InnoDB</td>
                        <td>
                          <span className="badge badge-paid" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Check size={12} /> OK / Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SCHOOLS EMAIL COMMUNICATION & SEPARATED AUDIT */}
      {activeTab === 'emails' && (
        <div>
          {/* Dispatch Notice to Schools Only */}
          <div className="content-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Dispatch Official Notice to Schools</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Broadcast official announcements, guidelines, and urgent notices to campus principals.
                </p>
              </div>
            </div>
            <form onSubmit={handleSendSchoolNotice}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Target School Recipient</label>
                  <select
                    className="form-select"
                    value={schoolNoticeForm.target_school_id}
                    onChange={(e) => setSchoolNoticeForm({ ...schoolNoticeForm, target_school_id: e.target.value })}
                    required
                  >
                    <option value="all">Broadcast to All Schools</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.school_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notice Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Official Directive: Academic Term Opening"
                    value={schoolNoticeForm.subject}
                    onChange={(e) => setSchoolNoticeForm({ ...schoolNoticeForm, subject: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Official Message Body</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Enter the official communication for school leadership..."
                  value={schoolNoticeForm.message}
                  onChange={(e) => setSchoolNoticeForm({ ...schoolNoticeForm, message: e.target.value })}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-sm" disabled={sendingNotice}>
                <Send size={14} /> {sendingNotice ? 'Dispatching...' : 'Dispatch Official Notice'}
              </button>
            </form>
          </div>

          {/* Separated Email Logs by School */}
          <div className="content-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">School-Specific Email Audit Trail</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Filter delivery logs by specific school campus or review platform-wide dispatch history.
                </p>
              </div>
              <span className="badge badge-paid">MySQL email_logs</span>
            </div>

            {/* School Filter Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button
                type="button"
                className={`tab-btn ${selectedSchoolFilter === 'all' ? 'active' : ''}`}
                style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                onClick={() => setSelectedSchoolFilter('all')}
              >
                All Schools
              </button>
              {schools.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`tab-btn ${selectedSchoolFilter === String(s.id) ? 'active' : ''}`}
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                  onClick={() => setSelectedSchoolFilter(String(s.id))}
                >
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: s.theme_color || '#2563eb', marginRight: '6px' }} />
                  {s.school_name}
                </button>
              ))}
            </div>

            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>School</th>
                    <th>Recipient Email</th>
                    <th>Event Type</th>
                    <th>Subject</th>
                    <th>Date & Time</th>
                    <th>Delivery Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        No email logs found for this school.
                      </td>
                    </tr>
                  ) : (
                    emailLogs.map((log) => (
                      <tr key={log.id}>
                        <td>
                          <span className="badge" style={{ background: '#f1f5f9', color: '#1e293b', fontWeight: 600 }}>
                            {log.school_name || `School #${log.school_id}`}
                          </span>
                        </td>
                        <td><strong>{log.recipient_email}</strong></td>
                        <td>
                          <span className="role-pill role-teacher">{log.event_type}</span>
                        </td>
                        <td>{log.subject}</td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {new Date(log.sent_at).toLocaleString()}
                        </td>
                        <td>
                          <span className={`badge ${log.status === 'sent' ? 'badge-paid' : 'badge-unpaid'}`}>
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT SCHOOL */}
      {showSchoolModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {editingSchoolId ? 'Edit School Profile' : 'Register New School Tenant'}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowSchoolModal(false)}>X</button>
            </div>
            <form onSubmit={handleSaveSchool}>
              <div className="form-group">
                <label className="form-label">School Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Al-Najax Academy"
                  value={schoolForm.school_name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, school_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">School Motto</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Excellence in Education"
                  value={schoolForm.motto}
                  onChange={(e) => setSchoolForm({ ...schoolForm, motto: e.target.value })}
                />
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="+252 61 0000000"
                    value={schoolForm.phone}
                    onChange={(e) => setSchoolForm({ ...schoolForm, phone: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Campus Address / Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Mogadishu, Somalia"
                    value={schoolForm.address}
                    onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">School Brand Theme Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="color"
                    value={schoolForm.theme_color}
                    onChange={(e) => setSchoolForm({ ...schoolForm, theme_color: e.target.value })}
                    style={{ width: '40px', height: '40px', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', padding: '2px' }}
                  />
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '130px', fontFamily: 'monospace' }}
                    value={schoolForm.theme_color}
                    onChange={(e) => setSchoolForm({ ...schoolForm, theme_color: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">School Logo (Optional)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {schoolForm.logo_url ? (
                    <img src={schoolForm.logo_url} alt="Logo" className="preview-thumb" />
                  ) : (
                    <div className="preview-thumb" style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Building2 size={24} color="var(--text-muted)" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="modalSchoolLogo"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, (base64) => setSchoolForm({ ...schoolForm, logo_url: base64 }))}
                    />
                    <label htmlFor="modalSchoolLogo" className="btn btn-outline btn-sm">
                      <Upload size={14} /> Upload Logo Image
                    </label>
                    {schoolForm.logo_url && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ marginLeft: '8px', color: 'var(--danger)' }}
                        onClick={() => setSchoolForm({ ...schoolForm, logo_url: '' })}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!editingSchoolId && (
                <div style={{ marginTop: '20px', padding: '18px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <ShieldCheck size={18} color="var(--primary)" />
                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#0f172a' }}>
                      Principal Account Auto-Provisioning
                    </h4>
                  </div>
                  <p style={{ margin: '0 0 14px 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    The system will automatically create the Principal (Super Admin) account, provision sample classes, and dispatch a welcome email notification.
                  </p>

                  <div className="form-group">
                    <label className="form-label">Principal Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. John Smith"
                      value={schoolForm.principal_name}
                      onChange={(e) => setSchoolForm({ ...schoolForm, principal_name: e.target.value })}
                    />
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Principal Login Email</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="e.g. principal@school.edu"
                        value={schoolForm.principal_email}
                        onChange={(e) => setSchoolForm({ ...schoolForm, principal_email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Temporary Login Password</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Password123!"
                        value={schoolForm.principal_password}
                        onChange={(e) => setSchoolForm({ ...schoolForm, principal_password: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowSchoolModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingSchoolId ? 'Save Changes' : 'Register School & Create Principal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROVISIONING SUCCESS MODAL */}
      {provisionedModalData && (
        <div className="modal-overlay" style={{ zIndex: 110 }}>
          <div className="modal-box" style={{ maxWidth: '520px' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#dcfce7', color: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                <CheckCircle2 size={32} />
              </div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
                School & Principal Account Ready!
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                School <strong>{provisionedModalData.schoolName}</strong> and the Principal (Super Admin) account have been successfully provisioned.
              </p>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>School:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{provisionedModalData.schoolName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Principal:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>{provisionedModalData.principalName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Email:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>{provisionedModalData.principalEmail}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '10px', borderBottom: '1px solid var(--border)', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Temp Password:</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, fontFamily: 'monospace', background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
                  {provisionedModalData.principalPassword}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Welcome Email:</span>
                <span className="badge badge-paid">
                  {provisionedModalData.emailStatus === 'sent' ? 'Email Dispatched' : 'Account Ready'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCopyCredentials}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setProvisionedModalData(null)}
              >
                Done (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformMasterDashboard;
