# Badge Change Functionality

## Опис функціональності

Після натискання кнопки "Apply" на попапі "Call before delivery warning", бейдж на Timeline змінюється з червоного "Call before delivery" на зелений "Call scheduled".

## Що було реалізовано

### 1. Новий тип бейджа
- Додано новий тип бейджа `call-scheduled` з зеленим кольором
- Кольори: `bg-green-100 text-green-700 hover:bg-green-200`

### 2. Оновлена логіка попапа
- Кнопка "Apply" тепер викликає функцію `applyBadgeAction()` замість `hideBadgePopup()`
- Передаються параметри: `badgeId`, `location`, `stopIndex`, `routeName`

### 3. Функція `applyBadgeAction()`
- Знаходить відповідну картку в timeline за локацією
- Змінює бейдж з "Call before delivery" на "Call scheduled"
- Оновлює лічильник "Calls scheduled" в KPI панелі
- Додає анімацію переходу

### 4. CSS стилі
- Додано клас `.badge-transition` для плавних переходів
- Додано клас `.badge-call-scheduled` для зеленого бейджа
- Анімація hover ефекту

### 5. Оновлені дані попапа
- Детальніша інформація про ризики та рекомендації
- Специфічні дані для Campo Grande, Route A, Stop 1

## Як це працює

1. Користувач клікає на бейдж "Call before delivery" в timeline
2. Відкривається попап з попередженням
3. Користувач натискає кнопку "Apply"
4. Функція `applyBadgeAction()` знаходить відповідну картку
5. Бейдж змінюється на "Call scheduled" з зеленим кольором
6. Лічильник "Calls scheduled" збільшується на 1
7. Попап закривається

## Тестування

Створено тестовий файл `test_badge_change.html` для перевірки функціональності:
- Симулює timeline картку з бейджем "Call before delivery"
- Показує попап з попередженням
- Демонструє зміну бейджа при натисканні "Apply"

## Файли, що були змінені

- `ai-widget.js` - основна логіка
- `style.css` - CSS стилі для нових бейджів
- `test_badge_change.html` - тестовий файл

## Технічні деталі

- Використовується Tailwind CSS для стилізації
- Анімації через CSS transitions та JavaScript
- Пошук елементів через DOM селектори
- Логування в консоль для відлагодження
