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
    "form_contact": {"en": "Email, phone or Instagram", "ru": "Email, телефон или Instagram", "hy": "Email, հեռախոս կամ Instagram"},
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
        "en": "Turn the rings · language & currency",
        "ru": "Поверните кольца · язык и валюта",
        "hy": "Պտտեք օղակները · լեզու և արժույթ",
    },

    # Used by static/js/main.js (passed in as window.TIKNIK_I18N)
    "price_on_request": {"en": "Price on request", "ru": "Цена по запросу", "hy": "Գինը՝ ըստ հարցման"},
    "per_day": {"en": " / day", "ru": " / сутки", "hy": " / օր"},
    "mode_Rent": {"en": "For Rent", "ru": "Аренда", "hy": "Վարձույթ"},
    "mode_Sale": {"en": "For Sale", "ru": "Продажа", "hy": "Վաճառք"},
    "mode_Both": {"en": "Rent or Buy", "ru": "Аренда или покупка", "hy": "Վարձույթ կամ գնում"},
    "mode_Custom": {"en": "Made to Order", "ru": "На заказ", "hy": "Պատվերով"},
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
    "price_on_request", "per_day", "mode_Rent", "mode_Sale", "mode_Both", "mode_Custom",
    "load_error", "sending", "sent", "send_error", "required_error",
)


def translator(lang):
    return lambda key: UI[key].get(lang) or UI[key]["en"]
