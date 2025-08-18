const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method to handle API responses
  async handleResponse(response) {
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    return response.json();
  }

  // Get all materials
  async getMaterials() {
    const response = await fetch(`${this.baseURL}/api/materials`);
    return this.handleResponse(response);
  }

  // Get material by ID
  async getMaterial(id) {
    const response = await fetch(`${this.baseURL}/api/materials/${id}`);
    return this.handleResponse(response);
  }

  // Create new material
  async createMaterial(materialData) {
    const response = await fetch(`${this.baseURL}/api/materials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(materialData)
    });
    return this.handleResponse(response);
  }

  // Update material
  async updateMaterial(id, materialData) {
    const response = await fetch(`${this.baseURL}/api/materials/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(materialData)
    });
    return this.handleResponse(response);
  }

  // Delete material
  async deleteMaterial(id) {
    const response = await fetch(`${this.baseURL}/api/materials/${id}`, {
      method: 'DELETE'
    });
    return this.handleResponse(response);
  }

  // Get all schedules
  async getSchedules() {
    const response = await fetch(`${this.baseURL}/api/schedules`);
    return this.handleResponse(response);
  }

  // Create new schedule
  async createSchedule(scheduleData) {
    const response = await fetch(`${this.baseURL}/api/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scheduleData)
    });
    return this.handleResponse(response);
  }

  // Get user progress
  async getUserProgress(userId) {
    const response = await fetch(`${this.baseURL}/api/users/${userId}/progress`);
    return this.handleResponse(response);
  }

  // Update user progress
  async updateUserProgress(userId, progressData) {
    const response = await fetch(`${this.baseURL}/api/users/${userId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(progressData)
    });
    return this.handleResponse(response);
  }

  // Upload photo and create virtual question
  async uploadPhotoQuestion(photoFile, questionData = {}) {
    const formData = new FormData();
    formData.append('photo', photoFile);
    
    // Add additional question data
    Object.keys(questionData).forEach(key => {
      formData.append(key, questionData[key]);
    });

    const response = await fetch(`${this.baseURL}/api/ai/photo-to-question`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Upload question photo (alias for compatibility)
  async uploadQuestionPhoto(photoFile, questionData = {}) {
    return this.uploadPhotoQuestion(photoFile, questionData);
  }

  // Generate AI question
  async generateAIQuestion(params = {}) {
    const response = await fetch(`${this.baseURL}/api/ai/generate-question`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get all virtual questions
  async getVirtualQuestions() {
    const response = await fetch(`${this.baseURL}/api/ai/virtual-questions`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Check answer with AI - enhanced with detailed feedback
  async checkAnswer(answerData) {
    const response = await fetch(`${this.baseURL}/api/ai/check-answer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...answerData,
        request_detailed_feedback: true,
        request_explanation: true
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  }

  // Check solution photo with AI
  async checkSolutionPhoto(photoFile) {
    const formData = new FormData();
    formData.append('photo', photoFile);

    const response = await fetch(`${this.baseURL}/api/ai/check-solution-photo`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get all solution analyses
  async getSolutionAnalyses() {
    const response = await fetch(`${this.baseURL}/api/ai/solution-analyses`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get teacher statistics
  async getTeacherStats(teacherId = 1) {
    const response = await fetch(`${this.baseURL}/api/teachers/${teacherId}/stats`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  }

  // Get all teachers
  async getTeachers() {
    const response = await fetch(`${this.baseURL}/api/teachers`);
    return this.handleResponse(response);
  }

  // Get all students
  async getStudents() {
    const response = await fetch(`${this.baseURL}/api/students`);
    return this.handleResponse(response);
  }

  // Get analytics data
  async getAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${this.baseURL}/api/analytics${queryString ? '?' + queryString : ''}`);
    return this.handleResponse(response);
  }
}

const apiClient = new ApiClient();
export default apiClient;
