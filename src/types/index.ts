export type RoleCategory = 'Faculty' | 'Program Chair' | 'Administrative Staff';

export interface UserProfile {
  office: string;
  roleCategory: RoleCategory;
  position: string;
  jobDescription: string;
  yearsInRole: number;
  displayName?: string;
  photoURL?: string;
  updatedAt?: string;
}

export type CTQStatus = 'Met' | 'At Risk' | 'Not Met' | 'No data';

export interface CTQItem {
  need: string;
  driver: string;
  ctq: string;
  code: string;
  targetValue: number | null;
  reportedValue: number | null;
  unit: string;
  gap: number | null;
  gapPercent: number | null;
  status: CTQStatus;
  delayCause: string;
  evidenceQuote: string;
}

export interface CustomerVoiceItem {
  quote: string;
  need: string;
}

export interface ImprovementItem {
  action: string;
  owner: string;
  measure: string;
  code: string;
}

export interface ServiceQualityCard {
  serviceName: string;
  customers: string[];
  summary: string;
  customerVoice: CustomerVoiceItem[];
  ctqs: CTQItem[];
  improvements: ImprovementItem[];
  strengths: string[];
  serviceScore: number | null;
  modelUsed?: string;
  generatedAt?: string;
}

export interface Audit {
  id: string;
  userId: string;
  status: 'in_progress' | 'completed';
  stage: number; // 1 to 4
  answerCount: number; // 0 to 8
  profileSnapshot: UserProfile;
  serviceCard?: ServiceQualityCard;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface InteractionMessage {
  id: string;
  auditId: string;
  clientMessageId: string;
  role: 'user' | 'assistant';
  content: string;
  stage: number;
  timestamp: string;
  modelUsed?: string;
}

export interface StandardDocItem {
  id: string;
  title: string;
  text: string;
  sizeChars: number;
  uploadedAt: string;
}

export interface ServiceStandards {
  documents: StandardDocItem[];
  updatedAt?: string;
}

export interface ScorecardReportDoc {
  id: string;
  title: string;
  markdown: string;
  stats: any;
  scorecardByStandard?: any[];
  createdAt: string;
  createdBy: string;
  modelUsed?: string;
}

export interface AdminMeResponse {
  uid: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  adminSetupNeeded: boolean;
}
