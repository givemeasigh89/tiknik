"""Fixed site text in every language. English is the main language and the fallback.

Catalog content (section names, item names and descriptions) is not here — it lives in
the database and is translated from /admin.
"""

LANGS = ("en", "ru", "hy")
LANG_LABELS = {"en": "EN", "ru": "RU", "hy": "ARM"}

UI = {
    # <head>
    "title": {
        "en": "Tiknik — Bespoke Bridal & Couture",
        "ru": "Tiknik — свадебные наряды и couture на заказ",
        "hy": "Tiknik — հարսանյաց զգեստներ և couture՝ պատվերով",
    },
    "meta_description": {
        "en": "Tiknik — bespoke bridal corsets, gowns, veils and accessories. Rent or order made-to-measure.",
        "ru": "Tiknik — свадебные корсеты, платья, фаты и аксессуары на заказ. Аренда или пошив по вашим меркам.",
        "hy": "Tiknik — հարսանյաց կորսետներ, զգեստներ, քողեր և աքսեսուարներ՝ պատվերով։ Վարձույթ կամ կարում՝ ձեր չափսերով։",
    },

    # Header
    "nav_catalog": {"en": "Catalog", "ru": "Каталог", "hy": "Կատալոգ"},
    "nav_process": {"en": "Process", "ru": "Процесс", "hy": "Ընթացքը"},
    "nav_worldwide": {"en": "Worldwide", "ru": "По всему миру", "hy": "Ամբողջ աշխարհում"},
    "nav_contact": {"en": "Contact", "ru": "Контакты", "hy": "Կապ"},
    "book_fitting": {"en": "Book a Fitting", "ru": "Записаться на примерку", "hy": "Գրանցվել փորձի"},

    # Hero
    "hero_tagline": {
        "en": "Bespoke bridal corsets, gowns, veils and accessories — to rent or to keep.",
        "ru": "Свадебные корсеты, платья, фаты и аксессуары на заказ — напрокат или навсегда.",
        "hy": "Հարսանյաց կորսետներ, զգեստներ, քողեր և աքսեսուարներ՝ պատվերով — վարձույթով կամ ընդմիշտ։",
    },
    "cta_book_quote": {
        "en": "Book a Fitting or Request a Quote",
        "ru": "Записаться на примерку или узнать цену",
        "hy": "Գրանցվել փորձի կամ իմանալ գինը",
    },
    "cta_view_catalog": {"en": "View the Catalog", "ru": "Смотреть каталог", "hy": "Դիտել կատալոգը"},

    # Catalog
    "collection": {"en": "The Collection", "ru": "Коллекция", "hy": "Հավաքածու"},
    "catalog": {"en": "Catalog", "ru": "Каталог", "hy": "Կատալոգ"},
    "tab_all": {"en": "All", "ru": "Все", "hy": "Բոլորը"},
    "catalog_empty": {
        "en": "No items in this category yet.",
        "ru": "В этом разделе пока ничего нет.",
        "hy": "Այս բաժնում դեռ ապրանքներ չկան։",
    },

    # Process
    "how_it_works": {"en": "How It Works", "ru": "Как мы работаем", "hy": "Ինչպես ենք աշխատում"},
    "process_title": {"en": "From Fabric to First Dance", "ru": "От ткани до первого танца", "hy": "Կտորից մինչև առաջին պար"},
    "process_hint": {
        "en": "Turn the key to follow a piece from start to finish",
        "ru": "Поверните ключ, чтобы пройти весь путь вещи",
        "hy": "Պտտեք բանալին՝ զգեստի ամբողջ ճանապարհն անցնելու համար",
    },
    "process_prev": {"en": "Previous", "ru": "Назад", "hy": "Նախորդը"},
    "process_next": {"en": "Next", "ru": "Дальше", "hy": "Հաջորդը"},
    # The five stages of the process ring (static/js/process.js); *_short is the label under the text.
    "stage1_short": {"en": "Fabric", "ru": "Ткань", "hy": "Կտոր"},
    "stage1_title": {"en": "Choosing the Fabric", "ru": "Выбор ткани", "hy": "Կտորի ընտրություն"},
    "stage1_text": {
        "en": "We choose the fabric together: colour, texture, the way it drapes. If you can't come in, "
              "you get a detailed report with photos of every option.",
        "ru": "Вместе выбираем ткань: цвет, фактуру, то, как она ложится. Если вы не можете приехать — "
              "пришлём подробный отчёт с фото каждого варианта.",
        "hy": "Միասին ընտրում ենք կտորը՝ գույնը, ֆակտուրան, թե ինչպես է այն իջնում։ Եթե չեք կարող գալ, "
              "կուղարկենք մանրամասն հաշվետվություն՝ յուրաքանչյուր տարբերակի լուսանկարներով։",
    },
    "stage2_short": {"en": "Measure", "ru": "Мерки", "hy": "Չափսեր"},
    "stage2_title": {"en": "Precise Measurements", "ru": "Точные мерки", "hy": "Ճշգրիտ չափսեր"},
    "stage2_text": {
        "en": "Exact measurements and a pattern drafted for your proportions alone, then checked at a fitting.",
        "ru": "Снимаем точные мерки и строим выкройку только под ваши пропорции, затем проверяем её на примерке.",
        "hy": "Վերցնում ենք ճշգրիտ չափսերը և կառուցում ձևվածք միայն ձեր համամասնություններով, "
              "ապա ստուգում փորձի ժամանակ։",
    },
    "stage3_short": {"en": "Sewing", "ru": "Пошив", "hy": "Կարում"},
    "stage3_title": {"en": "Sewing, Fully Reported", "ru": "Пошив под полным контролем", "hy": "Կարում՝ լիարժեք վերահսկողությամբ"},
    "stage3_text": {
        "en": "Every stage of sewing is documented: you get progress reports and see your piece come together.",
        "ru": "Каждый этап пошива фиксируем: вы получаете отчёты и видите, как рождается ваша вещь.",
        "hy": "Կարի յուրաքանչյուր փուլը փաստագրում ենք. դուք ստանում եք հաշվետվություններ "
              "և տեսնում, թե ինչպես է ստեղծվում ձեր զգեստը։",
    },
    "stage4_short": {"en": "The Look", "ru": "Образ", "hy": "Կերպար"},
    "stage4_title": {"en": "The Look Is Born", "ru": "Рождение образа", "hy": "Կերպարի ծնունդը"},
    "stage4_text": {
        "en": "Final fittings: the piece is almost ready and the look comes together, down to the last detail.",
        "ru": "Финальные примерки: вещь почти готова, образ собирается до последней детали.",
        "hy": "Վերջին փորձերը. զգեստը գրեթե պատրաստ է, կերպարն ամբողջանում է մինչև վերջին մանրուքը։",
    },
    "stage5_short": {"en": "Its Life", "ru": "Жизнь", "hy": "Կյանք"},
    "stage5_title": {"en": "A Life of Its Own", "ru": "Новая жизнь наряда", "hy": "Զգեստի նոր կյանքը"},
    "stage5_text": {
        "en": "Your piece goes out into the world: the wedding, the party, the first dance. "
              "2–4 months for bridal gowns, express on request.",
        "ru": "Наряд выходит в свет: свадьба, праздник, первый танец. "
              "Свадебное платье — 2–4 месяца, срочный пошив по запросу.",
        "hy": "Զգեստը դուրս է գալիս աշխարհ՝ հարսանիք, տոն, առաջին պար։ "
              "Հարսանյաց զգեստը՝ 2–4 ամիս, շտապ պատվերը՝ ըստ պահանջի։",
    },

    # Worldwide
    "worldwide": {"en": "Worldwide", "ru": "По всему миру", "hy": "Ամբողջ աշխարհում"},
    "worldwide_title": {"en": "We Ship & Fit Remotely", "ru": "Доставка и примерка онлайн", "hy": "Առաքում և հեռավար փորձ"},
    "worldwide_text": {
        "en": "Based in Yerevan, working with clients worldwide. Remote measurement guides, video fittings and "
              "international shipping available for custom and made-to-order pieces.",
        "ru": "Мы находимся в Ереване и работаем с клиентами по всему миру. Для изделий на заказ — инструкции "
              "по снятию мерок, примерки по видеосвязи и международная доставка.",
        "hy": "Գտնվում ենք Երևանում և աշխատում ենք ամբողջ աշխարհի հաճախորդների հետ։ Պատվերով իրերի համար՝ "
              "չափսեր վերցնելու ուղեցույց, տեսազանգով փորձ և միջազգային առաքում։",
    },

    # Contact
    "get_in_touch": {"en": "Get in Touch", "ru": "Связаться с нами", "hy": "Կապվեք մեզ հետ"},
    "contact_title": {
        "en": "Book a Fitting or Request a Quote",
        "ru": "Запись на примерку или расчёт стоимости",
        "hy": "Գրանցում փորձի կամ գնի հարցում",
    },
    "form_name": {"en": "Your name", "ru": "Ваше имя", "hy": "Ձեր անունը"},
    "form_contact": {"en": "Phone, WhatsApp or Instagram", "ru": "Телефон, WhatsApp или Instagram", "hy": "Հեռախոս, WhatsApp կամ Instagram"},
    "form_interest": {"en": "What are you interested in?", "ru": "Что вас интересует?", "hy": "Ի՞նչն է ձեզ հետաքրքրում"},
    "form_message": {
        "en": "Tell us a little about what you're looking for",
        "ru": "Расскажите немного о том, что вы ищете",
        "hy": "Պատմեք մի փոքր, թե ինչ եք փնտրում",
    },
    "form_send": {"en": "Send Request", "ru": "Отправить заявку", "hy": "Ուղարկել հայտը"},

    # Product overlay
    "back_to_catalog": {"en": "Back to Catalog", "ru": "Назад к каталогу", "hy": "Վերադառնալ կատալոգ"},
    "prev_item": {"en": "Prev item", "ru": "Предыдущий", "hy": "Նախորդը"},
    "next_item": {"en": "Next item", "ru": "Следующий", "hy": "Հաջորդը"},
    "zoom_hint": {
        "en": "Scroll or double-click to zoom · drag to pan · Esc to close",
        "ru": "Колесо мыши или двойной клик — увеличить · перетащите — сдвинуть · Esc — закрыть",
        "hy": "Մկնիկի անիվ կամ կրկնակի սեղմում՝ խոշորացնել · քաշել՝ տեղաշարժել · Esc՝ փակել",
    },

    # The language / currency dial in the product view
    "dial_hint": {
        "en": "Turn the rings for language and currency",
        "ru": "Поверните кольца: язык и валюта",
        "hy": "Պտտեք օղակները՝ լեզուն և արժույթը փոխելու համար",
    },

    # Navigation (new sections)
    "nav_about": {"en": "About", "ru": "О нас", "hy": "Մեր մասին"},
    "nav_reviews": {"en": "Reviews", "ru": "Отзывы", "hy": "Կարծիքներ"},
    "nav_delivery": {"en": "Delivery", "ru": "Доставка", "hy": "Առաքում"},
    "nav_menu": {"en": "Menu", "ru": "Меню", "hy": "Մենյու"},
    "delivery": {"en": "Delivery & Shipping", "ru": "Доставка", "hy": "Առաքում"},

    # About us (a first draft; the atelier's own text replaces it)
    "about_eyebrow": {"en": "About Us", "ru": "О нас", "hy": "Մեր մասին"},
    "about_title": {"en": "A Small Atelier in Yerevan", "ru": "Маленькое ателье в Ереване", "hy": "Փոքրիկ արվեստանոց Երևանում"},
    "about_p1": {
        "en": "Tiknik is a small bespoke atelier in Yerevan. We make bridal gowns, corsets and evening pieces by hand, "
              "each one for a single person, from the fabric we choose together to the last stitch.",
        "ru": "Tiknik — небольшое ателье в Ереване. Мы вручную создаём свадебные платья, корсеты и вечерние наряды — "
              "каждый для одного человека, от выбора ткани до последнего стежка.",
        "hy": "Tiknik-ը փոքրիկ արվեստանոց է Երևանում։ Մենք ձեռքով ստեղծում ենք հարսանյաց զգեստներ, կորսետներ "
              "և երեկոյան զգեստներ՝ յուրաքանչյուրը մեկ մարդու համար, կտորի ընտրությունից մինչև վերջին կարը։",
    },
    "about_p2": {
        "en": "We love vintage lace, honest materials and quiet details, and we believe a dress should live on "
              "long after the wedding day.",
        "ru": "Мы любим винтажное кружево, честные материалы и тихие детали и верим, что платье должно жить "
              "и после свадьбы.",
        "hy": "Մենք սիրում ենք վինտաժային ժանյակը, բնական նյութերը և նուրբ մանրուքները և հավատում ենք, "
              "որ զգեստը պետք է ապրի նաև հարսանիքից հետո։",
    },

    # Reviews
    "reviews_eyebrow": {"en": "Reviews", "ru": "Отзывы", "hy": "Կարծիքներ"},
    "reviews_title": {"en": "In Their Words", "ru": "Словами наших клиентов", "hy": "Մեր հաճախորդների խոսքերով"},
    "reviews_empty": {
        "en": "Wore a Tiknik piece? We'd love to see it.",
        "ru": "Носили вещь от Tiknik? Нам очень хочется это увидеть.",
        "hy": "Կրե՞լ եք Tiknik-ի զգեստ։ Մենք շատ կուզենայինք տեսնել։",
    },
    "review_add": {"en": "Leave a Review", "ru": "Оставить отзыв", "hy": "Թողնել կարծիք"},
    "review_text": {"en": "A few words about your piece", "ru": "Пара слов о вашем наряде", "hy": "Մի քանի խոսք ձեր զգեստի մասին"},
    "review_photos": {"en": "Add photos · up to 3", "ru": "Добавить фото · до 3", "hy": "Ավելացնել լուսանկար · մինչև 3"},
    "review_send": {"en": "Send", "ru": "Отправить", "hy": "Ուղարկել"},
    "review_thanks": {
        "en": "Thank you! Your review will appear on the site once we've seen it.",
        "ru": "Спасибо! Отзыв появится на сайте после проверки.",
        "hy": "Շնորհակալություն։ Կարծիքը կհայտնվի կայքում ստուգումից հետո։",
    },

    # Cart
    "cart": {"en": "Cart", "ru": "Корзина", "hy": "Զամբյուղ"},
    "add_to_cart": {"en": "Add to Cart", "ru": "В корзину", "hy": "Ավելացնել զամբյուղ"},
    "add_buy": {"en": "Buy", "ru": "Купить", "hy": "Գնել"},
    "add_rent": {"en": "Rent", "ru": "Арендовать", "hy": "Վարձել"},
    "in_cart": {"en": "In your cart ✓", "ru": "В корзине ✓", "hy": "Զամբյուղում է ✓"},
    "cart_empty": {"en": "Your cart is empty.", "ru": "Корзина пуста.", "hy": "Զամբյուղը դատարկ է։"},
    "cart_buy_label": {"en": "Purchase", "ru": "Покупка", "hy": "Գնում"},
    "cart_rent_label": {"en": "Rental", "ru": "Аренда", "hy": "Վարձույթ"},
    "cart_day": {"en": "day", "ru": "дн.", "hy": "օր"},
    "cart_days": {"en": "days", "ru": "дн.", "hy": "օր"},
    "cart_total": {"en": "Total", "ru": "Итого", "hy": "Ընդամենը"},
    "cart_note": {
        "en": "Dates, sizes, wishes (optional)",
        "ru": "Даты, размеры, пожелания (необязательно)",
        "hy": "Ամսաթվեր, չափսեր, ցանկություններ (ըստ ցանկության)",
    },
    "cart_send": {"en": "Send Order", "ru": "Отправить заказ", "hy": "Ուղարկել պատվերը"},
    "cart_no_signup": {
        "en": "No sign-up and no prepayment. We'll contact you to confirm size, dates and payment.",
        "ru": "Без регистрации и предоплаты. Мы свяжемся с вами, чтобы уточнить размер, даты и оплату.",
        "hy": "Առանց գրանցման և կանխավճարի։ Մենք կկապվենք ձեզ հետ՝ չափսը, ամսաթվերը և վճարումը ճշտելու համար։",
    },
    "cart_sent": {
        "en": "Thank you! Order №{n} is with us — we'll be in touch shortly.",
        "ru": "Спасибо! Заказ №{n} у нас — скоро свяжемся с вами.",
        "hy": "Շնորհակալություն։ №{n} պատվերը ստացել ենք, շուտով կկապվենք ձեզ հետ։",
    },
    "cart_remove": {"en": "Remove", "ru": "Убрать", "hy": "Հեռացնել"},
    "busy_error": {
        "en": "Too many requests — please try again in a few minutes.",
        "ru": "Слишком много запросов — попробуйте через несколько минут.",
        "hy": "Չափազանց շատ հարցումներ, փորձեք մի քանի րոպեից։",
    },

    # Contact links
    "contact_direct": {"en": "Or write to us directly", "ru": "Или напишите нам напрямую", "hy": "Կամ գրեք մեզ անմիջապես"},

    # Prices on cards and in the product view (when an item can be both bought and rented)
    "price_dt_buy": {"en": "Buy", "ru": "Покупка", "hy": "Գնում"},
    "price_dt_rent": {"en": "Rent per day", "ru": "Аренда / сутки", "hy": "Վարձույթ / օր"},

    # Handmade facts in the product view ({n} is a number set per item in /admin)
    "handmade_hours": {
        "en": "About {n} hours of handwork",
        "ru": "Около {n} часов ручной работы",
        "hy": "Մոտ {n} ժամ ձեռքի աշխատանք",
    },
    "edition_one": {"en": "One of a kind", "ru": "Единственный экземпляр", "hy": "Միակ օրինակ"},
    "edition_n": {"en": "Only {n} made", "ru": "Тираж: {n} шт.", "hy": "Ընդամենը {n} օրինակ"},
    "share": {"en": "Share", "ru": "Поделиться", "hy": "Կիսվել"},
    "link_copied": {"en": "Link copied", "ru": "Ссылка скопирована", "hy": "Հղումը պատճենված է"},

    # Delivery: three facts (all already stated elsewhere on the site)
    "delivery_f1_title": {"en": "2–4 months", "ru": "2–4 месяца", "hy": "2–4 ամիս"},
    "delivery_f1_text": {
        "en": "for a bridal gown made to your measurements. Express on request.",
        "ru": "на свадебное платье по вашим меркам. Срочный пошив по запросу.",
        "hy": "հարսանյաց զգեստի համար՝ ձեր չափսերով։ Շտապ պատվերը՝ ըստ պահանջի։",
    },
    "delivery_f2_title": {"en": "Fittings by video", "ru": "Примерки по видеосвязи", "hy": "Փորձեր տեսազանգով"},
    "delivery_f2_text": {
        "en": "With a step-by-step guide to taking your own measurements.",
        "ru": "С понятной инструкцией, как снять мерки самостоятельно.",
        "hy": "Քայլ առ քայլ ուղեցույցով, թե ինչպես ինքներդ վերցնել չափսերը։",
    },
    "delivery_f3_title": {"en": "Shipped worldwide", "ru": "Доставка по всему миру", "hy": "Առաքում ամբողջ աշխարհով"},
    "delivery_f3_text": {
        "en": "From our atelier in Yerevan to your door.",
        "ru": "Из нашего ателье в Ереване прямо к вам.",
        "hy": "Մեր արվեստանոցից Երևանում՝ մինչև ձեր դուռը։",
    },

    # Footer
    "handmade_in": {"en": "Handmade in Yerevan", "ru": "Сшито вручную в Ереване", "hy": "Ձեռքով կարված Երևանում"},
    "hours_label": {"en": "Open", "ru": "Часы работы", "hy": "Աշխատում ենք"},

    # Used by static/js/main.js (passed in as window.TIKNIK_I18N)
    "price_on_request": {"en": "Price on request", "ru": "Цена по запросу", "hy": "Գինը՝ ըստ հարցման"},
    "per_day": {"en": " / day", "ru": " / сутки", "hy": " / օր"},
    "mode_Rent": {"en": "For rent", "ru": "Аренда", "hy": "Վարձույթ"},
    "mode_Sale": {"en": "For sale", "ru": "Продажа", "hy": "Վաճառք"},
    "mode_Both": {"en": "Rent or buy", "ru": "Аренда или покупка", "hy": "Վարձույթ կամ գնում"},
    "mode_Custom": {"en": "Made to order", "ru": "На заказ", "hy": "Պատվերով"},
    "load_error": {
        "en": "Unable to load the catalog right now.",
        "ru": "Не удалось загрузить каталог.",
        "hy": "Չհաջողվեց բեռնել կատալոգը։",
    },
    "sending": {"en": "Sending…", "ru": "Отправляем…", "hy": "Ուղարկվում է…"},
    "sent": {
        "en": "Thank you — we've received your request and will be in touch shortly.",
        "ru": "Спасибо! Мы получили вашу заявку и скоро свяжемся с вами.",
        "hy": "Շնորհակալություն։ Ձեր հայտը ստացել ենք և շուտով կկապվենք ձեզ հետ։",
    },
    "send_error": {
        "en": "Something went wrong. Please try again.",
        "ru": "Что-то пошло не так. Попробуйте ещё раз.",
        "hy": "Ինչ-որ բան այն չէ։ Խնդրում ենք փորձել կրկին։",
    },
    "required_error": {
        "en": "Please share your name and a way to reach you.",
        "ru": "Укажите имя и способ связи.",
        "hy": "Խնդրում ենք նշել ձեր անունը և կապի միջոցը։",
    },
}

JS_KEYS = (
    "back_to_catalog", "prev_item", "next_item", "cta_book_quote", "dial_hint",
    "add_to_cart", "add_buy", "add_rent", "in_cart", "cart_buy_label", "cart_rent_label", "cart_day", "cart_days",
    "cart_sent", "cart_remove", "busy_error", "review_thanks",
    "price_dt_buy", "price_dt_rent", "handmade_hours", "edition_one", "edition_n", "share", "link_copied",
    "price_on_request", "per_day", "mode_Rent", "mode_Sale", "mode_Both", "mode_Custom",
    "load_error", "sending", "sent", "send_error", "required_error",
)


def translator(lang):
    return lambda key: UI[key].get(lang) or UI[key]["en"]
