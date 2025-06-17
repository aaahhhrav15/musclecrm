import axiosInstance from '@/lib/axios';

const transactionService = {
    // Get all transactions for a gym
    getGymTransactions: async (gymId) => {
        try {
            const response = await axiosInstance.get(`/transactions/gym/${gymId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Get transactions for a specific user
    getUserTransactions: async (userId) => {
        try {
            const response = await axiosInstance.get(`/transactions/user/${userId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Create a new transaction
    createTransaction: async (transactionData) => {
        try {
            const response = await axiosInstance.post('/transactions', transactionData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Update a transaction
    updateTransaction: async (transactionId, transactionData) => {
        try {
            const response = await axiosInstance.patch(`/transactions/${transactionId}`, transactionData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    },

    // Delete a transaction
    deleteTransaction: async (transactionId) => {
        try {
            const response = await axiosInstance.delete(`/transactions/${transactionId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error.message;
        }
    }
};

export default transactionService; 