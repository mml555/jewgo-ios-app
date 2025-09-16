/**
 * User Feedback Collection Component
 * Collects structured feedback during usability testing sessions
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { UsabilityMetricsCollector, UserSession } from './UsabilityMetrics';

interface FeedbackQuestion {
  id: string;
  type: 'rating' | 'text' | 'multipleChoice' | 'yesNo';
  question: string;
  options?: string[];
  required: boolean;
}

interface FeedbackResponse {
  questionId: string;
  response: string | number;
}

interface UserFeedbackCollectorProps {
  sessionId: string;
  scenarioId?: string;
  onFeedbackSubmitted: (responses: FeedbackResponse[]) => void;
  onCancel: () => void;
}

const SCENARIO_QUESTIONS: FeedbackQuestion[] = [
  {
    id: 'task_completion',
    type: 'yesNo',
    question: 'Were you able to complete this task successfully?',
    required: true,
  },
  {
    id: 'task_difficulty',
    type: 'rating',
    question: 'How difficult was this task? (1 = Very Easy, 5 = Very Difficult)',
    required: true,
  },
  {
    id: 'task_satisfaction',
    type: 'rating',
    question: 'How satisfied are you with this experience? (1 = Very Unsatisfied, 5 = Very Satisfied)',
    required: true,
  },
  {
    id: 'time_picker_usability',
    type: 'rating',
    question: 'How easy was it to use the time picker? (1 = Very Difficult, 5 = Very Easy)',
    required: true,
  },
  {
    id: 'error_clarity',
    type: 'rating',
    question: 'If you encountered errors, how clear were the error messages? (1 = Very Confusing, 5 = Very Clear, N/A if no errors)',
    required: false,
  },
  {
    id: 'task_feedback',
    type: 'text',
    question: 'What did you like or dislike about this task? Any suggestions for improvement?',
    required: false,
  },
];

const SESSION_QUESTIONS: FeedbackQuestion[] = [
  {
    id: 'overall_satisfaction',
    type: 'rating',
    question: 'Overall, how satisfied are you with the form experience? (1 = Very Unsatisfied, 5 = Very Satisfied)',
    required: true,
  },
  {
    id: 'form_length',
    type: 'multipleChoice',
    question: 'How did you feel about the length of the form?',
    options: ['Too short', 'Just right', 'Too long', 'Much too long'],
    required: true,
  },
  {
    id: 'navigation_clarity',
    type: 'rating',
    question: 'How clear was it to navigate between form steps? (1 = Very Confusing, 5 = Very Clear)',
    required: true,
  },
  {
    id: 'progress_indication',
    type: 'rating',
    question: 'How helpful was the progress indicator? (1 = Not Helpful, 5 = Very Helpful)',
    required: true,
  },
  {
    id: 'would_recommend',
    type: 'yesNo',
    question: 'Would you recommend this form to other business owners?',
    required: true,
  },
  {
    id: 'biggest_challenge',
    type: 'text',
    question: 'What was the biggest challenge you faced while using this form?',
    required: false,
  },
  {
    id: 'most_helpful_feature',
    type: 'text',
    question: 'What feature did you find most helpful?',
    required: false,
  },
  {
    id: 'improvement_suggestions',
    type: 'text',
    question: 'What improvements would you suggest?',
    required: false,
  },
];

export const UserFeedbackCollector: React.FC<UserFeedbackCollectorProps> = ({
  sessionId,
  scenarioId,
  onFeedbackSubmitted,
  onCancel,
}) => {
  const questions = scenarioId ? SCENARIO_QUESTIONS : SESSION_QUESTIONS;
  const [responses, setResponses] = useState<{ [questionId: string]: string | number }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateResponse = (questionId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const validateResponses = (): boolean => {
    const requiredQuestions = questions.filter(q => q.required);
    const missingResponses = requiredQuestions.filter(q => 
      responses[q.id] === undefined || responses[q.id] === ''
    );

    if (missingResponses.length > 0) {
      Alert.alert(
        'Missing Responses',
        `Please answer all required questions: ${missingResponses.map(q => q.question).join(', ')}`
      );
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    if (!validateResponses()) return;

    setIsSubmitting(true);
    
    const feedbackResponses: FeedbackResponse[] = Object.entries(responses).map(([questionId, response]) => ({
      questionId,
      response,
    }));

    onFeedbackSubmitted(feedbackResponses);
    setIsSubmitting(false);
  };

  const renderRatingQuestion = (question: FeedbackQuestion) => (
    <View key={question.id} style={styles.questionContainer}>
      <Text style={styles.questionText}>
        {question.question} {question.required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.ratingContainer}>
        {[1, 2, 3, 4, 5].map(rating => (
          <TouchableOpacity
            key={rating}
            style={[
              styles.ratingButton,
              responses[question.id] === rating && styles.ratingButtonSelected,
            ]}
            onPress={() => updateResponse(question.id, rating)}
          >
            <Text
              style={[
                styles.ratingButtonText,
                responses[question.id] === rating && styles.ratingButtonTextSelected,
              ]}
            >
              {rating}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTextQuestion = (question: FeedbackQuestion) => (
    <View key={question.id} style={styles.questionContainer}>
      <Text style={styles.questionText}>
        {question.question} {question.required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={styles.textInput}
        multiline
        numberOfLines={4}
        placeholder="Enter your response..."
        value={responses[question.id]?.toString() || ''}
        onChangeText={(text) => updateResponse(question.id, text)}
      />
    </View>
  );

  const renderMultipleChoiceQuestion = (question: FeedbackQuestion) => (
    <View key={question.id} style={styles.questionContainer}>
      <Text style={styles.questionText}>
        {question.question} {question.required && <Text style={styles.required}>*</Text>}
      </Text>
      {question.options?.map(option => (
        <TouchableOpacity
          key={option}
          style={[
            styles.optionButton,
            responses[question.id] === option && styles.optionButtonSelected,
          ]}
          onPress={() => updateResponse(question.id, option)}
        >
          <Text
            style={[
              styles.optionButtonText,
              responses[question.id] === option && styles.optionButtonTextSelected,
            ]}
          >
            {option}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderYesNoQuestion = (question: FeedbackQuestion) => (
    <View key={question.id} style={styles.questionContainer}>
      <Text style={styles.questionText}>
        {question.question} {question.required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.yesNoContainer}>
        {['Yes', 'No'].map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.yesNoButton,
              responses[question.id] === option && styles.yesNoButtonSelected,
            ]}
            onPress={() => updateResponse(question.id, option)}
          >
            <Text
              style={[
                styles.yesNoButtonText,
                responses[question.id] === option && styles.yesNoButtonTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderQuestion = (question: FeedbackQuestion) => {
    switch (question.type) {
      case 'rating':
        return renderRatingQuestion(question);
      case 'text':
        return renderTextQuestion(question);
      case 'multipleChoice':
        return renderMultipleChoiceQuestion(question);
      case 'yesNo':
        return renderYesNoQuestion(question);
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {scenarioId ? 'Task Feedback' : 'Session Feedback'}
        </Text>
        <Text style={styles.subtitle}>
          Your feedback helps us improve the form experience
        </Text>
      </View>

      <ScrollView style={styles.questionsContainer} showsVerticalScrollIndicator={false}>
        {questions.map(renderQuestion)}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  questionsContainer: {
    flex: 1,
  },
  questionContainer: {
    marginBottom: 24,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
    lineHeight: 22,
  },
  required: {
    color: '#FF3B30',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  ratingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  ratingButtonSelected: {
    backgroundColor: '#2D5016',
    borderColor: '#2D5016',
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  ratingButtonTextSelected: {
    color: '#FFFFFF',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  optionButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    marginBottom: 8,
  },
  optionButtonSelected: {
    backgroundColor: '#2D5016',
    borderColor: '#2D5016',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#333333',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  yesNoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  yesNoButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    alignItems: 'center',
  },
  yesNoButtonSelected: {
    backgroundColor: '#2D5016',
    borderColor: '#2D5016',
  },
  yesNoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  yesNoButtonTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  submitButton: {
    flex: 2,
    padding: 16,
    backgroundColor: '#2D5016',
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});