import { create } from "zustand";

export interface QuizState {
  participantName: string;
  classId: string;
  className: string;
  trimester: number;
  quizId: string;
  participantId: string;
  attemptId: string;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  startTime: number | null;
  score: number;
  totalTimeSeconds: number;
  hasRetried: boolean;
  isRetrying: boolean;
  setParticipant: (name: string, classId: string, className: string, trimester: number) => void;
  setQuizId: (id: string) => void;
  setParticipantId: (id: string) => void;
  setAttemptId: (id: string) => void;
  setAnswer: (questionId: string, option: string) => void;
  nextQuestion: () => void;
  startTimer: () => void;
  finishQuiz: (score: number) => void;
  retryQuiz: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  participantName: "",
  classId: "",
  className: "",
  trimester: 1,
  quizId: "",
  participantId: "",
  attemptId: "",
  currentQuestionIndex: 0,
  answers: {},
  startTime: null,
  score: 0,
  totalTimeSeconds: 0,
  hasRetried: false,
  isRetrying: false,
  setParticipant: (name, classId, className, trimester) =>
    set({ participantName: name, classId, className, trimester }),
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
  retryQuiz: () =>
    set({
      attemptId: "",
      currentQuestionIndex: 0,
      answers: {},
      startTime: null,
      score: 0,
      totalTimeSeconds: 0,
      hasRetried: true,
      isRetrying: true,
    }),
  reset: () =>
    set({
      participantName: "",
      classId: "",
      className: "",
      trimester: 1,
      quizId: "",
      participantId: "",
      attemptId: "",
      currentQuestionIndex: 0,
      answers: {},
      startTime: null,
      score: 0,
      totalTimeSeconds: 0,
      hasRetried: false,
      isRetrying: false,
    }),
}));
