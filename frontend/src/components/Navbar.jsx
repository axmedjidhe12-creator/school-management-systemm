import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { School, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const roleLabels = {
    root_admin: 'Master Admin',
    super_admin: 'School Principal',
    teacher: 'Teacher',
    student: 'Student'
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleBrandClick = () => {
    if (user.role === 'root_admin') navigate('/master');
    else if (user.role === 'super_admin') navigate('/admin');
    else if (user.role === 'teacher') navigate('/teacher');
    else navigate('/student');
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <div className="brand" onClick={handleBrandClick} style={{ cursor: 'pointer' }}>
          {user.role === 'root_admin' ? (
            <div className="brand-icon" style={{ background: '#0f172a', color: '#38bdf8' }}>
              <ShieldCheck size={20} />
            </div>
          ) : user.school_logo ? (
            <img src={user.school_logo} alt={user.school_name} className="brand-logo" />
          ) : (
            <div className="brand-icon" style={{ background: user.school_theme_color || 'var(--primary)', color: '#fff' }}>
              <School size={20} />
            </div>
          )}
          <div>
            <span style={{ fontWeight: 700 }}>
              {user.role === 'root_admin' ? 'School Cloud Platform' : (user.school_name || 'SchoolMS')}
            </span>
            <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: 'var(--text-muted)', display: 'block' }}>
              {user.role === 'root_admin' ? 'Master Administration' : (user.school_motto || 'Multi-Tenant System')}
            </span>
          </div>
        </div>

        <div className="nav-user">
          <div className="user-badge">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt={user.full_name} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                {getInitials(user.full_name)}
              </div>
            )}
            <div>
              <span className="user-name">{user.full_name}</span>
              <div>
                <span className={`role-pill role-${user.role}`}>
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
            </div>
          </div>

          <button className="btn btn-outline btn-sm" onClick={logout} title="Sign Out">
            <LogOut size={16} />
            <span style={{ display: 'none', sm: 'inline' }}>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
