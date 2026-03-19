import { create } from "zustand";

export interface QuizState {
  participantName: string;
  classId: string;
  className: string;
  quizId: string;
  participantId: string;
  attemptId: string;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  startTime: number | null;
  score: number;
  totalTimeSeconds: number;
  setParticipant: (name: string, classId: string, className: string) => void;
  setQuizId: (id: string) => void;
  setParticipantId: (id: string) => void;
  setAttemptId: (id: string) => void;
  setAnswer: (questionId: string, option: string) => void;
  nextQuestion: () => void;
  startTimer: () => void;
  finishQuiz: (score: number) => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  participantName: "",
  classId: "",
  className: "",
  quizId: "",
  participantId: "",
  attemptId: "",
  currentQuestionIndex: 0,
  answers: {},
  startTime: null,
  score: 0,
  totalTimeSeconds: 0,
  setParticipant: (name, classId, className) => set({ participantName: name, classId, className }),
  setQuizId: (id) => set({ quizId: id }),
  setParticipantId: (id) => set({ participantId: id }),
  setAttemptId: (id) => set({ attemptId: id }),
  setAnswer: (questionId, option) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: option } })),
  nextQuestion: () => set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),
  startTimer: () => set({ startTime: Date.now() }),
  finishQuiz: (score) => {
    const start = get().startTime;
    const totalTimeSeconds = start ? Math.round((Date.now() - start) / 1000) : 0;
    set({ score, totalTimeSeconds });
  },
  reset: () =>
    set({
      participantName: "",
      classId: "",
      className: "",
      quizId: "",
      participantId: "",
      attemptId: "",
      currentQuestionIndex: 0,
      answers: {},
      startTime: null,
      score: 0,
      totalTimeSeconds: 0,
    }),
}));
