import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Award, CalendarCheck, DollarSign, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export const StudentPortal = () => {
  const { user } = useAuth();
  const [exams, setExams] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudentData = async () => {
      try {
        const [examRes, attRes, feeRes] = await Promise.all([
          apiRequest('/exams'),
          apiRequest('/attendance'),
          apiRequest('/fees')
        ]);

        if (examRes.success) setExams(examRes.exams);
        if (attRes.success) setAttendance(attRes.attendance);
        if (feeRes.success) setFees(feeRes.fees);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStudentData();
  }, []);

  const feeRecord = fees.length > 0 ? fees[0] : null;

  // Calculate Academic Average
  const averagePoints = exams.length > 0
    ? (exams.reduce((acc, curr) => acc + Number(curr.points), 0) / exams.length).toFixed(1)
    : 'N/A';

  // Attendance stats
  const presentCount = attendance.filter((a) => a.status === 'present').length;
  const absentCount = attendance.filter((a) => a.status === 'absent').length;
  const lateCount = attendance.filter((a) => a.status === 'late').length;

  return (
    <div className="main-content">
      {/* Student Welcome Header */}
      <div className="content-card" style={{ background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: 'white', border: 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>
              Student Academic Portal
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '4px 0' }}>{user.full_name}</h2>
            <p style={{ opacity: 0.9, fontSize: '0.9rem' }}>
              Admission No: <strong>{user.admission_no}</strong> • Class: <strong>{user.class_name || 'Enrolled'}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Cumulative Average</span>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{averagePoints} {averagePoints !== 'N/A' && '/ 100'}</div>
          </div>
        </div>
      </div>

      {/* Summary Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe', color: '#1e40af' }}>
            <Award size={24} />
          </div>
          <div>
            <div className="stat-title">Subjects Evaluated</div>
            <div className="stat-value">{exams.length}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#059669' }}>
            <CalendarCheck size={24} />
          </div>
          <div>
            <div className="stat-title">Days Present</div>
            <div className="stat-value">{presentCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-title">Days Absent</div>
            <div className="stat-value">{absentCount}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{
            background: feeRecord?.status === 'paid' ? '#ecfdf5' : '#fff7ed',
            color: feeRecord?.status === 'paid' ? '#059669' : '#ea580c'
          }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className="stat-title">Fee Balance</div>
            <div className="stat-value" style={{ color: feeRecord?.balance > 0 ? '#dc2626' : '#059669' }}>
              ${feeRecord ? Number(feeRecord.balance).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Academic Performance & Exam Points */}
      <div className="content-card">
        <div className="card-header">
          <h3 className="card-title">Exam Points & Performance Evaluations</h3>
          <span className="badge badge-paid">Official Records</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Subject</th>
                <th>Academic Term</th>
                <th>Points / Grade</th>
                <th>Teacher Performance Remarks</th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No exam marks recorded yet.</td></tr>
              ) : (
                exams.map((ex) => (
                  <tr key={ex.id}>
                    <td><strong>{ex.subject}</strong></td>
                    <td>{ex.term}</td>
                    <td>
                      <span style={{
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        color: ex.points >= 80 ? 'var(--success)' : (ex.points >= 60 ? 'var(--warning)' : 'var(--danger)')
                      }}>
                        {ex.points}
                      </span> / 100
                    </td>
                    <td>
                      <em style={{ color: 'var(--secondary)' }}>
                        "{ex.remarks || 'Satisfactory academic effort.'}"
                      </em>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Attendance History */}
      <div className="content-card">
        <div className="card-header">
          <h3 className="card-title">Daily Attendance History</h3>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Present: {presentCount} • Absent: {absentCount} • Late: {lateCount}
          </span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Notice Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No attendance records found.</td></tr>
              ) : (
                attendance.map((a) => (
                  <tr key={a.id}>
                    <td><strong>{new Date(a.date).toLocaleDateString()}</strong></td>
                    <td>
                      <span className={`badge badge-${a.status}`}>
                        {a.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {a.status === 'absent' ? 'Automated Absence Email Dispatched' : 'Recorded'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 3: Tuition Fee Statement */}
      {feeRecord && (
        <div className="content-card">
          <div className="card-header">
            <h3 className="card-title">Tuition Fee Balance & Inspection</h3>
            <span className={`badge badge-${feeRecord.status}`}>
              {feeRecord.status.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', background: '#f8fafc', padding: '16px', borderRadius: '8px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Amount Due:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>${Number(feeRecord.amount_due).toFixed(2)}</div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Amount Paid:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>
                ${Number(feeRecord.amount_paid).toFixed(2)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Remaining Balance:</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: feeRecord.balance > 0 ? 'var(--danger)' : 'var(--success)' }}>
                ${Number(feeRecord.balance).toFixed(2)}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Payment Due Date:</span>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{new Date(feeRecord.due_date).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentPortal;
