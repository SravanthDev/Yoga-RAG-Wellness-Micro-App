
import axios from 'axios';

const API_Base = 'https://yoga-rag-wellness-micro-app.onrender.com';

export const askQuestion = async (query) => {
    const response = await axios.post(`${API_Base}/ask`, { query });
    return response.data;
};

export const sendFeedback = async (queryId, feedback) => {
    const response = await axios.post(`${API_Base}/feedback`, { queryId, feedback });
    return response.data;
};
