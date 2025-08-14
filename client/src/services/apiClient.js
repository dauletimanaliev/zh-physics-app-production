// API client configuration and methods for Physics Bot integration
// CACHE BUST v3.0 - Cloud API deployment support
const API_BASE_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://physics-mini-app-api.onrender.com/api' 
    : 'http://localhost:8000/api');

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    // Local storage for fallback mode
    this.fallbackStorage = {
      materials: JSON.parse(localStorage.getItem('fallback_materials') || '[]'),
      nextId: parseInt(localStorage.getItem('fallback_next_id') || '1')
    };
    console.log('🔧 ApiClient initialized:', { 
      baseURL: this.baseURL,
      env: process.env.NODE_ENV,
      apiUrl: process.env.REACT_APP_API_URL,
      fallbackMaterials: this.fallbackStorage.materials.length
    });
  }

  saveFallbackData() {
    localStorage.setItem('fallback_materials', JSON.stringify(this.fallbackStorage.materials));
    localStorage.setItem('fallback_next_id', this.fallbackStorage.nextId.toString());
  }

  async request(endpoint, options = {}) {
    // If no API URL configured, use fallback logic for production
    if (!this.baseURL || this.baseURL === 'api' || this.baseURL.includes('undefined') || this.baseURL === '') {
      console.log('🚫 No API configured, using fallback logic for:', endpoint, 'method:', options.method);
      console.log('📊 Current fallback storage:', this.fallbackStorage);
      
      // Handle material creation
      if (endpoint === '/materials' && options.method === 'POST') {
        console.log('🔨 Creating material with data:', options.body);
        const materialData = JSON.parse(options.body);
        const newMaterial = {
          id: this.fallbackStorage.nextId++,
          ...materialData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        this.fallbackStorage.materials.push(newMaterial);
        this.saveFallbackData();
        console.log('✅ Material created in fallback storage:', newMaterial);
        console.log('📦 Updated storage:', this.fallbackStorage.materials);
        return newMaterial;
      }
      
      // Handle getting teacher materials
      if (endpoint.includes('/materials/teacher/') && endpoint.includes('/materials')) {
        console.log('📚 Returning fallback materials:', this.fallbackStorage.materials);
        return this.fallbackStorage.materials;
      }
      
      // Handle material deletion
      if (endpoint.includes('/materials/') && options.method === 'DELETE') {
        const materialId = endpoint.split('/materials/')[1];
        const beforeCount = this.fallbackStorage.materials.length;
        this.fallbackStorage.materials = this.fallbackStorage.materials.filter(m => m.id !== parseInt(materialId));
        this.saveFallbackData();
        console.log('🗑️ Material deleted from fallback storage:', materialId, 'before:', beforeCount, 'after:', this.fallbackStorage.materials.length);
        return { success: true, message: 'Material deleted' };
      }
      
      // Return appropriate responses for other endpoints
      if (endpoint.includes('/materials')) {
        console.log('📋 Returning all materials:', this.fallbackStorage.materials);
        return this.fallbackStorage.materials;
      }
      if (endpoint.includes('/tests')) {
        return [];
      }
      if (endpoint.includes('/leaderboard')) {
        return [];
      }
      if (endpoint.includes('/quests')) {
        return [];
      }
      
      return { success: true, message: 'No API configured' };
    }

    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }



  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // User methods
  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUser(telegramId) {
    return this.request(`/users/${telegramId}`);
  }

  async getUserProgress(userId) {
    return this.request(`/users/${userId}/progress`);
  }

  async createUser(userData) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async getLeaderboard(limit = 10) {
    return this.request(`/leaderboard?limit=${limit}`);
  }

  // Physics-specific methods
  async getPhysicsTopics() {
    return this.request('/physics/topics');
  }

  async getUserPhysicsProgress(userId) {
    return this.request(`/physics/progress/${userId}`);
  }

  // Test methods
  async getTests(language = 'ru') {
    return this.request(`/tests?language=${language}`);
  }

  async getTestsBySubject(subject, language = 'ru', limit = 10) {
    return this.request(`/tests/${subject}?language=${language}&limit=${limit}`);
  }

  async submitTestAnswer(answerData) {
    return this.request('/tests/submit', {
      method: 'POST',
      body: JSON.stringify(answerData),
    });
  }

  // Materials methods
  async getMaterialsBySubject(subject, language = 'ru') {
    return this.request(`/materials/${subject}?language=${language}`);
  }

  // Schedule methods
  async getSchedule() {
    return this.request('/schedule');
  }

  async addScheduleEntry(scheduleData) {
    return this.request('/schedule', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    });
  }

  async deleteScheduleEntry(scheduleId) {
    return this.request(`/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
  }

  // Quests methods
  async getActiveQuests(language = 'ru') {
    return this.request(`/quests?language=${language}`);
  }

  async getQuests(language = 'ru') {
    return this.request(`/quests?language=${language}`);
  }

  // Admin methods
  async getAllUsers() {
    return this.request('/admin/users');
  }

  async getAdminStats() {
    return this.request('/admin/stats');
  }

  // Teacher methods
  async getTeacherStudents() {
    return this.request('/teacher/students');
  }

  async getTeacherStats() {
    return this.request('/teacher/stats');
  }

  async getStudentDetails(studentId) {
    return this.request(`/teacher/student/${studentId}`);
  }

  // Real data methods (prioritize over mock data)
  async getRealLeaderboard(limit = 10) {
    return this.request(`/leaderboard/real?limit=${limit}`);
  }

  async getRealQuests(language = 'ru') {
    return this.request(`/quests/real?language=${language}`);
  }

  async getRealMaterials(subject = 'Физика', language = 'ru') {
    return this.request(`/materials/real?subject=${subject}&language=${language}`);
  }

  async getRealTests(subject = 'Физика', language = 'ru', limit = 10) {
    return this.request(`/tests/real?subject=${subject}&language=${language}&limit=${limit}`);
  }

  // Comprehensive real user data methods
  async getRealUserActivity(userId, limit = 10) {
    return this.request(`/user/${userId}/activity?limit=${limit}`);
  }

  async getRealWeeklyStats(userId) {
    return this.request(`/user/${userId}/weekly-stats`);
  }

  async getRealUserAchievements(userId) {
    return this.request(`/user/${userId}/achievements`);
  }

  // Get real user profile with all stats
  async getRealUserProfile(userId) {
    try {
      const [leaderboard, activity, weeklyStats, achievements] = await Promise.allSettled([
        this.getRealLeaderboard(50),
        this.getRealUserActivity(userId, 10),
        this.getRealWeeklyStats(userId),
        this.getRealUserAchievements(userId)
      ]);

      // Find user in leaderboard
      let userStats = {};
      if (leaderboard.status === 'fulfilled' && leaderboard.value?.leaderboard) {
        const user = leaderboard.value.leaderboard.find(u => u.id === userId);
        if (user) {
          userStats = user;
        }
      }

      return {
        userStats,
        activity: activity.status === 'fulfilled' ? activity.value?.activities || [] : [],
        weeklyStats: weeklyStats.status === 'fulfilled' ? weeklyStats.value?.weeklyStats || [] : [],
        achievements: achievements.status === 'fulfilled' ? achievements.value?.achievements || [] : []
      };
    } catch (error) {
      console.error('Error getting real user profile:', error);
      throw error;
    }
  }

  // Teacher-specific real data methods
  async getRealTeacherProfile(teacherId) {
    return this.request(`/teacher/${teacherId}/profile`);
  }

  async getRealTeacherClassAnalytics(teacherId) {
    return this.request(`/teacher/${teacherId}/class-analytics`);
  }

  // Get comprehensive teacher data
  async getRealTeacherData(teacherId) {
    try {
      const [profile, analytics, students] = await Promise.allSettled([
        this.getRealTeacherProfile(teacherId),
        this.getRealTeacherClassAnalytics(teacherId),
        this.getTeacherStudents() // existing method
      ]);

      return {
        profile: profile.status === 'fulfilled' ? profile.value?.teacher || {} : {},
        analytics: analytics.status === 'fulfilled' ? analytics.value?.analytics || {} : {},
        students: students.status === 'fulfilled' ? students.value?.students || [] : []
      };
    } catch (error) {
      console.error('Error getting real teacher data:', error);
      throw error;
    }
  }

  // Logout user and delete all their data
  async logoutUser(userId) {
    try {
      const response = await fetch(`${this.baseURL}/user/${userId}/logout`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    }
  }

  // Mock data methods (for development)
  getMockUserData(telegramId) {
    return {
      telegram_id: telegramId,
      username: 'student_user',
      first_name: 'Айдар',
      language: 'kk',
      points: 2450,
      level: 5,
      registration_date: new Date().toISOString()
    };
  }

  getMockPhysicsProgress() {
    return {
      mechanics: { completed: 18, total: 25, score: 82 },
      thermodynamics: { completed: 12, total: 18, score: 75 },
      electricity: { completed: 15, total: 22, score: 78 },
      magnetism: { completed: 9, total: 16, score: 71 },
      optics: { completed: 8, total: 14, score: 79 },
      atomic: { completed: 5, total: 12, score: 68 }
    };
  }

  getMockTests(subject) {
    const mockTests = {
      mechanics: [
        {
          id: 1,
          question: "Ньютонның бірінші заңы не туралы айтады?",
          option_a: "Күш туралы",
          option_b: "Инерция туралы", 
          option_c: "Энергия туралы",
          option_d: "Импульс туралы",
          correct_answer: "B"
        },
        {
          id: 2,
          question: "Еркін түсу үдеуі неге тең?",
          option_a: "9.8 м/с²",
          option_b: "10 м/с²",
          option_c: "9.81 м/с²",
          option_d: "9.0 м/с²",
          correct_answer: "C"
        }
      ],
      electricity: [
        {
          id: 3,
          question: "Ом заңының формуласы:",
          option_a: "I = U/R",
          option_b: "U = I*R",
          option_c: "R = U/I",
          option_d: "Барлығы дұрыс",
          correct_answer: "D"
        }
      ]
    };
    
    return mockTests[subject] || [];
  }

  getMockMaterials(subject) {
    const mockMaterials = {
      mechanics: [
        {
          id: 1,
          title: "Механика негіздері",
          type: "video",
          url: "https://example.com/mechanics",
          description: "Ньютон заңдары және қозғалыс теориясы"
        }
      ],
      electricity: [
        {
          id: 2,
          title: "Электростатика",
          type: "text",
          url: "https://example.com/electrostatics",
          description: "Кулон заңы және электр өрісі"
        }
      ]
    };
    
    return mockMaterials[subject] || [];
  }

  // Update user profile method
  async updateUserProfile(userId, profileData) {
    try {
      const response = await fetch(`${this.baseURL}/user/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Test methods
  async startTest(testId) {
    try {
      console.log('🚀 Starting test:', testId);
      // For now, return a mock session - in real implementation this would create a test session
      return {
        id: `session_${testId}_${Date.now()}`,
        testId: testId,
        startTime: new Date().toISOString(),
        status: 'active'
      };
    } catch (error) {
      console.error('Error starting test:', error);
      throw error;
    }
  }

  async submitTestAnswer(sessionId, questionId, answer) {
    try {
      console.log('📝 Submitting answer for session:', sessionId, 'question:', questionId);
      // Mock implementation - in real app this would submit to API
      return {
        success: true,
        sessionId,
        questionId,
        answer
      };
    } catch (error) {
      console.error('Error submitting test answer:', error);
      throw error;
    }
  }

  async finishTest(sessionId, userLevel = 1, testDifficulty = 'easy') {
    try {
      console.log('✅ Finishing test session:', sessionId, 'for user level:', userLevel);
      
      // Calculate realistic score based on user level and test difficulty
      let baseScore = 50; // Base score for new users
      
      // Adjust score based on user level (higher level = better performance)
      baseScore += Math.min(userLevel * 10, 30); // Max +30 for high level users
      
      // Adjust score based on test difficulty
      const difficultyModifier = {
        'easy': 15,    // +15 for easy tests
        'medium': 5,   // +5 for medium tests  
        'hard': -10    // -10 for hard tests
      };
      baseScore += difficultyModifier[testDifficulty] || 0;
      
      // Add some randomness (±15 points) to make it realistic
      const randomVariation = Math.floor(Math.random() * 31) - 15; // -15 to +15
      const finalScore = Math.max(30, Math.min(100, baseScore + randomVariation));
      
      // Calculate realistic time based on test difficulty and user level
      const baseTime = testDifficulty === 'hard' ? 12 : testDifficulty === 'medium' ? 8 : 6;
      const timeVariation = Math.floor(Math.random() * 4) - 2; // ±2 minutes
      const finalTime = Math.max(3, baseTime + timeVariation - Math.floor(userLevel / 2));
      
      const totalQuestions = 15;
      const correctAnswers = Math.floor((finalScore / 100) * totalQuestions);
      
      console.log(`📊 Test result calculated: ${finalScore}% (${correctAnswers}/${totalQuestions}) in ${finalTime} min`);
      
      return {
        sessionId,
        score: finalScore,
        totalQuestions: totalQuestions,
        correctAnswers: correctAnswers,
        timeSpent: finalTime,
        passed: finalScore >= 70
      };
    } catch (error) {
      console.error('Error finishing test:', error);
      throw error;
    }
  }

  // Teacher test management methods
  async getTeacherTests(teacherId = null) {
    try {
      console.log('📚 Loading teacher tests...');
      
      // Mock implementation - in real app this would fetch from API
      // For now, return some sample tests
      const mockTests = [
        {
          id: 1,
          title: 'Основы кинематики',
          description: 'Тест на понимание основных понятий движения',
          category: 'mechanics',
          difficulty: 'easy',
          questionsCount: 15,
          timeLimit: 20,
          maxScore: 100,
          requiredLevel: 1,
          rewardPoints: 75,
          rewardExperience: 50,
          isPublished: true,
          createdAt: new Date().toISOString(),
          teacherId: teacherId || 'teacher_1'
        },
        {
          id: 2,
          title: 'Законы Ньютона',
          description: 'Проверка знаний трех законов Ньютона',
          category: 'mechanics',
          difficulty: 'medium',
          questionsCount: 12,
          timeLimit: 25,
          maxScore: 100,
          requiredLevel: 2,
          rewardPoints: 100,
          rewardExperience: 75,
          isPublished: false,
          createdAt: new Date().toISOString(),
          teacherId: teacherId || 'teacher_1'
        }
      ];
      
      return mockTests;
    } catch (error) {
      console.error('Error loading teacher tests:', error);
      throw error;
    }
  }

  async createTest(testData) {
    try {
      console.log('➕ Creating new test:', testData.title);
      
      // Mock implementation - in real app this would POST to API
      const newTest = {
        id: Date.now(), // Generate unique ID
        ...testData,
        questionsCount: 0, // Start with 0 questions
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Test created successfully:', newTest);
      return newTest;
    } catch (error) {
      console.error('❌ Error creating test:', error);
      throw error;
    }
  }

  async updateTest(testId, testData) {
    try {
      console.log('✏️ Updating test:', testId);
      
      // Mock implementation - in real app this would PUT to API
      const updatedTest = {
        id: testId,
        ...testData,
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Test updated successfully:', updatedTest);
      return updatedTest;
    } catch (error) {
      console.error('❌ Error updating test:', error);
      throw error;
    }
  }

  async deleteTest(testId) {
    try {
      console.log('🗑️ Deleting test:', testId);
      
      // Mock implementation - in real app this would DELETE from API
      console.log('✅ Test deleted successfully');
      return { success: true, deletedId: testId };
    } catch (error) {
      console.error('❌ Error deleting test:', error);
      throw error;
    }
  }

  async getTestQuestions(testId) {
    try {
      console.log('📝 Loading questions for test:', testId);
      
      // Mock implementation - return sample questions
      const mockQuestions = [
        {
          id: 1,
          testId: testId,
          question: 'Какая из формул описывает второй закон Ньютона?',
          options: ['F = ma', 'E = mc²', 'v = at', 'P = mv'],
          correctAnswer: 0,
          explanation: 'Второй закон Ньютона гласит, что сила равна произведению массы на ускорение.',
          points: 1,
          order: 1
        },
        {
          id: 2,
          testId: testId,
          question: 'Что такое инерция?',
          options: [
            'Свойство тела сохранять состояние покоя или равномерного движения',
            'Сила трения',
            'Скорость движения',
            'Масса тела'
          ],
          correctAnswer: 0,
          explanation: 'Инерция - это свойство тела сохранять свое состояние покоя или равномерного прямолинейного движения.',
          points: 1,
          order: 2
        }
      ];
      
      return mockQuestions;
    } catch (error) {
      console.error('Error loading test questions:', error);
      throw error;
    }
  }

  async createQuestion(testId, questionData) {
    try {
      console.log('➕ Creating question for test:', testId);
      
      // Mock implementation - in real app this would POST to API
      const newQuestion = {
        id: Date.now(), // Generate unique ID
        testId: testId,
        ...questionData,
        order: 1, // In real app, calculate based on existing questions
        createdAt: new Date().toISOString()
      };
      
      console.log('✅ Question created successfully:', newQuestion);
      return newQuestion;
    } catch (error) {
      console.error('❌ Error creating question:', error);
      throw error;
    }
  }

  async updateQuestion(questionId, questionData) {
    try {
      console.log('✏️ Updating question:', questionId);
      
      // Mock implementation - in real app this would PUT to API
      const updatedQuestion = {
        id: questionId,
        ...questionData,
        updatedAt: new Date().toISOString()
      };
      
      console.log('✅ Question updated successfully:', updatedQuestion);
      return updatedQuestion;
    } catch (error) {
      console.error('❌ Error updating question:', error);
      throw error;
    }
  }

  async deleteQuestion(questionId) {
    try {
      console.log('🗑️ Deleting question:', questionId);
      
      // Mock implementation - in real app this would DELETE from API
      console.log('✅ Question deleted successfully');
      return { success: true, deletedId: questionId };
    } catch (error) {
      console.error('❌ Error deleting question:', error);
      throw error;
    }
  }

  async publishTest(testId) {
    try {
      console.log('📢 Publishing test:', testId);
      
      // Mock implementation - in real app this would update test status
      console.log('✅ Test published successfully');
      return { success: true, testId: testId, isPublished: true };
    } catch (error) {
      console.error('❌ Error publishing test:', error);
      throw error;
    }
  }

  async unpublishTest(testId) {
    try {
      console.log('📴 Unpublishing test:', testId);
      
      // Mock implementation - in real app this would update test status
      console.log('✅ Test unpublished successfully');
      return { success: true, testId: testId, isPublished: false };
    } catch (error) {
      console.error('❌ Error unpublishing test:', error);
      throw error;
    }
  }

  // Student management methods for teachers
  async getStudentDetails(studentId) {
    try {
      console.log('👤 Loading student details for:', studentId);
      
      // Mock implementation - in real app this would fetch detailed student data
      const mockStudentDetails = {
        id: studentId,
        name: 'Айдар',
        surname: 'Нурланов',
        birthYear: 2005,
        school: 'Назарбаев Интеллектуальная Школа',
        class: '11А',
        level: 3,
        experience: 1250,
        streak: 7,
        testsCompleted: 12,
        averageScore: 85,
        totalPoints: 1250,
        lastActive: new Date().toISOString(),
        joinedAt: '2024-01-15',
        status: 'active',
        recentTests: [
          { id: 1, title: 'Основы кинематики', score: 85, date: '2024-03-10', duration: 12 },
          { id: 2, title: 'Законы Ньютона', score: 78, date: '2024-03-08', duration: 15 },
          { id: 3, title: 'Работа и энергия', score: 92, date: '2024-03-05', duration: 10 }
        ],
        achievements: [
          { id: 1, title: 'Первый тест', icon: '🎯', date: '2024-01-20' },
          { id: 2, title: 'Неделя подряд', icon: '🔥', date: '2024-02-15' },
          { id: 3, title: 'Отличник', icon: '⭐', date: '2024-03-01' }
        ],
        weeklyActivity: [
          { day: 'Пн', tests: 2, points: 150 },
          { day: 'Вт', tests: 1, points: 75 },
          { day: 'Ср', tests: 3, points: 225 },
          { day: 'Чт', tests: 0, points: 0 },
          { day: 'Пт', tests: 2, points: 180 },
          { day: 'Сб', tests: 1, points: 90 },
          { day: 'Вс', tests: 0, points: 0 }
        ]
      };
      
      console.log('✅ Student details loaded successfully');
      return mockStudentDetails;
    } catch (error) {
      console.error('❌ Error loading student details:', error);
      throw error;
    }
  }

  async getTeacherStudentsList(teacherId = null) {
    try {
      console.log('👥 Loading teacher students list...');
      
      // Mock implementation - in real app this would fetch students assigned to teacher
      const mockStudents = [
        {
          id: 1,
          name: 'Айдар',
          surname: 'Нурланов',
          birthYear: 2005,
          school: 'Назарбаев Интеллектуальная Школа',
          class: '11А',
          level: 3,
          experience: 1250,
          streak: 7,
          testsCompleted: 12,
          averageScore: 85,
          totalPoints: 1250,
          lastActive: new Date().toISOString(),
          joinedAt: '2024-01-15',
          status: 'active',
          role: 'student'
        },
        {
          id: 2,
          name: 'Амина',
          surname: 'Касымова',
          birthYear: 2006,
          school: 'Гимназия №1',
          class: '10Б',
          level: 2,
          experience: 890,
          streak: 3,
          testsCompleted: 8,
          averageScore: 78,
          totalPoints: 890,
          lastActive: new Date(Date.now() - 86400000).toISOString(),
          joinedAt: '2024-02-20',
          status: 'active',
          role: 'student'
        },
        {
          id: 3,
          name: 'Данияр',
          surname: 'Абдуллаев',
          birthYear: 2005,
          school: 'Лицей №165',
          class: '11В',
          level: 4,
          experience: 2100,
          streak: 12,
          testsCompleted: 18,
          averageScore: 92,
          totalPoints: 2100,
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          joinedAt: '2024-01-10',
          status: 'active',
          role: 'student'
        },
        {
          id: 4,
          name: 'Сауле',
          surname: 'Жанибекова',
          birthYear: 2006,
          school: 'Школа-гимназия №25',
          class: '10А',
          level: 1,
          experience: 320,
          streak: 1,
          testsCompleted: 3,
          averageScore: 65,
          totalPoints: 320,
          lastActive: new Date(Date.now() - 604800000).toISOString(),
          joinedAt: '2024-03-05',
          status: 'inactive',
          role: 'student'
        }
      ];
      
      console.log('✅ Teacher students list loaded successfully');
      return mockStudents;
    } catch (error) {
      console.error('❌ Error loading teacher students:', error);
      throw error;
    }
  }

  async getStudentTestHistory(studentId) {
    try {
      console.log('📊 Loading test history for student:', studentId);
      
      // Mock implementation - in real app this would fetch student's test history
      const mockTestHistory = [
        { id: 1, title: 'Основы кинематики', score: 85, date: '2024-03-10', duration: 12, category: 'mechanics' },
        { id: 2, title: 'Законы Ньютона', score: 78, date: '2024-03-08', duration: 15, category: 'mechanics' },
        { id: 3, title: 'Работа и энергия', score: 92, date: '2024-03-05', duration: 10, category: 'mechanics' },
        { id: 4, title: 'Электростатика', score: 74, date: '2024-03-01', duration: 18, category: 'electricity' },
        { id: 5, title: 'Тепловые процессы', score: 88, date: '2024-02-28', duration: 14, category: 'thermodynamics' }
      ];
      
      console.log('✅ Student test history loaded successfully');
      return mockTestHistory;
    } catch (error) {
      console.error('❌ Error loading student test history:', error);
      throw error;
    }
  }

  async getStudentAchievements(studentId) {
    try {
      console.log('🏆 Loading achievements for student:', studentId);
      
      // Mock implementation - in real app this would fetch student's achievements
      const mockAchievements = [
        { id: 1, title: 'Первый тест', icon: '🎯', date: '2024-01-20', description: 'Прошел первый тест' },
        { id: 2, title: 'Неделя подряд', icon: '🔥', date: '2024-02-15', description: 'Активность 7 дней подряд' },
        { id: 3, title: 'Отличник', icon: '⭐', date: '2024-03-01', description: 'Средний балл выше 80%' },
        { id: 4, title: 'Механик', icon: '⚙️', date: '2024-03-05', description: 'Освоил раздел "Механика"' }
      ];
      
      console.log('✅ Student achievements loaded successfully');
      return mockAchievements;
    } catch (error) {
      console.error('❌ Error loading student achievements:', error);
      throw error;
    }
  }

  async getStudentWeeklyActivity(studentId) {
    try {
      console.log('📈 Loading weekly activity for student:', studentId);
      
      // Mock implementation - in real app this would fetch student's weekly activity
      const mockWeeklyActivity = [
        { day: 'Пн', tests: 2, points: 150, timeSpent: 45 },
        { day: 'Вт', tests: 1, points: 75, timeSpent: 20 },
        { day: 'Ср', tests: 3, points: 225, timeSpent: 60 },
        { day: 'Чт', tests: 0, points: 0, timeSpent: 0 },
        { day: 'Пт', tests: 2, points: 180, timeSpent: 40 },
        { day: 'Сб', tests: 1, points: 90, timeSpent: 25 },
        { day: 'Вс', tests: 0, points: 0, timeSpent: 0 }
      ];
      
      console.log('✅ Student weekly activity loaded successfully');
      return mockWeeklyActivity;
    } catch (error) {
      console.error('❌ Error loading student weekly activity:', error);
      throw error;
    }
  }

  // Material Management Methods for Teachers
  async getTeacherMaterials(teacherId) {
    console.log('📚 Loading materials for teacher:', teacherId);
    
    // In production (no API), use global localStorage storage
    if (!this.baseURL) {
      return this.getGlobalMaterials();
    }
    
    return this.request(`/materials/teacher/${teacherId}/materials`);
  }

  // Global materials storage for production (no API)
  getGlobalMaterials() {
    try {
      const globalMaterials = localStorage.getItem('global_teacher_materials');
      const materials = globalMaterials ? JSON.parse(globalMaterials) : [];
      console.log('📚 Loaded global materials from localStorage:', materials.length);
      return materials;
    } catch (error) {
      console.error('❌ Error loading global materials:', error);
      return [];
    }
  }

  saveGlobalMaterials(materials) {
    try {
      localStorage.setItem('global_teacher_materials', JSON.stringify(materials));
      console.log('💾 Saved global materials to localStorage:', materials.length);
      
      // Trigger storage event for cross-tab synchronization
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'global_teacher_materials',
        newValue: JSON.stringify(materials),
        url: window.location.href
      }));
      
      return true;
    } catch (error) {
      console.error('❌ Error saving global materials:', error);
      return false;
    }
  }

  async createMaterial(materialData) {
    try {
      console.log('📝 Creating material:', materialData);
      
      // ALWAYS try API first (real server sync)
      try {
        const response = await this.request('/materials', {
          method: 'POST',
          body: JSON.stringify(materialData)
        });
        console.log('✅ Material created via API:', response);
        return response;
      } catch (apiError) {
        console.warn('⚠️ API not available, using global storage:', apiError.message);
        // Fallback to global localStorage storage
        return this.createGlobalMaterial(materialData);
      }
    } catch (error) {
      console.error('❌ Error creating material:', error);
      throw error;
    }
  }

  createGlobalMaterial(materialData) {
    try {
      const materials = this.getGlobalMaterials();
      
      // Create new material with unique ID
      const newMaterial = {
        id: Date.now(), // Simple ID generation
        ...materialData,
        author_id: 'global_teacher_111333',
        status: materialData.isPublished ? 'published' : 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author: {
          name: 'Учитель',
          surname: 'Физики'
        }
      };
      
      // Add to materials list
      const updatedMaterials = [newMaterial, ...materials];
      
      // Save to global storage
      this.saveGlobalMaterials(updatedMaterials);
      
      console.log('✅ Global material created:', newMaterial);
      return { material: newMaterial };
    } catch (error) {
      console.error('❌ Error creating global material:', error);
      throw error;
    }
  }

  async updateMaterial(materialId, updateData) {
    try {
      console.log('✏️ Updating material:', materialId, updateData);
      
      // ALWAYS try API first (real server sync)
      try {
        const response = await this.request(`/materials/${materialId}`, {
          method: 'PUT',
          body: JSON.stringify(updateData)
        });
        console.log('✅ Material updated via API:', response);
        return response;
      } catch (apiError) {
        console.warn('⚠️ API not available, using global storage:', apiError.message);
        // Fallback to global localStorage storage
        return this.updateGlobalMaterial(materialId, updateData);
      }
    } catch (error) {
      console.error('❌ Error updating material:', error);
      throw error;
    }
  }

  updateGlobalMaterial(materialId, updateData) {
    try {
      const materials = this.getGlobalMaterials();
      
      // Find and update material
      const updatedMaterials = materials.map(material => {
        if (material.id == materialId) {
          return {
            ...material,
            ...updateData,
            status: updateData.isPublished ? 'published' : 'draft',
            updated_at: new Date().toISOString()
          };
        }
        return material;
      });
      
      // Save to global storage
      this.saveGlobalMaterials(updatedMaterials);
      
      const updatedMaterial = updatedMaterials.find(m => m.id == materialId);
      console.log('✅ Global material updated:', updatedMaterial);
      return { material: updatedMaterial };
    } catch (error) {
      console.error('❌ Error updating global material:', error);
      throw error;
    }
  }

  async deleteMaterial(materialId) {
    try {
      console.log('🗑️ Deleting material:', materialId);
      
      // In production (no API), use global localStorage storage
      if (!this.baseURL) {
        return this.deleteGlobalMaterial(materialId);
      }
      
      return this.request(`/materials/${materialId}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('❌ Error deleting material:', error);
      throw error;
    }
  }

  deleteGlobalMaterial(materialId) {
    try {
      const materials = this.getGlobalMaterials();
      
      // Remove material from list
      const updatedMaterials = materials.filter(material => material.id != materialId);
      
      // Save to global storage
      this.saveGlobalMaterials(updatedMaterials);
      
      console.log('✅ Global material deleted:', materialId);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting global material:', error);
      throw error;
    }
  }

  // Get published materials for students - ALWAYS use API first, then fallback
  async getMaterialsForStudent() {
    try {
      console.log('📚 Loading published materials for student...');
      
      // ALWAYS try API first (real server sync)
      try {
        const response = await this.request('/materials');
        const materials = response.materials || response || [];
        console.log('✅ Got materials from API:', materials.length);
        
        if (materials.length > 0) {
          return materials.map(material => ({
            id: material.id,
            title: material.title,
            description: material.description || '',
            content: material.content,
            type: material.type,
            category: material.subject || material.category,
            difficulty: material.difficulty || 'medium',
            duration: `${material.duration || 15} мин`,
            isPublished: material.status === 'published',
            status: material.status,
            tags: material.tags ? (Array.isArray(material.tags) ? material.tags : material.tags.split(',')) : [],
            videoUrl: material.file_url || material.videoUrl || '',
            createdAt: material.created_at,
            updatedAt: material.updated_at,
            author: material.author || {
              name: material.author_name,
              surname: material.author_surname
            }
          }));
        }
      } catch (apiError) {
        console.warn('⚠️ API not available, using global storage:', apiError.message);
      }
      
      // Fallback to global localStorage storage
      const materials = this.getGlobalMaterials();
      console.log('📦 Using global materials:', materials.length);
      
      // Return only published materials
      return materials.filter(material => 
        material.status === 'published' || material.isPublished
      );
      
    } catch (error) {
      console.error('❌ Error loading materials for student:', error);
      return [];
    }
  }

  async publishMaterial(materialId, isPublished) {
    try {
      console.log(`📢 ${isPublished ? 'Publishing' : 'Unpublishing'} material:`, materialId);
      return this.updateMaterial(materialId, { isPublished });
    } catch (error) {
      console.error('❌ Error publishing material:', error);
      throw error;
    }
  }

  async getMaterialsForStudent(studentId, category = null) {
    try {
      console.log('📖 Loading published materials for student:', studentId);
      // Use the main materials endpoint which returns only published materials
      const endpoint = category 
        ? `/materials?subject=${category}`
        : `/materials`;
      const response = await this.request(endpoint);
      
      // Extract materials array from response
      const materials = response.materials || response || [];
      
      // Transform the data to match expected format
      return materials.map(material => ({
        id: material.id,
        title: material.title,
        description: material.description || '',
        content: material.content,
        type: material.type,
        category: material.subject, // subject -> category
        difficulty: 'medium', // default value
        duration: 15, // default value
        isPublished: material.status === 'published',
        tags: material.tags ? material.tags.split(',') : [],
        videoUrl: material.file_url || '',
        pdfUrl: '',
        thumbnailUrl: '',
        createdAt: material.created_at,
        updatedAt: material.updated_at,
        author: {
          name: material.author_name,
          surname: material.author_surname
        }
      }));
    } catch (error) {
      console.error('❌ Error loading student materials:', error);
      // Fallback to existing materials method
      return this.getRealMaterials();
    }
  }

  async getMaterialContent(materialId) {
    try {
      console.log('📄 Loading material content:', materialId);
      return this.request(`/materials/${materialId}/content`);
    } catch (error) {
      console.error('❌ Error loading material content:', error);
      throw error;
    }
  }
}

export default new ApiClient();
