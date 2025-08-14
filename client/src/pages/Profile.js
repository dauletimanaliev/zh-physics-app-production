import React, { useState } from 'react';
import './Profile.css';

const Profile = () => {
  const [userInfo, setUserInfo] = useState({
    firstName: 'Ваше имя',
    lastName: 'Ваша фамилия',
    birthDate: '2000-01-01',
    avatar: '/path/to/avatar.jpg',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    // Simulate saving to a database
    console.log('User info saved:', userInfo);
    alert('Изменения сохранены!');
  };

  return (
    <div className="profile-page">
      <h1>Профиль</h1>
      <div className="profile-avatar">
        <img src={userInfo.avatar} alt="Аватар" />
        <button>Изменить фото</button>
      </div>
      <div className="profile-info">
        <label>Имя:</label>
        <input type="text" name="firstName" value={userInfo.firstName} onChange={handleChange} />
        <label>Фамилия:</label>
        <input type="text" name="lastName" value={userInfo.lastName} onChange={handleChange} />
        <label>Дата рождения:</label>
        <input type="date" name="birthDate" value={userInfo.birthDate} onChange={handleChange} />
      </div>
      <button onClick={handleSave}>Сохранить изменения</button>
    </div>
  );
};

export default Profile;
