import axios from 'axios';

class ApiClient {
  constructor() {
    const baseURL = process.env.REACT_APP_API_URL || 'https://web-production-2678c.up.railway.app/api';
    
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('🔗 API Client initialized with base URL:', baseURL);
    console.log('🏗️ Environment:', process.env.NODE_ENV || 'development');
  }

  async request(endpoint, method = 'GET', data = null, params = {}) {
    try {
      const config = {
        method,
        url: endpoint,
        ...(data && { data }),
        ...(Object.keys(params).length && { params }),
      };

      const response = await this.client.request(config);
      return response.data;
    } catch (error) {
      console.log('API request failed:', error);
      
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', error.response.data);
      }
      console.log('❌ API request failed:', error.message);
      throw error;
    }
  }

  // Auth methods
  async createUser(userData) {
    console.log('Creating user with data:', userData);
    return this.request('/users', 'POST', userData);
  }

  async logoutUser(userId) {
    return this.request(`/user/${userId}/logout`, 'DELETE');
  }

  async getUser(userId) {
    return this.request(`/users/${userId}`);
  }

  // User methods
  async updateUser(userId, userData) {
    return this.request(`/users/${userId}`, 'PUT', userData);
  }

  // Materials methods
  async getMaterials(subject = 'Физика', language = 'ru') {
    return this.request(`/materials?subject=${subject}&language=${language}`);
  }

  async getMaterial(materialId, userId = null) {
    const params = userId ? { user_id: userId } : {};
    return this.request(`/materials/${materialId}`, 'GET', null, params);
  }

  async getMaterialsBySubject(subject, language = 'ru') {
    return this.request(`/materials/by-subject/${subject}?language=${language}`);
  }

  async createMaterial(materialData) {
    return this.request('/materials', 'POST', materialData);
  }

  async updateMaterial(materialId, materialData) {
    return this.request(`/materials/${materialId}`, 'PUT', materialData);
  }

  async deleteMaterial(materialId) {
    return this.request(`/materials/${materialId}`, 'DELETE');
  }

  async getTeacherMaterials(teacherId) {
    return this.request(`/materials/teacher/${teacherId}`);
  }

  async getMaterialsForStudent(userId = null, category = null) {
    const params = {};
    if (userId) params.user_id = userId;
    if (category) params.category = category;
    return this.request('/materials/published', 'GET', null, params);
  }

  async getUserProgress(userId) {
    return this.request(`/users/${userId}/progress`);
  }

  async getUserBookmarks(userId) {
    return this.request(`/users/${userId}/bookmarks`);
  }

  async addBookmark(userId, materialId) {
    return this.request(`/users/${userId}/bookmarks`, 'POST', { material_id: materialId });
  }

  async removeBookmark(userId, materialId) {
    return this.request(`/users/${userId}/bookmarks/${materialId}`, 'DELETE');
  }

  // Teacher methods
  async getTeacherStudents() {
    return this.request('/teacher/students');
  }

  // Tests methods
  async getTests(subject = 'Физика', language = 'ru', limit = 10) {
    return this.request(`/tests?subject=${subject}&language=${language}&limit=${limit}`);
  }

  async submitTestAnswer(testId, answer, userId) {
    return this.request('/tests/submit', 'POST', {
      test_id: testId,
      answer,
      user_id: userId
    });
  }

  // Leaderboard methods
  async getLeaderboard(limit = 10) {
    return this.request(`/leaderboard?limit=${limit}`);
  }

  // Schedule methods (old)
  async getSchedule() {
    return this.request('/schedule');
  }

  async addScheduleEntry(scheduleData) {
    return this.request('/schedule', 'POST', scheduleData);
  }

  async deleteScheduleEntry(scheduleId) {
    return this.request(`/schedule/${scheduleId}`, 'DELETE');
  }

  // Quests methods
  async getActiveQuests(language = 'ru') {
    return this.request(`/quests?language=${language}`);
  }

  async getQuests(language = 'ru') {
    return this.request(`/quests?language=${language}`);
  }

  // Admin methods
  async getAdminStats() {
    return this.request('/admin/stats');
  }

  async getAllUsers() {
    return this.request('/admin/users');
  }

  // Teacher methods
  async getTeacherStudents() {
    return this.request('/teacher/students');
  }

  async getTeacherStats() {
    return this.request('/teacher/stats');
  }

  async getStudentDetails(studentId) {
    return this.request(`/teacher/students/${studentId}`);
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

  // Schedule methods (new system)
  async createSchedule(scheduleData) {
    return this.request('/schedules', 'POST', scheduleData);
  }

  async getUserSchedules(userId) {
    console.log('🔍 API: Getting schedules for user:', userId);
    const result = await this.request(`/schedules/user/${userId}`);
    console.log('🔍 API: Schedules response:', result);
    return result;
  }

  async getPublicSchedules(userId = null) {
    console.log('🔍 API: Getting all public schedules...');
    const url = userId ? `/schedules/public?user_id=${userId}` : '/schedules/public';
    const result = await this.request(url);
    console.log('🔍 API: Public schedules response:', result);
    return result;
  }

  async getScheduleDetails(scheduleId) {
    return this.request(`/schedules/${scheduleId}`);
  }

  async addScheduleEntry(scheduleId, entryData) {
    return this.request(`/schedules/${scheduleId}/entries`, 'POST', entryData);
  }

  async updateScheduleVisibility(scheduleId, visibility) {
    return this.request(`/schedules/${scheduleId}/visibility`, 'PUT', { visibility });
  }

  async updateSchedule(scheduleId, scheduleData) {
    return this.request(`/schedules/${scheduleId}`, 'PUT', scheduleData);
  }

  async deleteSchedule(scheduleId) {
    return this.request(`/schedules/${scheduleId}`, 'DELETE');
  }

  async deleteScheduleEntry(entryId) {
    return this.request(`/schedule-entries/${entryId}`, 'DELETE');
  }

  // Comprehensive real user data methods
  async getRealUserActivity(userId, limit = 10) {
    return this.request(`/user/${userId}/activity?limit=${limit}`);
  }

  async getRealWeeklyStats(userId) {
    return this.request(`/user/${userId}/weekly-stats`);
  }

  async getRealUserProgress(userId) {
    return this.request(`/user/${userId}/progress`);
  }

  async getRealUserAchievements(userId) {
    return this.request(`/user/${userId}/achievements`);
  }

  async getRealUserTests(userId, limit = 10) {
    return this.request(`/user/${userId}/tests?limit=${limit}`);
  }

  async getRealUserMaterials(userId, limit = 10) {
    return this.request(`/user/${userId}/materials?limit=${limit}`);
  }

  async getRealUserQuests(userId, limit = 10) {
    return this.request(`/user/${userId}/quests?limit=${limit}`);
  }

  async getRealStudentStats() {
    return this.request('/student/real-stats');
  }

  async getRealTeacherStats() {
    return this.request('/teacher/real-stats');
  }

  async getRealAdminStats() {
    return this.request('/admin/real-stats');
  }

  async getRealDirectorStats() {
    return this.request('/director/real-stats');
  }

  async getRealMaterialViews(materialId) {
    return this.request(`/materials/${materialId}/real-views`);
  }

  async getRealTestResults(testId) {
    return this.request(`/tests/${testId}/real-results`);
  }

  async getRealQuestProgress(questId, userId) {
    return this.request(`/quests/${questId}/real-progress?user_id=${userId}`);
  }

  async getRealScheduleUsage(scheduleId) {
    return this.request(`/schedules/${scheduleId}/real-usage`);
  }

  async getRealSystemStats() {
    return this.request('/system/real-stats');
  }

  // AI Physics Question Generation
  async generatePhysicsQuestion() {
    return this.request('/ai/generate-question', 'POST');
  }

  // Check Physics Answer with AI
  async checkPhysicsAnswer(answerData) {
    return this.request('/ai/check-answer', 'POST', answerData);
  }

  // Upload photo and convert to virtual question
  async uploadQuestionPhoto(photoFile) {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    const response = await fetch(`${this.client.defaults.baseURL}/ai/upload-question-photo`, {
      method: 'POST',
      body: formData,
    });
    
    return response.json();
  }

  // Get all virtual questions created from photos
  async getVirtualQuestions() {
    return this.request('/ai/virtual-questions', 'GET');
  }
}

const apiClient = new ApiClient();
export default apiClient;
