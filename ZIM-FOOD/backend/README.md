# AI Meal Planner Backend

This is a Python FastAPI backend for the AI Meal Planner feature, which integrates with Supabase and the Mistral-Large AI model to generate personalized meal plans for mothers and babies in Zimbabwe.

## Features

- **AI-Powered Meal Planning**: Generate personalized meal plans using the Mistral-Large AI model
- **Supabase Integration**: Store and retrieve food items and meal plans from Supabase
- **User Authentication**: Support for JWT-based authentication with Supabase
- **RESTful API**: Clean and well-documented API endpoints
- **Swagger Documentation**: Auto-generated API documentation

## Prerequisites

- Python 3.8 or higher
- Supabase account and project
- Mistral API key

## Setup

1. **Clone the repository**

2. **Install dependencies**

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up environment variables**

   Create a `.env` file in the `backend` directory with the following variables:

   ```
   # Supabase credentials
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_KEY=your-supabase-service-key

   # Mistral API credentials
   MISTRAL_API_KEY=your-mistral-api-key

   # Server settings
   PORT=8000
   HOST=0.0.0.0
   DEBUG=True
   ```

4. **Initialize the database**

   Run the initialization script to set up the Zimbabwe food data in Supabase:

   ```bash
   python init_data.py
   ```

5. **Start the server**

   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

   Or use the provided script:

   ```bash
   ./run_server.sh
   ```

6. **Test the API**

   ```bash
   python test_api.py
   ```

## API Endpoints

### Root Endpoint

- **GET /** - Check if the API is running

### Test Endpoint

- **POST /api/test** - Test the API with a simple message

### Meal Planning Endpoints

- **POST /api/meal-plan** - Generate a meal plan based on user preferences
- **GET /api/food-items** - Get all food items from the database
- **GET /api/user-meal-plans** - Get all meal plans for the authenticated user

## API Documentation

Once the server is running, you can access the auto-generated API documentation at:

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Integration with Frontend

To integrate this backend with your React frontend:

1. **Install Axios** in your frontend project:

   ```bash
   npm install axios
   ```

2. **Create an API service** in your frontend:

   ```javascript
   // src/services/mealPlanningService.js
   import axios from 'axios';

   const API_URL = 'http://localhost:8000';

   export const generateMealPlan = async (preferences) => {
     try {
       const response = await axios.post(`${API_URL}/api/meal-plan`, preferences);
       return response.data.mealPlan;
     } catch (error) {
       console.error('Error generating meal plan:', error);
       throw error;
     }
   };

   export const getFoodItems = async () => {
     try {
       const response = await axios.get(`${API_URL}/api/food-items`);
       return response.data.foodItems;
     } catch (error) {
       console.error('Error fetching food items:', error);
       throw error;
     }
   };

   export const getUserMealPlans = async (token) => {
     try {
       const response = await axios.get(`${API_URL}/api/user-meal-plans`, {
         headers: {
           Authorization: `Bearer ${token}`
         }
       });
       return response.data.mealPlans;
     } catch (error) {
       console.error('Error fetching user meal plans:', error);
       throw error;
     }
   };
   ```

3. **Use the service** in your React components:

   ```javascript
   import { generateMealPlan } from '../services/mealPlanningService';

   // In your component
   const handleGenerateMealPlan = async () => {
     try {
       setIsLoading(true);
       
       const preferences = {
         targetUser: 'child',
         childAge: 9,
         mealType: 'breakfast',
         preferTraditional: true
       };
       
       const mealPlan = await generateMealPlan(preferences);
       setMealPlan(mealPlan);
       
     } catch (error) {
       console.error('Error:', error);
     } finally {
       setIsLoading(false);
     }
   };
   ```

## Deployment

For production deployment, consider:

1. **Using Gunicorn** as a WSGI server:

   ```bash
   gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
   ```

2. **Setting up HTTPS** with a reverse proxy like Nginx

3. **Updating CORS settings** to only allow specific origins

4. **Setting DEBUG=False** in the .env file

## License

This project is licensed under the MIT License.
