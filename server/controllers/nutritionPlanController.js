const NutritionPlan = require('../models/NutritionPlan');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API with error handling
let genAI;
try {
  if (!process.env.GEMINI_API_KEY) {
    console.warn('GEMINI_API_KEY is not set in environment variables');
  } else {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
} catch (error) {
  console.error('Error initializing Gemini API:', error);
}

// Get all nutrition plans
exports.getAllNutritionPlans = async (req, res) => {
  try {
    const nutritionPlans = await NutritionPlan.find({ gymId: req.gymId })
      .populate('user_id', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, nutritionPlans });
  } catch (error) {
    console.error('Error fetching nutrition plans:', error);
    res.status(500).json({ success: false, message: 'Error fetching nutrition plans' });
  }
};

// Generate nutrition plan using Gemini
exports.generateNutritionPlan = async (req, res) => {
  try {
    if (!genAI) {
      return res.status(500).json({
        success: false,
        message: 'Gemini API is not configured. Please set GEMINI_API_KEY in environment variables.'
      });
    }

    const {
      customerId,
      age,
      gender,
      height,
      weight,
      targetWeight,
      objective,
      dietType,
      medicalConditions,
      additionalDetails
    } = req.body;

    // Validate required fields
    if (!customerId || !age || !gender || !height || !weight || !targetWeight || !objective || !dietType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create prompt for Gemini
    const prompt = `Create a detailed indian diet nutrition plan in JSON format with the following specifications:
    - User is ${age} years old, ${gender}, ${height}cm tall, and weighs ${weight}kg
    - Target weight: ${targetWeight}kg
    - Objective: ${objective}
    - Diet type: ${dietType}
    ${medicalConditions ? `- Medical conditions: ${medicalConditions}` : ''}
    - Requirements: ${additionalDetails || 'None'}


    The plan should include:
    1. Total daily calories
    2. Protein, carbs, and fat targets
    3. Each meal should have:
       - Meal type
       - Time
       - Total calories
       - List of food items with:
         - Food name
         - Quantity
         - Calories
         - Protein
         - Carbs
         - Fat

    Format the response as a JSON object with the following structure:
    {
      "user_id": "${customerId}",
      "plan_name": "Custom Nutrition Plan",
      "total_calories": number,
      "protein_target": number,
      "carbs_target": number,
      "fat_target": number,
      "created_date": "YYYY-MM-DD",
      "meals": [
        {
          "meal_type": string,
          "time": string,
          "calories": number,
          "items": [
            {
              "food_name": string,
              "quantity": string,
              "calories": number,
              "protein": number,
              "carbs": number,
              "fat": number
            }
          ]
        }
      ]
    }

    Ensure all nutritional values are realistic and appropriate for the user's goals. If specific calorie or protein targets or number of meals are mentioned in the requirements, prioritize those in the plan. If medical conditions are mentioned, ensure the plan is safe and suitable for those conditions.`;

    // Generate response from Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    console.log('Using Gemini model:', model);
    
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
      });
      
      if (!result || !result.response) {
        throw new Error('No response received from Gemini API');
      }
      
      const response = await result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error('Empty response received from Gemini API');
      }
      
      console.log('Gemini API response:', text);
      
      // Clean up the response by removing markdown code blocks
      const cleanedText = text.replace(/```json\n|\n```/g, '').trim();
      
      // Parse the JSON response
      let nutritionPlanData;
      try {
        nutritionPlanData = JSON.parse(cleanedText);
      } catch (error) {
        console.error('Error parsing Gemini response:', error);
        console.error('Raw response:', text);
        console.error('Cleaned response:', cleanedText);
        return res.status(500).json({
          success: false,
          message: 'Failed to parse AI response',
          error: error.message,
          rawResponse: text
        });
      }

      // Validate the parsed data
      if (!nutritionPlanData.meals || !Array.isArray(nutritionPlanData.meals)) {
        return res.status(500).json({
          success: false,
          message: 'Invalid AI response format',
          rawResponse: text
        });
      }

      // Create new nutrition plan
      const nutritionPlan = new NutritionPlan({
        ...nutritionPlanData,
        gymId: req.gymId
      });

      const savedPlan = await nutritionPlan.save();
      
      // Populate the customer data before sending response
      const populatedPlan = await NutritionPlan.findById(savedPlan._id)
        .populate('user_id', 'name email phone');
      
      res.status(201).json({ success: true, nutritionPlan: populatedPlan });
    } catch (error) {
      console.error('Error in Gemini API call:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate nutrition plan',
        error: error.message,
        stack: error.stack
      });
    }
  } catch (error) {
    console.error('Error generating nutrition plan:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate nutrition plan',
      error: error.message 
    });
  }
};

// Create a new nutrition plan
exports.createNutritionPlan = async (req, res) => {
  try {
    const nutritionPlan = new NutritionPlan({
      ...req.body,
      gymId: req.gymId,
      createdAt: new Date()
    });
    const savedPlan = await nutritionPlan.save();
    
    // Populate the customer data before sending response
    const populatedPlan = await NutritionPlan.findById(savedPlan._id)
      .populate('user_id', 'name email phone');
    
    res.status(201).json({ success: true, nutritionPlan: populatedPlan });
  } catch (error) {
    console.error('Error creating nutrition plan:', error);
    res.status(400).json({ 
      success: false,
      message: error.message,
      details: error.errors || 'Validation failed'
    });
  }
};

// Update a nutrition plan
exports.updateNutritionPlan = async (req, res) => {
  try {
    const nutritionPlan = await NutritionPlan.findOneAndUpdate(
      { _id: req.params.id, gymId: req.gymId },
      req.body,
      { new: true }
    );
    if (!nutritionPlan) {
      return res.status(404).json({ success: false, message: 'Nutrition plan not found' });
    }
    
    // Populate the customer data before sending response
    const populatedPlan = await NutritionPlan.findById(nutritionPlan._id)
      .populate('user_id', 'name email phone');
    
    res.json({ success: true, nutritionPlan: populatedPlan });
  } catch (error) {
    console.error('Error updating nutrition plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a nutrition plan
exports.deleteNutritionPlan = async (req, res) => {
  try {
    const nutritionPlan = await NutritionPlan.findOneAndDelete({
      _id: req.params.id,
      gymId: req.gymId
    });
    if (!nutritionPlan) {
      return res.status(404).json({ success: false, message: 'Nutrition plan not found' });
    }
    res.json({ success: true, message: 'Nutrition plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting nutrition plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get a single nutrition plan
exports.getNutritionPlan = async (req, res) => {
  try {
    const nutritionPlan = await NutritionPlan.findOne({
      _id: req.params.id,
      gymId: req.gymId
    }).populate('user_id', 'name email phone');
    if (!nutritionPlan) {
      return res.status(404).json({ success: false, message: 'Nutrition plan not found' });
    }
    res.json({ success: true, nutritionPlan });
  } catch (error) {
    console.error('Error fetching nutrition plan:', error);
    res.status(500).json({ success: false, message: error.message });
  }
}; 