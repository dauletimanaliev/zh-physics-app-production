import React, { useState, useEffect } from 'react';
import '../styles/Registration.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const registrationStyles = {
  registration: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '40px 30px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  }
};

const Registration = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: new Date(),
    language: '',
    code: ''
  });
  const [isAnimating, setIsAnimating] = useState(false);

  const languages = [
    { code: 'ru', name: 'Русский', flag: '🇷🇺' },
    { code: 'kz', name: 'Қазақша', flag: '🇰🇿' },
    { code: 'en', name: 'English', flag: '🇺🇸' }
  ];

  useEffect(() => {
    // Initialize Telegram Web App
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      window.Telegram.WebApp.MainButton.hide();
    }
  }, []);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language.code);
    setFormData(prev => ({ ...prev, language: language.code }));
    setIsAnimating(true);
    
    setTimeout(() => {
      setStep(2);
      setIsAnimating(false);
    }, 300);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validCodes = ['111333', '111444'];
    const role = formData.code === '111333' ? 'teacher' : 'student';
    if (formData.firstName && formData.lastName && formData.birthDate && validCodes.includes(formData.code)) {
      setIsAnimating(true);
      setTimeout(() => {
        // Generate unique user ID for database operations
        const userId = Date.now(); // Simple timestamp-based ID
        const telegram_id = window.Telegram?.WebApp?.initDataUnsafe?.user?.id || userId;
        
        onComplete({ 
          ...formData, 
          role,
          id: userId,
          telegram_id: telegram_id,
          user_id: userId,
          registrationTime: new Date().toISOString() // Add registration timestamp
        });
      }, 300);
    } else {
      alert(getTranslation('invalidCode'));
    }
  };

  const getTranslation = (key) => {
    const translations = {
      ru: {
        welcome: 'Добро пожаловать!',
        selectLanguage: 'Выберите язык',
        personalInfo: 'Личная информация',
        firstName: 'Имя',
        lastName: 'Фамилия',
        birthDate: 'Дата рождения',
        code: 'Код',
        continue: 'Продолжить',
        finish: 'Завершить регистрацию',
        invalidCode: 'Пожалуйста, введите корректные данные и код.'
      },
      kz: {
        welcome: 'Қош келдіңіз!',
        selectLanguage: 'Тілді таңдаңыз',
        personalInfo: 'Жеке ақпарат',
        firstName: 'Аты',
        lastName: 'Тегі',
        birthDate: 'Туған күні',
        code: 'Код',
        continue: 'Жалғастыру',
        finish: 'Тіркелуді аяқтау',
        invalidCode: 'Пожалуйста, введите корректные данные и код.'
      },
      en: {
        welcome: 'Welcome!',
        selectLanguage: 'Select Language',
        personalInfo: 'Personal Information',
        firstName: 'First Name',
        lastName: 'Last Name',
        birthDate: 'Birth Date',
        code: 'Code',
        continue: 'Continue',
        finish: 'Complete Registration',
        invalidCode: 'Please enter correct data and code.'
      }
    };
    return translations[selectedLanguage || 'ru'][key] || translations.ru[key];
  };

  if (step === 1) {
    return (
      <div className={`registration-container ${isAnimating ? 'fade-out' : 'fade-in'}`} style={registrationStyles.registration}>
        <div className="registration-content" style={registrationStyles.card}>
          <div className="welcome-section">
            <div className="app-logo">
              <div className="logo-circle">
                <span className="logo-text">⚛️</span>
              </div>
            </div>
            <h1 className="welcome-title">Добро пожаловать!</h1>
            <p className="welcome-subtitle">Изучение физики стало проще</p>
          </div>

          <div className="language-section">
            <h2 className="section-title">Выберите язык</h2>
            <div className="language-options">
              {languages.map((language) => (
                <button
                  key={language.code}
                  className="language-button"
                  onClick={() => handleLanguageSelect(language)}
                >
                  <span className="language-flag">{language.flag}</span>
                  <span className="language-name">{language.name}</span>
                  <span className="language-arrow">→</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`registration-container ${isAnimating ? 'fade-out' : 'fade-in'}`} style={registrationStyles.registration}>
      <div className="registration-content" style={registrationStyles.card}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: '100%' }}></div>
        </div>

        <div className="form-section">
          <h1 className="form-title">{getTranslation('personalInfo')}</h1>
          <p className="form-subtitle">Расскажите немного о себе</p>

          <form onSubmit={handleSubmit} className="registration-form">
            <div className="input-group">
              <label className="input-label">{getTranslation('firstName')}</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Введите ваше имя"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">{getTranslation('lastName')}</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Введите вашу фамилию"
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">{getTranslation('birthDate')}</label>
              <DatePicker
                selected={formData.birthDate}
                onChange={(date) => setFormData(prev => ({ ...prev, birthDate: date }))}
                dateFormat="dd.MM.yyyy"
                className="form-input"
                placeholderText="дд.мм.гггг"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={100}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">{getTranslation('code')}</label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Введите код"
                required
              />
            </div>

            <button type="submit" className="submit-button">
              <span>{getTranslation('finish')}</span>
              <span className="button-arrow">✨</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Registration;
