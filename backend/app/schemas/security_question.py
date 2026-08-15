from pydantic import BaseModel


class SecurityQuestionStatus(BaseModel):
    id: int
    question_text: str
    display_order: int
    is_answered: bool


class SecurityAnswerUpsert(BaseModel):
    question_id: int
    answer: str


class SecurityAnswersUpdate(BaseModel):
    answers: list[SecurityAnswerUpsert]


class AdminForgotPasswordStartRequest(BaseModel):
    login_id: str


class AdminForgotPasswordStartResponse(BaseModel):
    challenge_token: str
    question_text: str


class AdminForgotPasswordVerifyRequest(BaseModel):
    challenge_token: str
    answer: str
    new_password: str
