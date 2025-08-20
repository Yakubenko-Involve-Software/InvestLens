# Badge Change Functionality

## Опис функціональності

Після натискання кнопки "Apply" на попапі "Call before delivery warning", бейдж на Timeline змінюється з червоного "Call before delivery" на зелений "Call scheduled".

**НОВЕ:** Секція "Risk Level" тепер також відображається для попапу "Traffic jam risk warning".

## Що було реалізовано

### 1. Новий тип бейджа
- Додано новий тип бейджа `call-scheduled` з зеленим кольором
- Кольори: `bg-green-100 text-green-700 hover:bg-green-200`

### 2. Оновлена логіка попапа
- Кнопка "Apply" тепер викликає функцію `applyBadgeAction()` замість `hideBadgePopup()`
- Передаються параметри: `badgeId`, `location`, `stopIndex`, `routeName`

### 3. Секція "Risk Level" для всіх ризикових бейджів
- **Call before delivery**: показує секцію "Risk Level" з червоним кольором
- **Traffic jam risk**: тепер також показує секцію "Risk Level" з червоним кольором
- Секція відображає відсоток ризику на основі унікальних даних картки

### 4. Функція `applyBadgeAction()`
- Обробляє `call-before-delivery`: змінює бейдж на "Call scheduled"
- Обробляє `traffic-jam-risk`: оновлює лічильник "Stops merged"
- Знаходить відповідну картку в timeline за локацією
- Оновлює відповідні лічильники в KPI панелі
- Додає анімацію переходу

### 5. CSS стилі
- Додано клас `.badge-transition` для плавних переходів
- Додано клас `.badge-call-scheduled` для зеленого бейджа
- Анімація hover ефекту

### 6. Оновлені дані попапів
- **Call before delivery**: детальна інформація для Campo Grande, Route A, Stop 1
- **Traffic jam risk**: детальна інформація для Campo Grande, Route A, Stop 2
- Специфічні дані про ризики, рекомендації та дії

## Як це працює

### Call before delivery:
1. Користувач клікає на бейдж "Call before delivery" в timeline
2. Відкривається попап з попередженням та секцією "Risk Level"
3. Користувач натискає кнопку "Apply"
4. Бейдж змінюється на "Call scheduled" з зеленим кольором
5. Лічильник "Calls scheduled" збільшується на 1
6. Попап закривається

### Traffic jam risk:
1. Користувач клікає на бейдж "Traffic jam risk" в timeline
2. Відкривається попап з попередженням та секцією "Risk Level"
3. Користувач натискає кнопку "Apply"
4. Лічильник "Stops merged" збільшується на 1
5. Попап закривається

## Тестування

### test_badge_change.html
- Симулює timeline картку з бейджем "Call before delivery"
- Показує попап з попередженням та секцією "Risk Level"
- Демонструє зміну бейджа при натисканні "Apply"

### test_traffic_risk_popup.html
- Симулює timeline картку з бейджем "Traffic jam risk"
- Показує попап з попередженням та секцією "Risk Level"
- Демонструє дію "Apply" для traffic jam risk

## Файли, що були змінені

- `ai-widget.js` - основна логіка функціональності
- `style.css` - CSS стилі для нових бейджів
- `test_badge_change.html` - тестовий файл для Call before delivery
- `test_traffic_risk_popup.html` - тестовий файл для Traffic jam risk

## Технічні деталі

- Використовується Tailwind CSS для стилізації
- Анімації через CSS transitions та JavaScript
- Пошук елементів через DOM селектори
- Логування в консоль для відлагодження
- Секція "Risk Level" показується для `call-before-delivery` та `traffic-jam-risk`
- Унікальні дані генеруються для кожної картки на основі локації, маршруту та позиції
