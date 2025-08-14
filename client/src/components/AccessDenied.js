import React from 'react';

const AccessDenied = ({ 
  icon = '🚫', 
  title = 'Доступ ограничен', 
  message = 'У вас нет доступа к этой странице.',
  buttonText = '← Вернуться назад',
  onBack = () => window.history.back()
}) => {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        color: 'white',
        maxWidth: '400px',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div style={{ 
          fontSize: '64px', 
          marginBottom: '20px',
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
        }}>
          {icon}
        </div>
        <h2 style={{ 
          marginBottom: '15px',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          {title}
        </h2>
        <p style={{ 
          opacity: 0.8, 
          lineHeight: '1.5', 
          marginBottom: '25px',
          fontSize: '16px'
        }}>
          {message}
        </p>
        <button
          onClick={onBack}
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 24px',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.3)';
          }}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default AccessDenied;
