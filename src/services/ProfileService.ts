
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  industry: string;
  role?: string;
  phone?: string;
  bio?: string;
  membershipType?: string;
  joinDate?: string;
}

export interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  industry?: string;
}

const ProfileService = {
  /**
   * Get the current user's profile
   */
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await axios.get(`${API_URL}/auth/profile`);
      
      if (response.data.success) {
        const userData = response.data.user;
        return {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          industry: userData.industry,
          role: userData.role,
          phone: userData.phone,
          bio: userData.bio,
          membershipType: userData.membershipType,
          joinDate: userData.joinDate
        };
      } else {
        throw new Error(response.data.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },
  
  /**
   * Update the current user's profile
   */
  updateProfile: async (data: ProfileUpdateData): Promise<UserProfile> => {
    try {
      const response = await axios.put(`${API_URL}/auth/profile`, data);
      
      if (response.data.success) {
        const userData = response.data.user;
        return {
          id: userData._id,
          name: userData.name,
          email: userData.email,
          industry: userData.industry,
          role: userData.role,
          phone: userData.phone,
          bio: userData.bio,
          membershipType: userData.membershipType,
          joinDate: userData.joinDate
        };
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },
  
  /**
   * Change the user's password
   */
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await axios.put(`${API_URL}/auth/change-password`, {
        currentPassword,
        newPassword
      });
      
      return {
        success: response.data.success,
        message: response.data.message
      };
    } catch (error: any) {
      console.error('Error changing password:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to change password'
      };
    }
  }
};

export default ProfileService;
