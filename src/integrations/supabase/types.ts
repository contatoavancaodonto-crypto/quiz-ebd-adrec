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
      academic_comments: {
        Row: {
          church_id: string | null
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          read_at: string | null
          recipient_id: string | null
          scheduled_for: string | null
          sender_id: string
          type: string
          updated_at: string
        }
        Insert: {
          church_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          scheduled_for?: string | null
          sender_id: string
          type: string
          updated_at?: string
        }
        Update: {
          church_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          recipient_id?: string | null
          scheduled_for?: string | null
          sender_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_comments_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          is_correct: boolean
          question_id: string | null
          question_ref: string | null
          selected_option: string
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          is_correct?: boolean
          question_id?: string | null
          question_ref?: string | null
          selected_option: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          is_correct?: boolean
          question_id?: string | null
          question_ref?: string | null
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
            referencedRelation: "ranking_lesson"
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
            referencedRelation: "ranking_lesson"
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
          slug: string
        }
        Insert: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          cover_url?: string | null
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      daily_verse: {
        Row: {
          class_id: string | null
          created_at: string
          date: string
          id: string
          verse_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date: string
          id?: string
          verse_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          verse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_verse_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_verse_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_lesson"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "daily_verse_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "daily_verse_verse_id_fkey"
            columns: ["verse_id"]
            isOneToOne: false
            referencedRelation: "verses"
            referencedColumns: ["id"]
          },
        ]
      }
      email_queue: {
        Row: {
          body: string
          created_at: string | null
          id: string
          processed_at: string | null
          status: string | null
          subject: string
          to_email: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          status?: string | null
          subject: string
          to_email: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          processed_at?: string | null
          status?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          content_html: string
          created_at: string
          display_name: string
          id: string
          name: string
          preview_data: Json | null
          subject: string
          updated_at: string
        }
        Insert: {
          content_html: string
          created_at?: string
          display_name: string
          id?: string
          name: string
          preview_data?: Json | null
          subject: string
          updated_at?: string
        }
        Update: {
          content_html?: string
          created_at?: string
          display_name?: string
          id?: string
          name?: string
          preview_data?: Json | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      favorite_verses: {
        Row: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at: string
          id: string
          user_id: string
          verse_number: number
          verse_text: string
        }
        Insert: {
          book_abbrev: string
          book_name: string
          chapter: number
          created_at?: string
          id?: string
          user_id: string
          verse_number: number
          verse_text: string
        }
        Update: {
          book_abbrev?: string
          book_name?: string
          chapter?: number
          created_at?: string
          id?: string
          user_id?: string
          verse_number?: number
          verse_text?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          lesson_number: number
          questions: Json
          reading_theme: string | null
          scheduled_date: string | null
          scheduled_end_date: string | null
          status: string
          theme: string
          trimester: string
          updated_at: string
          verses: Json
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_number: number
          questions?: Json
          reading_theme?: string | null
          scheduled_date?: string | null
          scheduled_end_date?: string | null
          status?: string
          theme: string
          trimester: string
          updated_at?: string
          verses?: Json
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_number?: number
          questions?: Json
          reading_theme?: string | null
          scheduled_date?: string | null
          scheduled_end_date?: string | null
          status?: string
          theme?: string
          trimester?: string
          updated_at?: string
          verses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_lesson"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
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
          user_id: string | null
        }
        Insert: {
          active?: boolean
          class_id: string
          created_at?: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          active?: boolean
          class_id?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string | null
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
            referencedRelation: "ranking_lesson"
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
          has_seen_tour: boolean | null
          hidden_at: string | null
          id: string
          last_name: string | null
          phone: string | null
          provider: string | null
          show_avatar_in_ranking: boolean
          updated_at: string
          welcome_sent: boolean | null
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
          has_seen_tour?: boolean | null
          hidden_at?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          provider?: string | null
          show_avatar_in_ranking?: boolean
          updated_at?: string
          welcome_sent?: boolean | null
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
          has_seen_tour?: boolean | null
          hidden_at?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          provider?: string | null
          show_avatar_in_ranking?: boolean
          updated_at?: string
          welcome_sent?: boolean | null
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
            referencedRelation: "ranking_lesson"
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
          lesson_id: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number
          question_text: string
          quiz_id: string | null
        }
        Insert: {
          active?: boolean
          correct_option: string
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number
          question_text: string
          quiz_id?: string | null
        }
        Update: {
          active?: boolean
          correct_option?: string
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id?: string | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          order_index?: number
          question_text?: string
          quiz_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "ranking_lesson"
            referencedColumns: ["quiz_id"]
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
          lesson_id: string | null
          participant_id: string
          quiz_id: string | null
          score: number
          season_id: string | null
          source_type: string | null
          started_at: string
          streak_at_attempt: number
          streak_bonus: number
          total_questions: number
          total_time_ms: number
          total_time_seconds: number
          trimester: number | null
          week_number: number | null
        }
        Insert: {
          accuracy_percentage?: number
          created_at?: string
          final_score?: number | null
          finished_at?: string | null
          id?: string
          lesson_id?: string | null
          participant_id: string
          quiz_id?: string | null
          score?: number
          season_id?: string | null
          source_type?: string | null
          started_at?: string
          streak_at_attempt?: number
          streak_bonus?: number
          total_questions?: number
          total_time_ms?: number
          total_time_seconds?: number
          trimester?: number | null
          week_number?: number | null
        }
        Update: {
          accuracy_percentage?: number
          created_at?: string
          final_score?: number | null
          finished_at?: string | null
          id?: string
          lesson_id?: string | null
          participant_id?: string
          quiz_id?: string | null
          score?: number
          season_id?: string | null
          source_type?: string | null
          started_at?: string
          streak_at_attempt?: number
          streak_bonus?: number
          total_questions?: number
          total_time_ms?: number
          total_time_seconds?: number
          trimester?: number | null
          week_number?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "ranking_lesson"
            referencedColumns: ["quiz_id"]
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
            referencedRelation: "ranking_lesson"
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
            referencedRelation: "ranking_lesson"
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
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
            referencedRelation: "ranking_lesson"
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
      user_reading_progress: {
        Row: {
          created_at: string | null
          day_key: string
          id: string
          is_read: boolean | null
          lesson_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          day_key: string
          id?: string
          is_read?: boolean | null
          lesson_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          day_key?: string
          id?: string
          is_read?: boolean | null
          lesson_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
        ]
      }
      verses: {
        Row: {
          active: boolean
          book: string
          chapter: number
          class_id: string | null
          created_at: string
          id: string
          scheduled_date: string | null
          text: string
          theme: string
          trimester: number | null
          verse: number
        }
        Insert: {
          active?: boolean
          book: string
          chapter: number
          class_id?: string | null
          created_at?: string
          id?: string
          scheduled_date?: string | null
          text: string
          theme?: string
          trimester?: number | null
          verse: number
        }
        Update: {
          active?: boolean
          book?: string
          chapter?: number
          class_id?: string | null
          created_at?: string
          id?: string
          scheduled_date?: string | null
          text?: string
          theme?: string
          trimester?: number | null
          verse?: number
        }
        Relationships: [
          {
            foreignKeyName: "verses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_lesson"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "verses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
        ]
      }
      webhook_queue: {
        Row: {
          attempts: number | null
          created_at: string | null
          id: string
          last_error: string | null
          next_retry_at: string | null
          payload: Json
          status: string
          updated_at: string | null
        }
        Insert: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          payload: Json
          status?: string
          updated_at?: string | null
        }
        Update: {
          attempts?: number | null
          created_at?: string | null
          id?: string
          last_error?: string | null
          next_retry_at?: string | null
          payload?: Json
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      ranking_by_class: {
        Row: {
          accuracy_percentage: number | null
          attempt_id: string | null
          class_id: string | null
          class_name: string | null
          final_score: number | null
          lesson_id: string | null
          participant_name: string | null
          position: number | null
          quiz_id: string | null
          score: number | null
          total_time_ms: number | null
          total_time_seconds: number | null
          trimester: number | null
          week_number: number | null
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
            referencedRelation: "ranking_lesson"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "participants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
            referencedRelation: "ranking_lesson"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["quiz_id"]
          },
        ]
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
          lesson_id: string | null
          participant_name: string | null
          position: number | null
          quiz_id: string | null
          score: number | null
          total_time_ms: number | null
          total_time_seconds: number | null
          trimester: number | null
          week_number: number | null
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
            referencedRelation: "ranking_lesson"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "participants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
            referencedRelation: "ranking_lesson"
            referencedColumns: ["quiz_id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["quiz_id"]
          },
        ]
      }
      ranking_lesson: {
        Row: {
          accuracy_percentage: number | null
          attempt_id: string | null
          church_id: string | null
          church_name: string | null
          class_id: string | null
          class_name: string | null
          final_score: number | null
          finished_at: string | null
          lesson_id: string | null
          lesson_number: number | null
          lesson_theme: string | null
          participant_name: string | null
          position: number | null
          quiz_id: string | null
          score: number | null
          season_id: string | null
          streak_bonus: number | null
          total_questions: number | null
          total_time_ms: number | null
          total_time_seconds: number | null
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
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
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
            referencedRelation: "ranking_lesson"
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
            referencedRelation: "ranking_lesson"
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
      ranking_trimester_consolidated: {
        Row: {
          avatar_url: string | null
          church_id: string | null
          church_name: string | null
          class_id: string | null
          class_name: string | null
          last_finished_at: string | null
          participant_name: string | null
          position: number | null
          quizzes_completed: number | null
          total_score: number | null
          total_time_ms: number | null
          trimester: number | null
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
            referencedRelation: "ranking_lesson"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "participants_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "ranking_weekly"
            referencedColumns: ["class_id"]
          },
          {
            foreignKeyName: "profiles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
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
          finished_at: string | null
          lesson_id: string | null
          lesson_theme: string | null
          participant_name: string | null
          position: number | null
          quiz_id: string | null
          score: number | null
          season_id: string | null
          streak_bonus: number | null
          total_questions: number | null
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
            foreignKeyName: "quiz_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
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
      view_audit_duplicate_attempts: {
        Row: {
          attempts_count: number | null
          best_score: number | null
          church_name: string | null
          class_name: string | null
          lesson_key: string | null
          lesson_theme: string | null
          participant_id: string | null
          participant_name: string | null
          points_saved_by_fix: number | null
          total_inflated_sum: number | null
          worst_score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_get_questions_with_answer: {
        Args: { p_quiz_id: string }
        Returns: {
          correct_option: string
          explanation: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number
          question_text: string
        }[]
      }
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      finalize_attempt:
        | {
            Args: { p_attempt_id: string; p_total_time_ms: number }
            Returns: {
              accuracy_percentage: number
              score: number
              total_questions: number
              total_time_ms: number
            }[]
          }
        | {
            Args: {
              p_attempt_id: string
              p_total_time_ms: number
              p_trimester?: number
            }
            Returns: {
              accuracy_percentage: number
              score: number
              total_questions: number
              total_time_ms: number
            }[]
          }
      get_attempt_gabarito: {
        Args: { p_attempt_id: string }
        Returns: {
          correct_option: string
          is_correct: boolean
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          order_index: number
          question_id: string
          question_text: string
          selected_option: string
        }[]
      }
      get_or_create_daily_verse: {
        Args: { p_class_id?: string }
        Returns: {
          book: string
          chapter: number
          text: string
          theme: string
          verse: number
          verse_id: string
        }[]
      }
      get_trimestral_provao_questions: {
        Args: { p_class_id: string; p_season_id: string }
        Returns: {
          correct_option: string
          id: string
          lesson_number: number
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      notify_superadmins: {
        Args: { body: string; link: string; source: string; title: string }
        Returns: undefined
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      reject_church_edit_request: {
        Args: { p_note?: string; p_request_id: string }
        Returns: undefined
      }
      submit_answer: {
        Args: {
          p_attempt_id: string
          p_question_id: string
          p_selected_option: string
        }
        Returns: {
          correct_option: string
          is_correct: boolean
        }[]
      }
      tick_weekly_quiz_schedule: { Args: never; Returns: undefined }
      urlencode: { Args: { "": string }; Returns: string }
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
