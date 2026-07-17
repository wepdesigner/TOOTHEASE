import React, { useState, useEffect } from "react";
import API from "../../services/api";

export default function AdminMemberships() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/admin/memberships/stats")
      .then(res => {
        if (res.data.success) {
          setStats(res.data.stats);
          setRecent(res.data.recent);
        }
      })
      .catch(err => console.error("Failed to fetch MRR stats", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Loading Analytics...</div>;

  const totalMRR = stats?.totalMRR || 0;
  const subs = stats?.totalSubscribers || 0;
  const counts = stats?.counts || {};

  return (
    <div className="page-anim" style={{ padding: '30px 40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '0 0 8px 0' }}>SaaS Revenue & Memberships</h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: 15 }}>Real-time overview of your recurring subscription revenue.</p>
        </div>
        <div style={{ background: '#f0f9ff', padding: '12px 24px', borderRadius: 16, border: '1px solid #bae6fd' }}>
          <div style={{ fontSize: 13, color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Monthly Recurring Revenue</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0f172a' }}>{totalMRR.toLocaleString()} <span style={{ fontSize: 16, color: '#64748b' }}>XAF</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 40 }}>
        {/* Total Subscribers Card */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#334155' }}>
            <i className="ti ti-users" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Active Subscribers</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{subs}</div>
          </div>
        </div>

        {/* Silver Care Card */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#0ea5e9' }}>
            <i className="ti ti-shield" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Silver Care</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{counts['Silver Care'] || 0} <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>users</span></div>
          </div>
        </div>

        {/* Gold Premium Card */}
        <div style={{ background: '#fff', padding: 24, borderRadius: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#d97706' }}>
            <i className="ti ti-crown" />
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#d97706', fontWeight: 600, textTransform: 'uppercase' }}>Gold Premium</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>{counts['Gold Premium'] || 0} <span style={{ fontSize: 14, color: '#94a3b8', fontWeight: 500 }}>users</span></div>
          </div>
        </div>
      </div>

      {/* Recent Upgrades Table */}
      <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>Recent Subscribers</h3>
      <div style={{ background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Patient</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Plan</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Upgraded On</th>
              <th style={{ padding: '16px 24px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Next Billing</th>
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No premium subscribers yet.</td></tr>
            ) : (
              recent.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: i === recent.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{u.name}</div>
                    <div style={{ fontSize: 13, color: '#64748b' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: 12, 
                      fontSize: 11, 
                      fontWeight: 700, 
                      background: u.plan === 'Gold Premium' ? '#fffbeb' : '#f0f9ff',
                      color: u.plan === 'Gold Premium' ? '#d97706' : '#0ea5e9',
                      border: `1px solid ${u.plan === 'Gold Premium' ? '#fde68a' : '#bae6fd'}`
                    }}>
                      {u.plan}
                    </span>
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 14, color: '#475569' }}>
                    {new Date(u.updatedAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '16px 24px', fontSize: 14, color: '#475569', fontWeight: 500 }}>
                    {u.expiry ? new Date(u.expiry).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
