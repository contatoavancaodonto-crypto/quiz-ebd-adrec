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

export const TEMPLATES: Record<string, TemplateEntry> = {
  "new-class-material": newClassMaterial,
  "support-ticket-created": supportTicketCreated,
  "support-ticket-admin-notification": supportTicketAdminNotification,
};
