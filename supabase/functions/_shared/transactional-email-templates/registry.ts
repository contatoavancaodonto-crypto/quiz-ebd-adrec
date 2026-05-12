/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";

export interface TemplateEntry {
  component: React.ComponentType<any>;
  subject: string | ((data: Record<string, any>) => string);
  to?: string;
  displayName?: string;
  previewData?: Record<string, any>;
}

import { template as newClassMaterial } from "./new-class-material.tsx";
import { template as supportTicketCreated } from "./support-ticket-created.tsx";
import { template as supportTicketAdminNotification } from "./support-ticket-admin-notification.tsx";
import { template as welcome } from "./welcome.tsx";
import { template as quizResult } from "./quiz-result.tsx";
import { template as newQuizAvailable } from "./new-quiz-available.tsx";
import { template as notification } from "./notification.tsx";

export const TEMPLATES: Record<string, TemplateEntry> = {
  "new-class-material": newClassMaterial,
  "support-ticket-created": supportTicketCreated,
  "support-ticket-admin-notification": supportTicketAdminNotification,
  "welcome": welcome,
  "quiz-result": quizResult,
  "new-quiz-available": newQuizAvailable,
  "notification": notification,
};
