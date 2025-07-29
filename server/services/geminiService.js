// server/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prompts } from '../utils/prompts.js';
import dotenv from 'dotenv';

dotenv.config();

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  async generateInitialQuestion() {
    try {
      const prompt = prompts.getInitialQuestionPrompt();
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseQuestionResponse(text, 1);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  async generateNextQuestion(previousAnswers, currentQuestionNumber) {
    try {
      const prompt = prompts.getNextQuestionPrompt(previousAnswers, currentQuestionNumber);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseQuestionResponse(text, currentQuestionNumber + 1);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  async analyzeDoshaType(answers) {
    try {
      const prompt = prompts.getDoshaAnalysisPrompt(answers);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseDoshaAnalysis(text);
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  parseQuestionResponse(text, questionNumber) {
    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          questionNumber,
          question: parsed.question,
          category: parsed.category,
          options: parsed.options,
          complete: false
        };
      }
      throw new Error('Invalid response format');
    } catch (error) {
      // Fallback response
      return {
        questionNumber,
        question: "How would you describe your body frame?",
        category: "physical",
        options: [
          { value: "thin", label: "Thin and light" },
          { value: "medium", label: "Medium and athletic" },
          { value: "large", label: "Large and sturdy" }
        ],
        complete: false
      };
    }
  }

  parseDoshaAnalysis(text) {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid response format');
    } catch (error) {
      // Fallback response
      return {
        primaryDosha: "Unknown",
        secondaryDosha: null,
        description: text,
        characteristics: [],
        dietaryRecommendations: {
          favorable: [],
          avoid: []
        },
        lifestyleRecommendations: [],
        ayurvedicRemedies: []
      };
    }
  }
}

export default new GeminiService();