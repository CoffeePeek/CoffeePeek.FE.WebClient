import {
  parseRegistrationApiError,
  validateRegistrationEmail,
  validateRegistrationForm,
  validateRegistrationPassword,
  validateRegistrationUserName,
} from '../src/utils/registrationValidation';

test.each(['e', 'ab', 'x'.repeat(31)])('rejects username outside the backend 3..30 contract: %s', userName => {
  expect(validateRegistrationUserName(userName)).toMatch(/от 3 до 30/);
});

test.each(['1coffee', 'coffee fan', '_coffee', 'coffee-fan'])('rejects username characters forbidden by the backend: %s', userName => {
  expect(validateRegistrationUserName(userName)).toMatch(/Начните с буквы/);
});

test.each(['coffee', 'coffee.fan', 'coffee_fan', 'Кофе123'])('accepts a valid username: %s', userName => {
  expect(validateRegistrationUserName(userName)).toBeNull();
});

test('validates email, password, and privacy agreement before sending the form', () => {
  expect(validateRegistrationEmail('not-an-email')).toMatch(/корректный email/);
  expect(validateRegistrationPassword('1234567')).toMatch(/минимум 8/);
  expect(validateRegistrationForm({
    email: 'bad-email',
    userName: 'e',
    password: '12345',
    agreeToPrivacy: false,
  })).toEqual({
    email: 'Введите корректный email, например name@example.com',
    userName: 'Имя пользователя должно содержать от 3 до 30 символов',
    password: 'Пароль должен содержать минимум 8 символов',
    privacy: 'Примите условия и согласие на обработку данных',
  });
});

test.each([
  ['Password must be at least 8 characters long', 'password', 'минимум 8'],
  ['Username must be between 3 and 30 characters.', 'userName', 'от 3 до 30'],
  ['Username can only contain letters, numbers, dots, and underscores, and must start with a letter.', 'userName', 'Начните с буквы'],
  ['Invalid email format.', 'email', 'корректный email'],
] as const)('localizes a backend validation message: %s', (message, field, expected) => {
  const parsed = parseRegistrationApiError({
    status: 400,
    body: { errorCode: 'VALIDATION_FAILED', message },
  });

  expect(parsed.globalError).toBeNull();
  expect(parsed.fieldErrors[field]).toMatch(new RegExp(expected));
});

test('maps structured backend errors to their fields', () => {
  const parsed = parseRegistrationApiError({
    status: 400,
    errors: {
      Email: ['Invalid email format.'],
      UserName: ['Username must be between 3 and 30 characters.'],
    },
  });

  expect(parsed).toEqual({
    globalError: null,
    fieldErrors: {
      email: 'Введите корректный email, например name@example.com',
      userName: 'Имя пользователя должно содержать от 3 до 30 символов',
    },
  });
});

test('shows a safe actionable fallback for an unknown validation failure', () => {
  expect(parseRegistrationApiError({ status: 400, errorCode: 'VALIDATION_FAILED' })).toEqual({
    globalError: 'Проверьте введённые данные и попробуйте ещё раз.',
    fieldErrors: {},
  });
});
