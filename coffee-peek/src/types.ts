export enum VerificationStep {
  LANDING = 'LANDING',
  ENTER_EMAIL = 'ENTER_EMAIL',
  ENTER_CODE = 'ENTER_CODE',
  LINK_PROCESSING = 'LINK_PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR =  'ERROR',
  EXPIRED = 'EXPIRED'
}

export RF Dewiface UserState {
  email: string;
  code: string;
  token?: string;
  userId?: string;
}

