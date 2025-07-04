import api from './api';

// User services
export const getUserProfile = async () => {
  try {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await api.put(`/api/v1/users/${userId}`, userData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getUserCaregivers = async (userId) => {
  try {
    const response = await api.get(`/api/v1/users/${userId}/caregivers`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Caregiver services
export const updateCaregiverProfile = async (caregiverId, caregiverData) => {
  try {
    const response = await api.put(`/api/v1/caregivers/${caregiverId}`, caregiverData);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const getCaregiverUsers = async (caregiverId) => {
  try {
    const response = await api.get(`/api/v1/caregivers/${caregiverId}/users`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addUserToCaregiver = async (userId, caregiverId) => {
  try {
    const response = await api.put(`/api/v1/users/${userId}/caregivers/${caregiverId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const removeUserFromCaregiver = async (userId, caregiverId) => {
  try {
    const response = await api.delete(`/api/v1/users/${userId}/caregivers/${caregiverId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Search users by email (to add as connected user/caregiver)
export const searchUserByEmail = async (email) => {
  try {
    // This would ideally be a dedicated endpoint 
    // For now we're using the get all users endpoint and filtering on the client
    const response = await api.get('/api/v1/users');
    
    if (response.data.success) {
      const users = response.data.data;
      return {
        success: true,
        data: users.filter(user => user.email.toLowerCase().includes(email.toLowerCase()))
      };
    }
    
    return response.data;
  } catch (error) {
    throw error;
  }
}; 