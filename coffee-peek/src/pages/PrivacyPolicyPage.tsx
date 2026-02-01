import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import Button from '../components/Button';
import { Icons } from '../constants';
import { usePageTitle } from '../hooks/usePageTitle';

const PrivacyPolicyPage: React.FC = () => {
  usePageTitle('Политика конфиденциальности');
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);

  const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#A39E93]' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-[#3D2F28]' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Button
          variant="secondary"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <Icons.Back className="w-5 h-5 inline mr-2" />
          Назад
        </Button>

        <div className={`${bgClass} rounded-lg border ${borderClass} p-6 sm:p-8 lg:p-12`}>
          <h1 className={`text-4xl font-bold ${textClass} mb-6`}>
            Политика конфиденциальности
          </h1>

          <p className={`text-sm ${textSecondaryClass} mb-8`}>
            <strong>Дата последнего обновления:</strong> {new Date().toLocaleDateString('ru-RU')}
          </p>

          <div className={`space-y-6 ${textClass}`}>
            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                1. Общие положения
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
                персональных данных пользователей веб-сайта CoffeePeek (далее — «Сайт»). 
                Используя Сайт, вы соглашаетесь с условиями настоящей Политики конфиденциальности.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                2. Собираемые данные
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed mb-3`}>
                Мы собираем следующие типы данных:
              </p>
              <ul className={`list-disc list-inside space-y-2 ${textSecondaryClass} ml-4`}>
                <li><strong>Персональные данные:</strong> email, имя пользователя, номер телефона (при предоставлении)</li>
                <li><strong>Данные аутентификации:</strong> токены доступа, хранящиеся в localStorage браузера</li>
                <li><strong>Контент:</strong> отзывы о кофейнях, фотографии, чекины</li>
                <li><strong>Технические данные:</strong> настройки темы интерфейса, предпочтения пользователя</li>
                <li><strong>Данные о кофейнях:</strong> адреса, контактная информация, расписание работы</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                3. Использование данных
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed mb-3`}>
                Мы используем собранные данные для:
              </p>
              <ul className={`list-disc list-inside space-y-2 ${textSecondaryClass} ml-4`}>
                <li>Предоставления доступа к функционалу Сайта</li>
                <li>Аутентификации и авторизации пользователей</li>
                <li>Отображения персонализированного контента</li>
                <li>Улучшения работы Сайта и пользовательского опыта</li>
                <li>Модерации контента и обеспечения безопасности</li>
                <li>Связи с пользователями по вопросам использования Сайта</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                4. Хранение данных
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Персональные данные хранятся на защищенных серверах. Токены аутентификации 
                и настройки темы хранятся в localStorage браузера пользователя. Мы принимаем 
                меры для защиты данных от несанкционированного доступа, изменения, раскрытия 
                или уничтожения.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                5. Использование localStorage
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed mb-3`}>
                Мы используем localStorage браузера для хранения:
              </p>
              <ul className={`list-disc list-inside space-y-2 ${textSecondaryClass} ml-4`}>
                <li><strong>Токенов аутентификации:</strong> необходимы для доступа к защищенным функциям Сайта</li>
                <li><strong>Настроек темы:</strong> для сохранения ваших предпочтений отображения интерфейса</li>
                <li><strong>Согласия на обработку данных:</strong> для отслеживания вашего согласия</li>
              </ul>
              <p className={`${textSecondaryClass} leading-relaxed mt-3`}>
                Вы можете очистить localStorage через настройки браузера, однако это может 
                повлиять на функциональность Сайта.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                6. Передача данных третьим лицам
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Мы не продаем и не передаем персональные данные третьим лицам, за исключением 
                случаев, когда это необходимо для функционирования Сайта (например, хостинг-провайдеры) 
                или требуется по закону. Мы используем внешние сервисы (Google Fonts, Tailwind CSS CDN) 
                для улучшения работы Сайта, которые могут собирать технические данные согласно 
                своим политикам конфиденциальности.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                7. Права пользователей
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed mb-3`}>
                Вы имеете право:
              </p>
              <ul className={`list-disc list-inside space-y-2 ${textSecondaryClass} ml-4`}>
                <li>Получать информацию о ваших персональных данных</li>
                <li>Требовать исправления неточных данных</li>
                <li>Требовать удаления ваших персональных данных</li>
                <li>Отозвать согласие на обработку персональных данных</li>
                <li>Ограничить обработку ваших персональных данных</li>
              </ul>
              <p className={`${textSecondaryClass} leading-relaxed mt-3`}>
                Для реализации этих прав свяжитесь с нами через форму обратной связи или 
                настройки профиля.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                8. Сроки хранения данных
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Персональные данные хранятся до тех пор, пока у вас есть активный аккаунт 
                или пока вы не запросите их удаление. Токены аутентификации хранятся в 
                localStorage до выхода из системы или истечения срока их действия.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                9. Безопасность данных
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Мы применяем технические и организационные меры для защиты ваших персональных 
                данных от несанкционированного доступа, изменения, раскрытия или уничтожения. 
                Однако ни один метод передачи данных через интернет не является абсолютно безопасным.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                10. Изменения в Политике конфиденциальности
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Мы оставляем за собой право вносить изменения в настоящую Политику конфиденциальности. 
                О существенных изменениях мы уведомим вас через Сайт или по email. Продолжение 
                использования Сайта после внесения изменений означает ваше согласие с новой версией 
                Политики.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>
                11. Контакты
              </h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                По всем вопросам, связанным с обработкой персональных данных, вы можете 
                обращаться через форму обратной связи в настройках профиля или на странице 
                поддержки.
              </p>
            </section>
          </div>

          <div className={`mt-8 pt-6 border-t ${borderClass}`}>
            <Button
              variant="secondary"
              onClick={() => navigate(-1)}
              className="w-full sm:w-auto"
            >
              <Icons.Back className="w-5 h-5 inline mr-2" />
              Вернуться назад
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;

