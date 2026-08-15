export interface SecurityQuestionStatus {
  id: number;
  question_text: string;
  display_order: number;
  is_answered: boolean;
}

export interface SecurityAnswerUpsert {
  question_id: number;
  answer: string;
}

export interface AdminForgotPasswordStartResponse {
  challenge_token: string;
  question_text: string;
}
