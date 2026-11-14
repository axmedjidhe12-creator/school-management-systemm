import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users, BookOpen, GraduationCap, DollarSign, Mail, Trash2, RotateCcw,
  Plus, CheckCircle, Send, Check, Edit2, Upload, Camera
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [fees, setFees] = useState([]);
  const [feeFilter, setFeeFilter] = useState('');
  const [emailLogs, setEmailLogs] = useState([]);
  const [trash, setTrash] = useState({ users: [], classes: [] });
  const [schoolInfo, setSchoolInfo] = useState({
    school_name: '',
    address: '',
    phone: '',
    logo_url: '',
    theme_color: '#2563eb',
    motto: 'Excellence in Education'
  });

  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');

  // Class Modal (Create / Edit)
  const [showClassModal, setShowClassModal] = useState(false);
  const [editingClassId, setEditingClassId] = useState(null);
  const [newClassName, setNewClassName] = useState('');
  const [newClassTeacher, setNewClassTeacher] = useState('');

  // Teacher Modal (Create / Edit)
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState(null);
  const [teacherForm, setTeacherForm] = useState({
    full_name: '',
    email: '',
    password: 'Password123!',
    subject: '',
    assigned_classes: '',
    form_master_class_id: '',
    avatar_url: ''
  });

  // Student Modal (Create / Edit)
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState(null);
  const [studentForm, setStudentForm] = useState({
    full_name: '',
    email: '',
    password: 'Password123!',
    class_id: '',
    admission_no: '',
    tuition_amount: 1500,
    avatar_url: ''
  });

  const [paymentModal, setPaymentModal] = useState({ show: false, fee: null, amount: '', notify: true });
  const [customEmail, setCustomEmail] = useState({ recipient_email: '', subject: '', message: '' });


  // Dynamic Theme Color Application
  useEffect(() => {
    if (schoolInfo.theme_color) {
      document.documentElement.style.setProperty('--primary', schoolInfo.theme_color);
      document.documentElement.style.setProperty('--primary-light', schoolInfo.theme_color + '15');
    }
  }, [schoolInfo.theme_color]);

  const loadData = async () => {
    setLoading(true);
    try {
      const results = await Promise.allSettled([
        apiRequest('/reports/dashboard-stats'),
        apiRequest('/classes'),
        apiRequest('/users/teachers'),
        apiRequest('/users/students'),
        apiRequest('/fees' + (feeFilter ? `?status=${feeFilter}` : '')),
        apiRequest('/reports/email-logs'),
        apiRequest('/users/trash'),
        apiRequest('/schools/current')
      ]);

      const [statsRes, classesRes, teachersRes, studentsRes, feesRes, logsRes, trashRes, schoolRes] = results;

      if (statsRes.status === 'fulfilled' && statsRes.value.success) setStats(statsRes.value.stats);
      if (classesRes.status === 'fulfilled' && classesRes.value.success) setClasses(classesRes.value.classes);
      if (teachersRes.status === 'fulfilled' && teachersRes.value.success) setTeachers(teachersRes.value.teachers);
      if (studentsRes.status === 'fulfilled' && studentsRes.value.success) setStudents(studentsRes.value.students);
      if (feesRes.status === 'fulfilled' && feesRes.value.success) setFees(feesRes.value.fees);
      if (logsRes.status === 'fulfilled' && logsRes.value.success) setEmailLogs(logsRes.value.logs);
      if (trashRes.status === 'fulfilled' && trashRes.value.success) setTrash(trashRes.value.trash);
      if (schoolRes.status === 'fulfilled' && schoolRes.value.success) {
        setSchoolInfo({
          ...schoolRes.value.school,
          theme_color: schoolRes.value.school.theme_color || '#2563eb',
          motto: schoolRes.value.school.motto || 'Excellence in Education'
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [feeFilter]);

  const showNotification = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  // Helper for file to Base64 (Optional sawir/profile image)
  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Image file must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      callback(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // 1. CLASS HANDLERS (Create & Edit)
  const handleOpenCreateClassModal = () => {
    setEditingClassId(null);
    setNewClassName('');
    setNewClassTeacher('');
    setShowClassModal(true);
  };

  const handleOpenEditClassModal = (c) => {
    setEditingClassId(c.id);
    setNewClassName(c.class_name);
    setNewClassTeacher(c.teacher_id || '');
    setShowClassModal(true);
  };

  const handleSaveClass = async (e) => {
    e.preventDefault();
    try {
      if (editingClassId) {
        await apiRequest(`/classes/${editingClassId}`, {
          method: 'PUT',
          body: JSON.stringify({ class_name: newClassName, teacher_id: newClassTeacher || null })
        });
        showNotification('Class updated successfully.');
      } else {
        await apiRequest('/classes', {
          method: 'POST',
          body: JSON.stringify({ class_name: newClassName, teacher_id: newClassTeacher || null })
        });
        showNotification('Class created successfully.');
      }
      setShowClassModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteClass = async (id, name) => {
    if (!window.confirm(`Are you sure you want to soft-delete class "${name}"?`)) return;
    try {
      await apiRequest(`/classes/${id}`, { method: 'DELETE' });
      showNotification(`Class "${name}" soft-deleted.`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 2. TEACHER HANDLERS (Create & Edit)
  const handleOpenNewTeacherModal = () => {
    setEditingTeacherId(null);
    setTeacherForm({
      full_name: '',
      email: '',
      password: 'Password123!',
      subject: '',
      assigned_classes: '',
      form_master_class_id: '',
      avatar_url: ''
    });
    setShowTeacherModal(true);
  };

  const handleOpenEditTeacherModal = (t) => {
    setEditingTeacherId(t.id);
    setTeacherForm({
      full_name: t.full_name || '',
      email: t.email || '',
      password: '',
      subject: t.subject || '',
      assigned_classes: t.assigned_classes || '',
      form_master_class_id: t.form_master_class_id || '',
      avatar_url: t.avatar_url || ''
    });
    setShowTeacherModal(true);
  };

  const handleSaveTeacher = async (e) => {
    e.preventDefault();
    try {
      if (editingTeacherId) {
        await apiRequest(`/users/teachers/${editingTeacherId}`, {
          method: 'PUT',
          body: JSON.stringify(teacherForm)
        });
        showNotification('Teacher subject and class assignments updated successfully.');
      } else {
        await apiRequest('/users/teachers', {
          method: 'POST',
          body: JSON.stringify(teacherForm)
        });
        showNotification('Teacher registered successfully.');
      }
      setShowTeacherModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 3. STUDENT HANDLERS (Create & Edit)
  const handleOpenNewStudentModal = () => {
    setEditingStudentId(null);
    setStudentForm({
      full_name: '',
      email: '',
      password: 'Password123!',
      class_id: classes.length > 0 ? classes[0].id : '',
      admission_no: '',
      tuition_amount: 1500,
      avatar_url: ''
    });
    setShowStudentModal(true);
  };

  const handleOpenEditStudentModal = (s) => {
    setEditingStudentId(s.student_id);
    setStudentForm({
      full_name: s.full_name || '',
      email: s.email || '',
      password: '',
      class_id: s.class_id || '',
      admission_no: s.admission_no || '',
      tuition_amount: 1500,
      avatar_url: s.avatar_url || ''
    });
    setShowStudentModal(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    try {
      if (editingStudentId) {
        await apiRequest(`/users/students/${editingStudentId}`, {
          method: 'PUT',
          body: JSON.stringify(studentForm)
        });
        showNotification('Student profile updated successfully.');
      } else {
        await apiRequest('/users/students', {
          method: 'POST',
          body: JSON.stringify(studentForm)
        });
        showNotification('Student registered with initial fee record.');
      }
      setShowStudentModal(false);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 4. USER DELETE & RESTORE
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to soft-delete "${name}"? You can restore it anytime.`)) return;
    try {
      await apiRequest(`/users/${id}`, { method: 'DELETE' });
      showNotification(`"${name}" soft-deleted.`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRestore = async (type, id) => {
    try {
      await apiRequest('/users/restore', {
        method: 'POST',
        body: JSON.stringify({ type, id })
      });
      showNotification(`Record restored successfully.`);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };



  // 7. RECORD FEE PAYMENT
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await apiRequest(`/fees/${paymentModal.fee.id}/pay`, {
        method: 'POST',
        body: JSON.stringify({
          payment_amount: paymentModal.amount,
          notify_student: paymentModal.notify
        })
      });
      setPaymentModal({ show: false, fee: null, amount: '', notify: true });
      showNotification('Tuition payment recorded successfully.');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // 8. SEND CUSTOM EMAIL
  const handleSendCustomEmail = async (e) => {
    e.preventDefault();
    try {
      const res = await apiRequest('/reports/send-custom-email', {
        method: 'POST',
        body: JSON.stringify(customEmail)
      });
      setCustomEmail({ recipient_email: '', subject: '', message: '' });
      showNotification(res.message || 'Email dispatched and logged.');
      loadData();
    } catch (err) {
      alert(err.message);
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

      {/* Tabs Bar */}
      {/* Tabs Navigation */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <BookOpen size={16} /> Overview & Stats
        </button>
        <button
          className={`tab-btn ${activeTab === 'classes' ? 'active' : ''}`}
          onClick={() => setActiveTab('classes')}
        >
          <GraduationCap size={16} /> Classes ({classes.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} /> Teachers & Students
        </button>
        <button
          className={`tab-btn ${activeTab === 'fees' ? 'active' : ''}`}
          onClick={() => setActiveTab('fees')}
        >
          <DollarSign size={16} /> Fee Inspection
        </button>
        <button
          className={`tab-btn ${activeTab === 'emails' ? 'active' : ''}`}
          onClick={() => setActiveTab('emails')}
        >
          <Mail size={16} /> Email Alerts & Audit
        </button>
        <button
          className={`tab-btn ${activeTab === 'trash' ? 'active' : ''}`}
          onClick={() => setActiveTab('trash')}
        >
          <Trash2 size={16} /> Trash ({trash.users.length + trash.classes.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && stats && (
        <div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                <GraduationCap size={24} />
              </div>
              <div>
                <div className="stat-title">Total Students</div>
                <div className="stat-value">{stats.total_students}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#fef3c7', color: '#92400e' }}>
                <Users size={24} />
              </div>
              <div>
                <div className="stat-title">Faculty / Teachers</div>
                <div className="stat-value">{stats.total_teachers}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
                <BookOpen size={24} />
              </div>
              <div>
                <div className="stat-title">Academic Classes</div>
                <div className="stat-value">{stats.total_classes}</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon" style={{ background: '#d1fae5', color: '#065f46' }}>
                <DollarSign size={24} />
              </div>
              <div>
                <div className="stat-title">Fees Collected</div>
                <div className="stat-value">${Number(stats.financials.total_collected).toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">Fee Inspection Summary</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Billed:</span>
                  <strong>${Number(stats.financials.total_billed).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Collected:</span>
                  <strong style={{ color: 'var(--success)' }}>${Number(stats.financials.total_collected).toLocaleString()}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Outstanding Balance:</span>
                  <strong style={{ color: 'var(--danger)' }}>${Number(stats.financials.total_outstanding).toLocaleString()}</strong>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header">
                <h3 className="card-title">Today's Attendance Status</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{stats.date}</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'space-around', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                    {stats.today_attendance.present_count}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Present</span>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--danger)' }}>
                    {stats.today_attendance.absent_count}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Absent</span>
                </div>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--warning)' }}>
                    {stats.today_attendance.late_count}
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Late</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* TAB 3: CLASSES (With Edit & Delete) */}
      {activeTab === 'classes' && (
        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">Class Roster & Form Masters</h3>
            <button className="btn btn-primary btn-sm" onClick={handleOpenCreateClassModal}>
              <Plus size={16} /> New Class
            </button>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Assigned Form Master</th>
                  <th>Enrolled Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.class_name}</strong></td>
                    <td>{c.teacher_name || <em style={{ color: 'var(--text-muted)' }}>Unassigned</em>}</td>
                    <td><span className="badge badge-paid">{c.student_count} Students</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleOpenEditClassModal(c)}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)', borderColor: '#fecaca' }}
                          onClick={() => handleDeleteClass(c.id, c.class_name)}
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

      {/* TAB 4: USERS (TEACHERS & STUDENTS - With Edit) */}
      {activeTab === 'users' && (
        <div>
          {/* Teachers Section */}
          <div className="content-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Faculty Teachers & Subject Assignments</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Manage subjects taught, assigned classes, form master roles, and profile photos.
                </p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleOpenNewTeacherModal}>
                <Plus size={16} /> Add Teacher
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Teacher / Photo</th>
                    <th>Email</th>
                    <th>Subject(s) Taught</th>
                    <th>Classes Taught</th>
                    <th>Form Master Class</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <div className="avatar-cell">
                          {t.avatar_url ? (
                            <img src={t.avatar_url} alt={t.full_name} className="avatar-img" />
                          ) : (
                            <div className="avatar-placeholder">{getInitials(t.full_name)}</div>
                          )}
                          <div>
                            <strong>{t.full_name}</strong>
                          </div>
                        </div>
                      </td>
                      <td>{t.email}</td>
                      <td>
                        {t.subject ? (
                          <span style={{ fontWeight: 600, color: 'var(--primary)' }}>{t.subject}</span>
                        ) : (
                          <em style={{ color: 'var(--text-muted)' }}>No subject assigned</em>
                        )}
                      </td>
                      <td>
                        {t.assigned_classes ? (
                          <span>{t.assigned_classes}</span>
                        ) : (
                          <em style={{ color: 'var(--text-muted)' }}>All classes</em>
                        )}
                      </td>
                      <td>
                        {t.form_master_class_name ? (
                          <span className="badge badge-formmaster">
                            Form Master: {t.form_master_class_name}
                          </span>
                        ) : (
                          <em style={{ color: 'var(--text-muted)' }}>None</em>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEditTeacherModal(t)}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--danger)', borderColor: '#fecaca' }}
                            onClick={() => handleDeleteUser(t.id, t.full_name)}
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

          {/* Students Section */}
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Student Records</h3>
              <button className="btn btn-primary btn-sm" onClick={handleOpenNewStudentModal}>
                <Plus size={16} /> Register Student
              </button>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Student / Photo</th>
                    <th>Admission No</th>
                    <th>Enrolled Class</th>
                    <th>Email</th>
                    <th>Fee Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.student_id}>
                      <td>
                        <div className="avatar-cell">
                          {s.avatar_url ? (
                            <img src={s.avatar_url} alt={s.full_name} className="avatar-img" />
                          ) : (
                            <div className="avatar-placeholder">{getInitials(s.full_name)}</div>
                          )}
                          <div>
                            <strong>{s.full_name}</strong>
                          </div>
                        </div>
                      </td>
                      <td><strong>{s.admission_no}</strong></td>
                      <td>{s.class_name}</td>
                      <td>{s.email}</td>
                      <td>
                        <span className={`badge badge-${s.fee_status || 'unpaid'}`}>
                          {(s.fee_status || 'unpaid').toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenEditStudentModal(s)}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--danger)', borderColor: '#fecaca' }}
                            onClick={() => handleDeleteUser(s.user_id, s.full_name)}
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
        </div>
      )}

      {/* TAB 5: FEE INSPECTION */}
      {activeTab === 'fees' && (
        <div className="content-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">School Fee Inspection</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track tuition balances, paid statuses, and dispatch receipts</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="form-select"
                style={{ width: 'auto' }}
                value={feeFilter}
                onChange={(e) => setFeeFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="paid">Fully Paid</option>
                <option value="partial">Partially Paid</option>
                <option value="unpaid">Unpaid</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((f) => (
                  <tr key={f.id}>
                    <td>
                      <strong>{f.student_name}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{f.admission_no}</div>
                    </td>
                    <td>{f.class_name}</td>
                    <td>${Number(f.amount_due).toFixed(2)}</td>
                    <td style={{ color: 'var(--success)', fontWeight: 600 }}>${Number(f.amount_paid).toFixed(2)}</td>
                    <td style={{ color: f.balance > 0 ? 'var(--danger)' : 'var(--text-muted)', fontWeight: 700 }}>
                      ${Number(f.balance).toFixed(2)}
                    </td>
                    <td>
                      <span className={`badge badge-${f.status}`}>
                        {f.status.toUpperCase()}
                      </span>
                    </td>
                    <td>{new Date(f.due_date).toLocaleDateString()}</td>
                    <td>
                      {f.status !== 'paid' ? (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => setPaymentModal({ show: true, fee: f, amount: f.balance, notify: true })}
                        >
                          <DollarSign size={14} /> Pay Fee
                        </button>
                      ) : (
                        <span style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <CheckCircle size={14} /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: EMAIL LOGS & ANNOUNCEMENTS */}
      {activeTab === 'emails' && (
        <div>
          <div className="content-card">
            <div className="card-header">
              <div>
                <h3 className="card-title">Dispatch School Announcement</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Send official announcements to students or staff via Google SMTP.
                </p>
              </div>
            </div>
            <form onSubmit={handleSendCustomEmail}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Recipient Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="student@school.edu"
                    value={customEmail.recipient_email}
                    onChange={(e) => setCustomEmail({ ...customEmail, recipient_email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Important Notice: Term Exams"
                    value={customEmail.subject}
                    onChange={(e) => setCustomEmail({ ...customEmail, subject: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Announcement Message</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder="Type your message here..."
                  value={customEmail.message}
                  onChange={(e) => setCustomEmail({ ...customEmail, message: e.target.value })}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary btn-sm">
                <Send size={14} /> Send Announcement
              </button>
            </form>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Outbound Email Audit Trail</h3>
              <span className="badge badge-paid">MySQL email_logs</span>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Recipient</th>
                    <th>Event Type</th>
                    <th>Subject</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {emailLogs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(log.sent_at).toLocaleString()}
                      </td>
                      <td><strong>{log.recipient_email}</strong></td>
                      <td>
                        <span className="role-pill role-teacher">{log.event_type}</span>
                      </td>
                      <td>{log.subject}</td>
                      <td>
                        <span className={`badge ${log.status === 'sent' ? 'badge-paid' : 'badge-unpaid'}`}>
                          {log.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}



      {/* TAB 9: TRASH / RECOVER */}
      {activeTab === 'trash' && (
        <div className="content-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recycle Bin (Soft Deletes)</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Restore deleted staff, classes, or students at any time.
              </p>
            </div>
          </div>

          <h4 style={{ margin: '16px 0 8px 0', fontSize: '0.95rem' }}>Deleted Users ({trash.users.length})</h4>
          <div className="table-responsive" style={{ marginBottom: '24px' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Deleted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {trash.users.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No deleted users in trash.</td></tr>
                ) : (
                  trash.users.map((u) => (
                    <tr key={u.id}>
                      <td><strong>{u.full_name}</strong></td>
                      <td>{u.email}</td>
                      <td><span className={`role-pill role-${u.role}`}>{u.role}</span></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(u.deleted_at).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => handleRestore('user', u.id)}>
                          <RotateCcw size={13} /> Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h4 style={{ margin: '16px 0 8px 0', fontSize: '0.95rem' }}>Deleted Classes ({trash.classes.length})</h4>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Class Name</th>
                  <th>Deleted At</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {trash.classes.length === 0 ? (
                  <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No deleted classes in trash.</td></tr>
                ) : (
                  trash.classes.map((c) => (
                    <tr key={c.id}>
                      <td><strong>{c.class_name}</strong></td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(c.deleted_at).toLocaleString()}</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => handleRestore('class', c.id)}>
                          <RotateCcw size={13} /> Restore
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT CLASS */}
      {showClassModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {editingClassId ? 'Edit Academic Class' : 'Add New Academic Class'}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowClassModal(false)}>X</button>
            </div>
            <form onSubmit={handleSaveClass}>
              <div className="form-group">
                <label className="form-label">Class Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Grade 12-A"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assign Form Master (Optional)</label>
                <select
                  className="form-select"
                  value={newClassTeacher}
                  onChange={(e) => setNewClassTeacher(e.target.value)}
                >
                  <option value="">-- No Teacher Assigned --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowClassModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingClassId ? 'Save Changes' : 'Create Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT TEACHER */}
      {showTeacherModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {editingTeacherId ? 'Edit Teacher & Class Assignments' : 'Register New Teacher'}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowTeacherModal(false)}>X</button>
            </div>
            <form onSubmit={handleSaveTeacher}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Sayid Aladiih"
                  value={teacherForm.full_name}
                  onChange={(e) => setTeacherForm({ ...teacherForm, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="teacher@school.edu"
                  value={teacherForm.email}
                  onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                  required
                />
              </div>

              {!editingTeacherId && (
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input
                    type="text"
                    className="form-input"
                    value={teacherForm.password}
                    onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Subject Taught */}
              <div className="form-group">
                <label className="form-label">Subject(s) Taught / Maadada uu Dhigayo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Mathematics, Physics, Biology, Arabic"
                  value={teacherForm.subject}
                  onChange={(e) => setTeacherForm({ ...teacherForm, subject: e.target.value })}
                />
                <p className="form-help">Qor maadada ama maadooyinka uu macallinkani bixinayo.</p>
              </div>

              {/* Teaching Classes */}
              <div className="form-group">
                <label className="form-label">Classes Taught / Fasallada uu u Dhigayo</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Grade 10-A, Grade 11-B"
                  value={teacherForm.assigned_classes}
                  onChange={(e) => setTeacherForm({ ...teacherForm, assigned_classes: e.target.value })}
                />
                <p className="form-help">Fasallada uu maadada u galo (tusaale: Grade 10-A, Grade 11-B).</p>
              </div>

              {/* Form Master of which class? */}
              <div className="form-group">
                <label className="form-label">Class-ka uu Form Master u Noqonayo (Optional)</label>
                <select
                  className="form-select"
                  value={teacherForm.form_master_class_id}
                  onChange={(e) => setTeacherForm({ ...teacherForm, form_master_class_id: e.target.value })}
                >
                  <option value="">-- None (Form Master ma ahan) --</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.class_name}</option>
                  ))}
                </select>
                <p className="form-help">Haddii uu fasal gaar ah mas'uul/form master ka yahay, halkan ka dooro.</p>
              </div>

              {/* Optional Profile Photo */}
              <div className="form-group">
                <label className="form-label">Profile Photo / Sawirka Macallinka (Optional - Mana ahan waajib)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {teacherForm.avatar_url ? (
                    <img src={teacherForm.avatar_url} alt="Teacher Preview" className="preview-thumb" />
                  ) : (
                    <div className="preview-thumb" style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={20} color="var(--text-muted)" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="teacherPhotoInput"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, (base64) => setTeacherForm({ ...teacherForm, avatar_url: base64 }))}
                    />
                    <label htmlFor="teacherPhotoInput" className="btn btn-outline btn-sm">
                      <Upload size={14} /> Soo Geli Sawir
                    </label>
                    {teacherForm.avatar_url && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ marginLeft: '8px', color: 'var(--danger)' }}
                        onClick={() => setTeacherForm({ ...teacherForm, avatar_url: '' })}
                      >
                        Kasaar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowTeacherModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingTeacherId ? 'Save Changes' : 'Register Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT STUDENT */}
      {showStudentModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                {editingStudentId ? 'Edit Student Profile' : 'Register New Student'}
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => setShowStudentModal(false)}>X</button>
            </div>
            <form onSubmit={handleSaveStudent}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Student Full Name"
                  value={studentForm.full_name}
                  onChange={(e) => setStudentForm({ ...studentForm, full_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Admission No</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="GW-2026-003"
                    value={studentForm.admission_no}
                    onChange={(e) => setStudentForm({ ...studentForm, admission_no: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Class</label>
                  <select
                    className="form-select"
                    value={studentForm.class_id}
                    onChange={(e) => setStudentForm({ ...studentForm, class_id: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Class --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>{c.class_name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="student@school.edu"
                  value={studentForm.email}
                  onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                  required
                />
              </div>

              {!editingStudentId && (
                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="form-label">Tuition Fee ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={studentForm.tuition_amount}
                      onChange={(e) => setStudentForm({ ...studentForm, tuition_amount: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <input
                      type="text"
                      className="form-input"
                      value={studentForm.password}
                      onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Optional Student Photo */}
              <div className="form-group">
                <label className="form-label">Student Photo / Sawirka Ardayga (Optional - Mana ahan waajib)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  {studentForm.avatar_url ? (
                    <img src={studentForm.avatar_url} alt="Student Preview" className="preview-thumb" />
                  ) : (
                    <div className="preview-thumb" style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={20} color="var(--text-muted)" />
                    </div>
                  )}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      id="studentPhotoInput"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageUpload(e, (base64) => setStudentForm({ ...studentForm, avatar_url: base64 }))}
                    />
                    <label htmlFor="studentPhotoInput" className="btn btn-outline btn-sm">
                      <Upload size={14} /> Soo Geli Sawir
                    </label>
                    {studentForm.avatar_url && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ marginLeft: '8px', color: 'var(--danger)' }}
                        onClick={() => setStudentForm({ ...studentForm, avatar_url: '' })}
                      >
                        Kasaar
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowStudentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">
                  {editingStudentId ? 'Save Changes' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* MODAL: RECORD PAYMENT */}
      {paymentModal.show && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Record Tuition Payment</h3>
              <button className="btn btn-outline btn-sm" onClick={() => setPaymentModal({ show: false, fee: null, amount: '', notify: true })}>X</button>
            </div>
            <form onSubmit={handleRecordPayment}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '14px', fontSize: '0.85rem' }}>
                <div>Student: <strong>{paymentModal.fee.student_name}</strong> ({paymentModal.fee.admission_no})</div>
                <div>Remaining Balance: <strong style={{ color: 'var(--danger)' }}>${Number(paymentModal.fee.balance).toFixed(2)}</strong></div>
              </div>

              <div className="form-group">
                <label className="form-label">Payment Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={paymentModal.fee.balance}
                  className="form-input"
                  value={paymentModal.amount}
                  onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="notifyReceipt"
                  checked={paymentModal.notify}
                  onChange={(e) => setPaymentModal({ ...paymentModal, notify: e.target.checked })}
                />
                <label htmlFor="notifyReceipt" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  Send automated payment receipt to student email
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setPaymentModal({ show: false, fee: null, amount: '', notify: true })}>Cancel</button>
                <button type="submit" className="btn btn-primary">Record Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
