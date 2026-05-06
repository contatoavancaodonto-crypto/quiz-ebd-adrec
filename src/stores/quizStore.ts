import { create } from "zustand";

export interface QuizState {
  participantName: string;
  classId: string;
  className: string;
  trimester: number;
  churchId: string;
  churchName: string;
  quizId: string;
  quizKind: string;
  totalQuestions: number;
  participantId: string;
  attemptId: string;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  startTime: number | null;
  score: number;
  totalTimeSeconds: number;
  totalTimeMs: number;
  hasRetried: boolean;
  isRetrying: boolean;
  setParticipant: (name: string, classId: string, className: string, trimester: number) => void;
  setChurch: (id: string, name: string) => void;
  setQuizId: (id: string) => void;
  setQuizMetadata: (kind: string, total: number) => void;
  setParticipantId: (id: string) => void;
  setAttemptId: (id: string) => void;
  setAnswer: (questionId: string, option: string) => void;
  nextQuestion: () => void;
  startTimer: () => void;
  finishQuiz: (score: number, totalTimeMs?: number) => void;
  retryQuiz: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  participantName: "",
  classId: "",
  className: "",
  trimester: 1,
  churchId: "",
  churchName: "",
  quizId: "",
  quizKind: "weekly",
  totalQuestions: 13,
  participantId: "",
  attemptId: "",
  currentQuestionIndex: 0,
  answers: {},
  startTime: null,
  score: 0,
  totalTimeSeconds: 0,
  totalTimeMs: 0,
  hasRetried: false,
  isRetrying: false,
  setParticipant: (name, classId, className, trimester) =>
    set({ participantName: name, classId, className, trimester }),
  setChurch: (id, name) => set({ churchId: id, churchName: name }),
  setQuizId: (id) => set({ quizId: id }),
  setQuizMetadata: (kind, total) => set({ quizKind: kind, totalQuestions: total }),
  setParticipantId: (id) => set({ participantId: id }),
  setAttemptId: (id) => set({ attemptId: id }),
  setAnswer: (questionId, option) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: option } })),
  nextQuestion: () => set((state) => ({ currentQuestionIndex: state.currentQuestionIndex + 1 })),
  startTimer: () => set({ startTime: Date.now() }),
  finishQuiz: (score, totalTimeMs) => {
    const start = get().startTime;
    const fallbackMs = start ? Date.now() - start : 0;
    const ms = totalTimeMs ?? fallbackMs;
    set({ score, totalTimeSeconds: Math.round(ms / 1000), totalTimeMs: ms });
  },
  retryQuiz: () =>
    set({
      attemptId: "",
      currentQuestionIndex: 0,
      answers: {},
      startTime: null,
      score: 0,
      totalTimeSeconds: 0,
      totalTimeMs: 0,
      hasRetried: true,
      isRetrying: true,
    }),
  reset: () =>
    set({
      participantName: "",
      classId: "",
      className: "",
      trimester: 1,
      churchId: "",
      churchName: "",
      quizId: "",
      quizKind: "weekly",
      totalQuestions: 13,
      participantId: "",
      attemptId: "",
      currentQuestionIndex: 0,
      answers: {},
      startTime: null,
      score: 0,
      totalTimeSeconds: 0,
      totalTimeMs: 0,
      hasRetried: false,
      isRetrying: false,
    }),
}));
