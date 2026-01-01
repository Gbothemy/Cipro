import React from 'react';
import './PageHeader.css';

function PageHeader({ 
  title, 
  subtitle, 
  icon, 
  gradient = 'primary',
  actions = null,
  stats = null 
}) {
  return (
    <div className={`page-header ${gradient}`}>
      <div className="page-header-content">
        <div className="page-header-main">
          <div className="page-header-info">
            {icon && <div className="page-header-icon">{icon}</div>}
            <div className="page-header-text">
              <h1 className="page-header-title">{title}</h1>
              {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="page-header-actions">{actions}</div>}
        </div>
        {stats && (
          <div className="page-header-stats">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">{stat.icon}</div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;