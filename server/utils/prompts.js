// server/utils/prompts.js
export const prompts = {
  getInitialQuestionPrompt() {
    return `You are an expert Ayurvedic practitioner. Generate the first diagnostic question to help identify someone's dosha (Vata, Pitta, or Kapha).

The question should be about a fundamental physical or mental characteristic that helps distinguish between doshas.

Return the response in this exact JSON format:
{
  "question": "Your question here",
  "category": "physical" or "mental" or "behavioral",
  "options": [
    {"value": "option1", "label": "Descriptive label for option 1"},
    {"value": "option2", "label": "Descriptive label for option 2"},
    {"value": "option3", "label": "Descriptive label for option 3"}
  ]
}

Make sure the options clearly relate to Vata (air/space), Pitta (fire/water), and Kapha (earth/water) characteristics.`;
  },

  getNextQuestionPrompt(previousAnswers, questionNumber) {
    return `You are an expert Ayurvedic practitioner. Based on the previous answers, generate the next diagnostic question (question ${questionNumber + 1} of 15) to help identify someone's dosha.

Previous answers:
${JSON.stringify(previousAnswers, null, 2)}

Generate a follow-up question that:
1. Builds upon the previous answers to get more specific information
2. Explores a different aspect (physical, mental, or behavioral) if possible
3. Helps narrow down the dominant dosha
4. Avoids repeating similar questions

Return the response in this exact JSON format:
{
  "question": "Your question here",
  "category": "physical" or "mental" or "behavioral",
  "options": [
    {"value": "option1", "label": "Descriptive label for option 1"},
    {"value": "option2", "label": "Descriptive label for option 2"},
    {"value": "option3", "label": "Descriptive label for option 3"}
  ]
}

Make the options clearly distinguish between Vata, Pitta, and Kapha characteristics.`;
  },

  getDoshaAnalysisPrompt(answers) {
    return `You are an expert Ayurvedic practitioner. Analyze the following answers to determine the person's dosha constitution.

User's answers:
${JSON.stringify(answers, null, 2)}

Provide a comprehensive analysis in this exact JSON format:
{
  "primaryDosha": "Vata" or "Pitta" or "Kapha",
  "secondaryDosha": "Vata" or "Pitta" or "Kapha" or null,
  "doshaType": "Single dosha" or "Dual dosha" or "Tri-dosha",
  "description": "A detailed explanation of their dosha constitution and what it means",
  "characteristics": [
    "List of 5-7 key characteristics of their dosha type"
  ],
  "dietaryRecommendations": {
    "favorable": ["List of 8-10 foods/dietary practices to favor"],
    "avoid": ["List of 5-7 foods/dietary practices to avoid"]
  },
  "lifestyleRecommendations": [
    "List of 6-8 lifestyle practices beneficial for their dosha"
  ],
  "ayurvedicRemedies": [
    "List of 4-6 specific Ayurvedic herbs, practices, or remedies"
  ],
  "dailyRoutine": {
    "morning": "Recommended morning routine",
    "afternoon": "Recommended afternoon practices",
    "evening": "Recommended evening routine"
  },
  "seasonalGuidance": "How to adapt lifestyle according to seasons for this dosha"
}

Provide practical, actionable advice that someone can implement in their daily life.`;
  }
};