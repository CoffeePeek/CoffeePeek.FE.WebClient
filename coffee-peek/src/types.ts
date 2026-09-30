export const VerificationStep = {
  LANDING: 'LANDING',
  ENTER_EMAIL: 'ENTER_EMAIL',
  ENTER_CODE: 'ENTER_CODE',
  LINK_PROCESSING: 'LINK_PROCESSING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  EXPIRED: 'EXPIRED'
} as const;

export type VerificationStep = (typeof VerificationStep)[keyof typeof VerificationStep];

export interface UserState {
  email: string;
  code: string;
  token?: string;
  userId?: string;
}

