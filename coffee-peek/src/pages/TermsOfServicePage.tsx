import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import { Icons } from '../constants';
import { usePageTitle } from '../hooks/usePageTitle';
import { goBackOrHome } from '../constants/legalRoutes';

const TermsOfServicePage: React.FC = () => {
  usePageTitle('Условия использования');
  const navigate = useNavigate();
  const { theme } = useTheme();

  const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-white';
  const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondaryClass = theme === 'dark' ? 'text-[#A39E93]' : 'text-gray-600';
  const borderClass = theme === 'dark' ? 'border-[#3D2F28]' : 'border-gray-200';

  return (
    <div className={`min-h-screen ${bgClass}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <Button
          variant="secondary"
          onClick={() => goBackOrHome(navigate)}
          className="mb-6"
        >
          <Icons.Back className="w-5 h-5 inline mr-2" />
          Назад
        </Button>

        <div className={`${bgClass} rounded-lg border ${borderClass} p-6 sm:p-8 lg:p-12`}>
          <h1 className={`text-4xl font-bold ${textClass} mb-6`}>
            Условия использования
          </h1>

          <p className={`text-sm ${textSecondaryClass} mb-8`}>
            <strong>Дата последнего обновления:</strong> {new Date().toLocaleDateString('ru-RU')}
          </p>

          <div className={`space-y-6 ${textClass}`}>
            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>1. Общие положения</h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Настоящие Условия использования регулируют доступ к веб-сайту и сервису CoffeePeek
                (далее — «Сервис»). Регистрируясь или используя Сервис, вы подтверждаете, что
                прочитали, поняли и согласны соблюдать эти Условия.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>2. Регистрация и аккаунт</h2>
              <p className={`${textSecondaryClass} leading-relaxed mb-3`}>
                Для доступа к части функций требуется создание аккаунта. Вы обязуетесь:
              </p>
              <ul className={`list-disc list-inside space-y-2 ${textSecondaryClass} ml-4`}>
                <li>предоставлять достоверные данные при регистрации;</li>
                <li>обеспечивать конфиденциальность пароля и данных для входа;</li>
                <li>незамедлительно сообщать о несанкционированном доступе к аккаунту.</li>
              </ul>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>3. Пользовательский контент</h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Вы можете публиковать отзывы, фотографии, информацию о кофейнях и другой контент.
                Вы сохраняете права на свой контент, но предоставляете CoffeePeek неисключительную
                лицензию на отображение и хранение материалов в рамках работы Сервиса. Запрещён
                контент, нарушающий закон, права третьих лиц или правила сообщества.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>4. Модерация</h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Мы вправе проверять, одобрять, отклонять или удалять пользовательский контент,
                а также ограничивать доступ к Сервису при нарушении Условий без предварительного
                уведомления.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>5. Ограничение ответственности</h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Сервис предоставляется «как есть». CoffeePeek не гарантирует бесперебойную работу
                и не несёт ответственности за решения, принятые пользователями на основе информации
                в Сервисе (адреса, расписания, отзывы и т.д.).
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>6. Прекращение доступа</h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Вы можете удалить аккаунт в настройках профиля. Мы можем приостановить или
                прекратить доступ при нарушении Условий или по требованию законодательства.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>7. Изменения условий</h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                Мы можем обновлять Условия. Актуальная версия всегда доступна на этой странице.
                Продолжение использования Сервиса после изменений означает согласие с новой редакцией.
              </p>
            </section>

            <section>
              <h2 className={`text-2xl font-semibold ${textClass} mb-4`}>8. Контакты</h2>
              <p className={`${textSecondaryClass} leading-relaxed`}>
                По вопросам, связанным с Условиями использования, обращайтесь через настройки
                профиля или страницу поддержки.
              </p>
            </section>
          </div>

          <div className={`mt-8 pt-6 border-t ${borderClass}`}>
            <Button
              variant="secondary"
              onClick={() => goBackOrHome(navigate)}
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

export default TermsOfServicePage;
