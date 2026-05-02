export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean
          question_id: string
          selected_option: string
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean
          question_id: string
          selected_option: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string
          emoji: string
          id: string
          name: string
          type: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description: string
          emoji: string
          id?: string
          name: string
          type: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string
          emoji?: string
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      church_edit_requests: {
        Row: {
          church_id: string
          created_at: string
          id: string
          proposed_name: string | null
          proposed_pastor_president: string | null
          proposed_requester_area: number | null
          proposed_requester_phone: string | null
          requested_by: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          proposed_name?: string | null
          proposed_pastor_president?: string | null
          proposed_requester_area?: number | null
          proposed_requester_phone?: string | null
          requested_by: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          proposed_name?: string | null
          proposed_pastor_president?: string | null
          proposed_requester_area?: number | null
          proposed_requester_phone?: string | null
          requested_by?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      churches: {
        Row: {
          active: boolean
          approved: boolean
          created_at: string
          id: string
          name: string
          pastor_president: string | null
          requested: boolean
          requester_area: number | null
          requester_pastor_name: string | null
          requester_phone: string | null
        }
        Insert: {
          active?: boolean
          approved?: boolean
          created_at?: string
          id?: string
          name: string
          pastor_president?: string | null
          requested?: boolean
          requester_area?: number | null
          requester_pastor_name?: string | null
          requester_phone?: string | null
        }
        Update: {
          active?: boolean
          approved?: boolean
          created_at?: string
          id?: string
          name?: string
          pastor_president?: string | null
          requested?: boolean
          requester_area?: number | null
          requester_pastor_name?: string | null
          requester_phone?: string | null
        }
        Relationships: []
      }
      class_materials: {
        Row: {
          class_id: string
          cover_url: string | null
          created_at: string
          description: string | null
          file_path: string
          file_url: string
          id: string
          title: string
          trimester: number
          updated_at: string
          year: number
        }
        Insert: {
          class_id: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          file_path: string
          file_url: string
          id?: string
          title: string
          trimester: number
          updated_at?: string
          year?: number
        }
        Update: {
          class_id?: string
          cover_url?: string | null
          created_at?: string
          description?: string | null
          file_path?: string
          file_url?: string
          id?: string
          title?: string
          trimester?: number
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "class_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "class_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "class_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
        ]
      }
      classes: {
        Row: {
          active: boolean
          cover_url: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      daily_verse: {
        Row: {
          created_at: string
          date: string
          id: string
          verse_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          verse_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_verse_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "verses"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_logs: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          reason: string | null
          risk_level: string | null
          status: Database["public"]["Enums"]["moderation_status"]
          user_id: string | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          reason?: string | null
          risk_level?: string | null
          status: Database["public"]["Enums"]["moderation_status"]
          user_id?: string | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          risk_level?: string | null
          status?: Database["public"]["Enums"]["moderation_status"]
          user_id?: string | null
        }
        Relationships: []
      }
      notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          link: string | null
          scope: string
          scope_id: string | null
          source: string
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          scope?: string
          scope_id?: string | null
          source?: string
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          link?: string | null
          scope?: string
          scope_id?: string | null
          source?: string
          title?: string
        }
        Relationships: []
      }
      participant_streaks: {
        Row: {
          current_streak: number
          last_week_completed: number | null
          participant_name: string
          season_id: string
          updated_at: string
        }
        Insert: {
          current_streak?: number
          last_week_completed?: number | null
          participant_name: string
          season_id: string
          updated_at?: string
        }
        Update: {
          current_streak?: number
          last_week_completed?: number | null
          participant_name?: string
          season_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      participants: {
        Row: {
          active: boolean
          class_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          class_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          class_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "participants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "participants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          deleted: boolean
          id: string
          moderation_reason: string | null
          post_id: string
          risk_level: string | null
          status: Database["public"]["Enums"]["moderation_status"] | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted?: boolean
          id?: string
          moderation_reason?: string | null
          post_id: string
          risk_level?: string | null
          status?: Database["public"]["Enums"]["moderation_status"] | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted?: boolean
          id?: string
          moderation_reason?: string | null
          post_id?: string
          risk_level?: string | null
          status?: Database["public"]["Enums"]["moderation_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_reports: {
        Row: {
          created_at: string
          id: string
          post_id: string
          reason: string | null
          reporter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          reason?: string | null
          reporter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          reason?: string | null
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          church_id: string | null
          content: string | null
          created_at: string
          deleted: boolean
          id: string
          image_url: string | null
          moderation_reason: string | null
          risk_level: string | null
          status: Database["public"]["Enums"]["moderation_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          church_id?: string | null
          content?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          image_url?: string | null
          moderation_reason?: string | null
          risk_level?: string | null
          status?: Database["public"]["Enums"]["moderation_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          church_id?: string | null
          content?: string | null
          created_at?: string
          deleted?: boolean
          id?: string
          image_url?: string | null
          moderation_reason?: string | null
          risk_level?: string | null
          status?: Database["public"]["Enums"]["moderation_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "posts_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "posts_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_edit_audit: {
        Row: {
          changes: Json
          created_at: string
          edited_by: string | null
          editor_name: string | null
          editor_role: string | null
          id: string
          profile_id: string
        }
        Insert: {
          changes?: Json
          created_at?: string
          edited_by?: string | null
          editor_name?: string | null
          editor_role?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          changes?: Json
          created_at?: string
          edited_by?: string | null
          editor_name?: string | null
          editor_role?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          area: number | null
          avatar_url: string | null
          church_id: string | null
          class_id: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          hidden_at: string | null
          id: string
          last_name: string | null
          phone: string | null
          show_avatar_in_ranking: boolean
          updated_at: string
        }
        Insert: {
          area?: number | null
          avatar_url?: string | null
          church_id?: string | null
          class_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          hidden_at?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          show_avatar_in_ranking?: boolean
          updated_at?: string
        }
        Update: {
          area?: number | null
          avatar_url?: string | null
          church_id?: string | null
          class_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          hidden_at?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          show_avatar_in_ranking?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
        ]
      }
      questions: {
        Row: {
          active: boolean
          correct_option: string
          created_at: string
          explanation: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number
          question_text: string
          quiz_id: string
        }
        Insert: {
          active?: boolean
          correct_option: string
          created_at?: string
          explanation?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number
          question_text: string
          quiz_id: string
        }
        Update: {
          active?: boolean
          correct_option?: string
          created_at?: string
          explanation?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          order_index?: number
          question_text?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["quiz_id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          accuracy_percentage: number
          created_at: string
          final_score: number | null
          finished_at: string | null
          id: string
          participant_id: string
          quiz_id: string
          score: number
          season_id: string | null
          started_at: string
          streak_at_attempt: number
          streak_bonus: number
          total_questions: number
          total_time_ms: number
          total_time_seconds: number
          week_number: number | null
        }
        Insert: {
          accuracy_percentage?: number
          created_at?: string
          final_score?: number | null
          finished_at?: string | null
          id?: string
          participant_id: string
          quiz_id: string
          score?: number
          season_id?: string | null
          started_at?: string
          streak_at_attempt?: number
          streak_bonus?: number
          total_questions?: number
          total_time_ms?: number
          total_time_seconds?: number
          week_number?: number | null
        }
        Update: {
          accuracy_percentage?: number
          created_at?: string
          final_score?: number | null
          finished_at?: string | null
          id?: string
          participant_id?: string
          quiz_id?: string
          score?: number
          season_id?: string | null
          started_at?: string
          streak_at_attempt?: number
          streak_bonus?: number
          total_questions?: number
          total_time_ms?: number
          total_time_seconds?: number
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "quiz_attempts_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          active: boolean
          class_id: string
          closes_at: string | null
          created_at: string
          devotional_fri: string | null
          devotional_mon: string | null
          devotional_sat: string | null
          devotional_thu: string | null
          devotional_tue: string | null
          devotional_wed: string | null
          id: string
          lesson_key_verse_ref: string | null
          lesson_key_verse_text: string | null
          lesson_number: number | null
          lesson_title: string | null
          opens_at: string | null
          quiz_kind: string
          season_id: string | null
          title: string
          total_questions: number
          trimester: number
          week_number: number | null
          weekly_bible_reading: string | null
        }
        Insert: {
          active?: boolean
          class_id: string
          closes_at?: string | null
          created_at?: string
          devotional_fri?: string | null
          devotional_mon?: string | null
          devotional_sat?: string | null
          devotional_thu?: string | null
          devotional_tue?: string | null
          devotional_wed?: string | null
          id?: string
          lesson_key_verse_ref?: string | null
          lesson_key_verse_text?: string | null
          lesson_number?: number | null
          lesson_title?: string | null
          opens_at?: string | null
          quiz_kind?: string
          season_id?: string | null
          title: string
          total_questions?: number
          trimester?: number
          week_number?: number | null
          weekly_bible_reading?: string | null
        }
        Update: {
          active?: boolean
          class_id?: string
          closes_at?: string | null
          created_at?: string
          devotional_fri?: string | null
          devotional_mon?: string | null
          devotional_sat?: string | null
          devotional_thu?: string | null
          devotional_tue?: string | null
          devotional_wed?: string | null
          id?: string
          lesson_key_verse_ref?: string | null
          lesson_key_verse_text?: string | null
          lesson_number?: number | null
          lesson_title?: string | null
          opens_at?: string | null
          quiz_kind?: string
          season_id?: string | null
          title?: string
          total_questions?: number
          trimester?: number
          week_number?: number | null
          weekly_bible_reading?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "quizzes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
        ]
      }
      saved_verses: {
        Row: {
          id: string
          saved_at: string
          user_id: string
          verse_id: string
        }
        Insert: {
          id?: string
          saved_at?: string
          user_id: string
          verse_id: string
        }
        Update: {
          id?: string
          saved_at?: string
          user_id?: string
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_verses_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "verses"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          name: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          name: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      suggestions: {
        Row: {
          class_id: string
          created_at: string
          id: string
          suggestion_text: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          suggestion_text: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          suggestion_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "suggestions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "suggestions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
        ]
      }
      support_ticket_messages: {
        Row: {
          author_id: string
          author_role: string
          body: string
          created_at: string
          id: string
          ticket_id: string
        }
        Insert: {
          author_id: string
          author_role?: string
          body: string
          created_at?: string
          id?: string
          ticket_id: string
        }
        Update: {
          author_id?: string
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          church_id: string | null
          created_at: string
          id: string
          message: string
          page_url: string | null
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          screenshot_url: string | null
          status: string
          subject: string
          updated_at: string
          user_agent: string | null
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          admin_response?: string | null
          category?: string
          church_id?: string | null
          created_at?: string
          id?: string
          message: string
          page_url?: string | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_agent?: string | null
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          admin_response?: string | null
          category?: string
          church_id?: string | null
          created_at?: string
          id?: string
          message?: string
          page_url?: string | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          screenshot_url?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          attempt_id: string
          badge_id: string
          earned_at: string
          id: string
          participant_id: string
          season_id: string | null
        }
        Insert: {
          attempt_id: string
          badge_id: string
          earned_at?: string
          id?: string
          participant_id: string
          season_id?: string | null
        }
        Update: {
          attempt_id?: string
          badge_id?: string
          earned_at?: string
          id?: string
          participant_id?: string
          season_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "quiz_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "user_badges_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "user_badges_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          church_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          church_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          church_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "user_roles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["church_id"]
          },
        ]
      }
      verses: {
        Row: {
          active: boolean
          book: string
          chapter: number
          created_at: string
          id: string
          text: string
          theme: string
          verse: number
        }
        Insert: {
          active?: boolean
          book: string
          chapter: number
          created_at?: string
          id?: string
          text: string
          theme?: string
          verse: number
        }
        Update: {
          active?: boolean
          book?: string
          chapter?: number
          created_at?: string
          id?: string
          text?: string
          theme?: string
          verse?: number
        }
        Relationships: []
      }
    }
    Views: {
      ranking_by_class: {
        Row: {
          accuracy_percentage: number | null
          attempt_id: string | null
          church_id: string | null
          church_name: string | null
          class_id: string | null
          class_name: string | null
          finished_at: string | null
          is_retry: boolean | null
          participant_name: string | null
          position: number | null
          score: number | null
          total_time_ms: number | null
          total_time_seconds: number | null
          trimester: number | null
        }
        Relationships: []
      }
      ranking_churches_classic: {
        Row: {
          avg_score: number | null
          church_id: string | null
          church_name: string | null
          participants_count: number | null
          pastor_president: string | null
          position: number | null
          trimester: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["church_id"]
          },
        ]
      }
      ranking_churches_monthly: {
        Row: {
          avg_score: number | null
          church_id: string | null
          church_name: string | null
          participants_count: number | null
          pastor_president: string | null
          position: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["church_id"]
          },
        ]
      }
      ranking_churches_weekly: {
        Row: {
          avg_score: number | null
          church_id: string | null
          church_name: string | null
          participants_count: number | null
          pastor_president: string | null
          position: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["church_id"]
          },
        ]
      }
      ranking_general: {
        Row: {
          accuracy_percentage: number | null
          attempt_id: string | null
          church_id: string | null
          church_name: string | null
          class_id: string | null
          class_name: string | null
          final_score: number | null
          finished_at: string | null
          is_retry: boolean | null
          participant_name: string | null
          position: number | null
          score: number | null
          streak_bonus: number | null
          total_time_ms: number | null
          total_time_seconds: number | null
          trimester: number | null
        }
        Relationships: []
      }
      ranking_monthly: {
        Row: {
          church_id: string | null
          church_name: string | null
          class_id: string | null
          class_name: string | null
          current_streak: number | null
          participant_name: string | null
          position: number | null
          season_id: string | null
          total_score: number | null
          total_time_ms: number | null
          weeks_completed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "quiz_attempts_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_season_accumulated: {
        Row: {
          church_id: string | null
          church_name: string | null
          class_id: string | null
          class_name: string | null
          current_streak: number | null
          participant_name: string | null
          position: number | null
          season_id: string | null
          total_score: number | null
          total_time_ms: number | null
          weeks_completed: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "profiles_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "quiz_attempts_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      ranking_weekly: {
        Row: {
          accuracy_percentage: number | null
          attempt_id: string | null
          church_id: string | null
          church_name: string | null
          class_id: string | null
          class_name: string | null
          final_score: number | null
          participant_name: string | null
          position: number | null
          quiz_id: string | null
          score: number | null
          season_id: string | null
          streak_bonus: number | null
          total_time_ms: number | null
          total_time_seconds: number | null
          week_number: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_by_class"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "ranking_general"
            referencedColumns: ["church_id"]
          },
          {
            foreignKeyName: "quiz_attempts_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      approve_church_edit_request: {
        Args: { p_note?: string; p_request_id: string }
        Returns: undefined
      }
      award_season_end_badges: {
        Args: { p_season_id: string }
        Returns: undefined
      }
      current_admin_church_id: { Args: never; Returns: string }
      current_week_window: {
        Args: never
        Returns: {
          week_end: string
          week_start: string
        }[]
      }
      get_or_create_daily_verse: {
        Args: never
        Returns: {
          book: string
          chapter: number
          text: string
          theme: string
          verse: number
          verse_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      notify_superadmins: {
        Args: { body: string; link: string; source: string; title: string }
        Returns: undefined
      }
      reject_church_edit_request: {
        Args: { p_note?: string; p_request_id: string }
        Returns: undefined
      }
      tick_weekly_quiz_schedule: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "superadmin"
      moderation_status: "approved" | "pending" | "blocked"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "superadmin"],
      moderation_status: ["approved", "pending", "blocked"],
    },
  },
} as const
