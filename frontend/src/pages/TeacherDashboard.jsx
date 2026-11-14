import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CheckSquare, Award, Users, Check, AlertCircle, Send, BookOpen } from 'lucide-react';

export const TeacherDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attendance');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [actionMsg, setActionMsg] = useState('');

  // Exam state
  const [exams, setExams] = useState([]);
  const [examForm, setExamForm] = useState({
    student_id: '',
    subject: user?.subject || 'Mathematics',
    points: '',
    term: 'Term 1 - 2026',
    remarks: '',
    notify_student: true
  });

  const loadInitial = async () => {
    try {
      const classRes = await apiRequest('/classes');
      if (classRes.success && classRes.classes.length > 0) {
        setClasses(classRes.classes);
        setSelectedClass(classRes.classes[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadInitial();
  }, []);

  const loadClassStudents = async () => {
    if (!selectedClass) return;
    try {
      const [stuRes, examRes] = await Promise.all([
        apiRequest(`/users/students?class_id=${selectedClass}`),
        apiRequest(`/exams?class_id=${selectedClass}`)
      ]);

      if (stuRes.success) {
        setStudents(stuRes.students);
        // Pre-fill attendance as present
        const initialAtt = {};
        stuRes.students.forEach((s) => {
          initialAtt[s.student_id] = 'present';
        });
        setAttendanceRecords(initialAtt);

        if (stuRes.students.length > 0) {
          setExamForm((prev) => ({ ...prev, student_id: stuRes.students[0].student_id }));
        }
      }
      if (examRes.success) setExams(examRes.exams);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadClassStudents();
  }, [selectedClass]);

  const showNotification = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 4000);
  };

  // Submit Attendance
  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    try {
      const records = Object.entries(attendanceRecords).map(([student_id, status]) => ({
        student_id: Number(student_id),
        status
      }));

      const res = await apiRequest('/attendance/batch', {
        method: 'POST',
        body: JSON.stringify({ date, records })
      });

      showNotification(res.message || 'Daily attendance recorded successfully.');
    } catch (err) {
      alert(err.message);
    }
  };

  // Submit Exam Performance
  const handleSaveExam = async (e) => {
    e.preventDefault();
    try {
      await apiRequest('/exams', {
        method: 'POST',
        body: JSON.stringify(examForm)
      });
      showNotification('Exam score and remarks published! Notification sent.');
      setExamForm({ ...examForm, points: '', remarks: '' });
      loadClassStudents();
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

      {/* Class Selector Bar */}
      <div className="content-card" style={{ marginBottom: '16px', padding: '14px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select Class:</label>
            <select
              className="form-select"
              style={{ maxWidth: '280px' }}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.class_name}</option>
              ))}
            </select>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              ({students.length} students enrolled)
            </span>
          </div>

          {user?.subject && (
            <div style={{ fontSize: '0.85rem' }}>
              Maadadaada: <strong style={{ color: 'var(--primary)' }}>{user.subject}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
          onClick={() => setActiveTab('attendance')}
        >
          <CheckSquare size={16} /> Daily Attendance Roll Call
        </button>
        <button
          className={`tab-btn ${activeTab === 'exams' ? 'active' : ''}`}
          onClick={() => setActiveTab('exams')}
        >
          <Award size={16} /> Exam Points & Remarks
        </button>
        <button
          className={`tab-btn ${activeTab === 'roster' ? 'active' : ''}`}
          onClick={() => setActiveTab('roster')}
        >
          <Users size={16} /> Class Student Roster
        </button>
      </div>

      {/* TAB 1: ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="content-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Record Daily Class Attendance</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Marking a student <strong>Absent</strong> immediately triggers an automated SendGrid absence email alert.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Date:</label>
              <input
                type="date"
                className="form-input"
                style={{ width: 'auto' }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <form onSubmit={handleSaveAttendance}>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Admission No</th>
                    <th>Student Name</th>
                    <th>Status Selection</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.student_id}>
                      <td><code>{s.admission_no}</code></td>
                      <td><strong>{s.full_name}</strong></td>
                      <td>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`att_${s.student_id}`}
                              value="present"
                              checked={attendanceRecords[s.student_id] === 'present'}
                              onChange={() => setAttendanceRecords({ ...attendanceRecords, [s.student_id]: 'present' })}
                            />
                            <span className="badge badge-present">Present</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`att_${s.student_id}`}
                              value="absent"
                              checked={attendanceRecords[s.student_id] === 'absent'}
                              onChange={() => setAttendanceRecords({ ...attendanceRecords, [s.student_id]: 'absent' })}
                            />
                            <span className="badge badge-absent">Absent</span>
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name={`att_${s.student_id}`}
                              value="late"
                              checked={attendanceRecords[s.student_id] === 'late'}
                              onChange={() => setAttendanceRecords({ ...attendanceRecords, [s.student_id]: 'late' })}
                            />
                            <span className="badge badge-late">Late</span>
                          </label>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary">
                <Check size={16} /> Save Daily Attendance & Send Alerts
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: EXAM PERFORMANCE */}
      {activeTab === 'exams' && (
        <div>
          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Record Exam Points & Qualitative Remarks</h3>
            </div>
            <form onSubmit={handleSaveExam}>
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Student</label>
                  <select
                    className="form-select"
                    value={examForm.student_id}
                    onChange={(e) => setExamForm({ ...examForm, student_id: e.target.value })}
                    required
                  >
                    {students.map((s) => (
                      <option key={s.student_id} value={s.student_id}>
                        {s.full_name} ({s.admission_no})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input
                    type="text"
                    className="form-input"
                    value={examForm.subject}
                    onChange={(e) => setExamForm({ ...examForm, subject: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Score / Points (0 - 100)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="100"
                    className="form-input"
                    placeholder="e.g. 88.5"
                    value={examForm.points}
                    onChange={(e) => setExamForm({ ...examForm, points: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Academic Term</label>
                  <input
                    type="text"
                    className="form-input"
                    value={examForm.term}
                    onChange={(e) => setExamForm({ ...examForm, term: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Teacher Performance Remarks</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  placeholder="e.g. Excellent critical thinking and consistent homework submission."
                  value={examForm.remarks}
                  onChange={(e) => setExamForm({ ...examForm, remarks: e.target.value })}
                ></textarea>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="notifyExam"
                  checked={examForm.notify_student}
                  onChange={(e) => setExamForm({ ...examForm, notify_student: e.target.checked })}
                />
                <label htmlFor="notifyExam" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  Send automated SendGrid grade alert to student email
                </label>
              </div>

              <button type="submit" className="btn btn-primary btn-sm">
                <Send size={14} /> Submit & Publish Exam Grade
              </button>
            </form>
          </div>

          <div className="content-card">
            <div className="card-header">
              <h3 className="card-title">Recent Exam Records in This Class</h3>
            </div>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Subject</th>
                    <th>Score / Points</th>
                    <th>Term</th>
                    <th>Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((ex) => (
                    <tr key={ex.id}>
                      <td><strong>{ex.student_name}</strong></td>
                      <td>{ex.subject}</td>
                      <td>
                        <strong style={{ color: ex.points >= 75 ? 'var(--success)' : 'var(--warning)', fontSize: '1rem' }}>
                          {ex.points}
                        </strong> / 100
                      </td>
                      <td>{ex.term}</td>
                      <td><em style={{ color: 'var(--secondary)' }}>"{ex.remarks || 'No remarks.'}"</em></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROSTER */}
      {activeTab === 'roster' && (
        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">Student Class List</h3>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Admission No</th>
                  <th>Student Name</th>
                  <th>Email</th>
                  <th>Enrolled On</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id}>
                    <td><code>{s.admission_no}</code></td>
                    <td><strong>{s.full_name}</strong></td>
                    <td>{s.email}</td>
                    <td>{new Date(s.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
