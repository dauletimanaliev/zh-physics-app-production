
import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const LogoutModal = ({ isOpen, onConfirm, onCancel, loading }) => {
  const { colors, isDark } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        background: colors.modalBackground,
        backdropFilter: 'blur(20px)',
        border: `1px solid ${colors.border}`,
        borderRadius: '20px',
        padding: '30px',
        maxWidth: '400px',
        width: '90%',
        textAlign: 'center',
        boxShadow: `0 20px 40px ${colors.shadow}`,
        animation: 'modalSlideIn 0.3s ease-out'
      }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '20px'
        }}>⚠️</div>
        
        <h2 style={{
          color: colors.textDark,
          marginBottom: '15px',
          fontSize: '24px',
          fontWeight: '600'
        }}>Жүйеден шығу</h2>
        
        <p style={{
          color: colors.textSecondary,
          marginBottom: '30px',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          Сіз шынымен жүйеден шығуға сенімдісіз бе?<br/>
          <strong style={{ color: colors.error }}>Барлық деректеріңіз жойылады!</strong>
        </p>
        
        <div style={{
          display: 'flex',
          gap: '15px',
          justifyContent: 'center'
        }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              background: colors.cardBackground,
              border: `2px solid ${colors.border}`,
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              color: colors.textDark,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.background = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
                e.target.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.background = colors.cardBackground;
                e.target.style.transform = 'translateY(0)';
              }
            }}
          >
            Жоқ, қалу
          </button>
          
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: loading ? colors.error : `linear-gradient(135deg, ${colors.error}, #c0392b)`,
              border: 'none',
              borderRadius: '12px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '500',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 8px 20px ${colors.error}40`;
              }
            }}
            onMouseOut={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Шығуда...
              </>
            ) : (
              'Иә, шығу'
            )}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LogoutModal;
