export type RegistrationField = 'email' | 'userName' | 'password' | 'privacy';

export type RegistrationFieldErrors = Partial<Record<RegistrationField, string>>;

export interface RegistrationErrors {
  globalError: string | null;
  fieldErrors: RegistrationFieldErrors;
}

export const REGISTRATION_RULES = {
  userNameMinLength: 3,
  userNameMaxLength: 30,
  passwordMinLength: 8,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USER_NAME_PATTERN = /^\p{L}[\p{L}\p{N}._]*$/u;

const MESSAGES = {
  emailRequired: 'Введите email',
  emailInvalid: 'Введите корректный email, например name@example.com',
  emailExists: 'Аккаунт с таким email уже существует. Попробуйте войти.',
  userNameRequired: 'Введите имя пользователя',
  userNameLength: 'Имя пользователя должно содержать от 3 до 30 символов',
  userNameCharacters: 'Начните с буквы; используйте только буквы, цифры, точку или _',
  passwordRequired: 'Введите пароль',
  passwordLength: 'Пароль должен содержать минимум 8 символов',
  privacyRequired: 'Примите условия и согласие на обработку данных',
} as const;

export function validateRegistrationEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return MESSAGES.emailRequired;
  if (!EMAIL_PATTERN.test(email)) return MESSAGES.emailInvalid;
  return null;
}

export function validateRegistrationUserName(value: string): string | null {
  const userName = value.trim();
  if (!userName) return MESSAGES.userNameRequired;
  if (
    userName.length < REGISTRATION_RULES.userNameMinLength ||
    userName.length > REGISTRATION_RULES.userNameMaxLength
  ) {
    return MESSAGES.userNameLength;
  }
  if (!USER_NAME_PATTERN.test(userName)) return MESSAGES.userNameCharacters;
  return null;
}

export function validateRegistrationPassword(value: string): string | null {
  if (!value) return MESSAGES.passwordRequired;
  if (value.length < REGISTRATION_RULES.passwordMinLength) return MESSAGES.passwordLength;
  return null;
}

export function validateRegistrationForm(values: {
  email: string;
  userName: string;
  password: string;
  agreeToPrivacy: boolean;
}): RegistrationFieldErrors {
  const fieldErrors: RegistrationFieldErrors = {};
  const emailError = validateRegistrationEmail(values.email);
  const userNameError = validateRegistrationUserName(values.userName);
  const passwordError = validateRegistrationPassword(values.password);

  if (emailError) fieldErrors.email = emailError;
  if (userNameError) fieldErrors.userName = userNameError;
  if (passwordError) fieldErrors.password = passwordError;
  if (!values.agreeToPrivacy) fieldErrors.privacy = MESSAGES.privacyRequired;

  return fieldErrors;
}

interface ApiErrorLike {
  status?: number;
  message?: string;
  errorCode?: string;
  errors?: Record<string, string[] | string> | null;
  body?: {
    message?: string;
    errorCode?: string;
    errors?: Record<string, string[] | string> | null;
  };
  response?: {
    status?: number;
    data?: {
      message?: string;
      errorCode?: string;
      errors?: Record<string, string[] | string> | null;
    };
  };
}

function normalizeApiField(value: string): RegistrationField | null {
  const field = value.replace(/[^a-z]/gi, '').toLowerCase();
  if (field.includes('email')) return 'email';
  if (field.includes('username')) return 'userName';
  if (field.includes('password')) return 'password';
  return null;
}

function localizeRegistrationMessage(message: string): {
  field: Exclude<RegistrationField, 'privacy'>;
  message: string;
} | null {
  const normalized = message.toLowerCase();

  if (/password/.test(normalized) && /(at least 8|minimum.*8|8.*character|минимум.*8)/.test(normalized)) {
    return { field: 'password', message: MESSAGES.passwordLength };
  }
  if (/user\s*name|username|имя пользователя/.test(normalized) && /(between 3 and 30|3.*30|от 3 до 30)/.test(normalized)) {
    return { field: 'userName', message: MESSAGES.userNameLength };
  }
  if (/user\s*name|username|имя пользователя/.test(normalized) && /(only contain|must start|letters.*numbers|только.*букв|начинаться.*букв)/.test(normalized)) {
    return { field: 'userName', message: MESSAGES.userNameCharacters };
  }
  if (/invalid email|email.*invalid|email.*format|некорректн.*email/.test(normalized)) {
    return { field: 'email', message: MESSAGES.emailInvalid };
  }
  if (/(email|account|user|аккаунт|пользователь)/.test(normalized) && /(already exists|already registered|duplicate|уже существует|уже зарегистрирован)/.test(normalized)) {
    return { field: 'email', message: MESSAGES.emailExists };
  }

  return null;
}

function collectApiMessages(error: ApiErrorLike): string[] {
  const messages = [error.message, error.body?.message, error.response?.data?.message].filter(
    (message): message is string => Boolean(message),
  );
  const errors = error.errors ?? error.body?.errors ?? error.response?.data?.errors;

  if (errors) {
    for (const value of Object.values(errors)) {
      if (Array.isArray(value)) messages.push(...value.map(String));
      else if (value) messages.push(String(value));
    }
  }

  return [...new Set(messages)];
}

export function parseRegistrationApiError(
  error: unknown,
  context: 'register' | 'emailCheck' = 'register',
): RegistrationErrors {
  const connectionMessage = context === 'emailCheck'
    ? 'Не удалось проверить email. Проверьте подключение и попробуйте ещё раз.'
    : 'Не удалось создать аккаунт. Проверьте подключение и попробуйте ещё раз.';

  if (!error || typeof error !== 'object') {
    return {
      globalError: connectionMessage,
      fieldErrors: {},
    };
  }

  const apiError = error as ApiErrorLike;
  const status = apiError.status ?? apiError.response?.status;
  const errorCode = apiError.errorCode ?? apiError.body?.errorCode ?? apiError.response?.data?.errorCode;
  const fieldErrors: RegistrationFieldErrors = {};
  const errors = apiError.errors ?? apiError.body?.errors ?? apiError.response?.data?.errors;

  if (errors) {
    for (const [apiField, values] of Object.entries(errors)) {
      const field = normalizeApiField(apiField);
      if (!field) continue;

      const messages = Array.isArray(values) ? values : [values];
      const localized = messages.map(localizeRegistrationMessage).find(Boolean);
      if (localized) {
        fieldErrors[field] = localized.message;
      } else if (field === 'email') {
        fieldErrors.email = MESSAGES.emailInvalid;
      } else if (field === 'userName') {
        fieldErrors.userName = MESSAGES.userNameCharacters;
      } else {
        fieldErrors.password = MESSAGES.passwordLength;
      }
    }
  }

  for (const message of collectApiMessages(apiError)) {
    const localized = localizeRegistrationMessage(message);
    if (localized && !fieldErrors[localized.field]) {
      fieldErrors[localized.field] = localized.message;
    }
  }

  if (status === 409 && !fieldErrors.email) {
    fieldErrors.email = MESSAGES.emailExists;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { globalError: null, fieldErrors };
  }

  if (status === 429) {
    return { globalError: 'Слишком много попыток. Подождите минуту и попробуйте снова.', fieldErrors: {} };
  }
  if (status && status >= 500) {
    return { globalError: 'Сервис временно недоступен. Попробуйте ещё раз позже.', fieldErrors: {} };
  }
  if (errorCode === 'VALIDATION_FAILED' || status === 400) {
    return { globalError: 'Проверьте введённые данные и попробуйте ещё раз.', fieldErrors: {} };
  }

  return {
    globalError: connectionMessage,
    fieldErrors: {},
  };
}
