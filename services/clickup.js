// ClickUp service - handles creating tasks for job tracking
const axios = require('axios');
const config = require('../config');

// Create a new task in ClickUp for job tracking
async function createJobTask(jobTitle, jobUrl) {
  const url = `https://api.clickup.com/api/v2/list/${config.clickup.listId}/task`;
  
  const taskData = {
    name: jobTitle,
    description: jobUrl
  };

  try {
    const response = await axios.post(url, taskData, {
      headers: {
        'Authorization': process.env.CLICKUP_API_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('ClickUp API Error:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createJobTask
};
