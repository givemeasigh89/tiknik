"""Fixed site text in every language. English is the main language and the fallback.

Catalog content (section names, item names and descriptions) is not here — it lives in
the database and is translated from /admin.
"""

LANGS = ("en", "ru", "hy")
LANG_LABELS = {"en": "EN", "ru": "RU", "hy": "ՀԱՅ"}

UI = {
    # <head>
    "title": {
        "en": "Tiknik | Bespoke Bridal & Couture",
        "ru": "Tiknik | свадебные наряды и couture на заказ",
        "hy": "Tiknik | հարսանյաց զգեստներ և couture՝ պատվերով",
    },
    "meta_description": {
        "en": "Tiknik: bespoke bridal corsets, gowns, veils and accessories. Rent or order made-to-measure.",
        "ru": "Tiknik: свадебные корсеты, платья, фаты и аксессуары на заказ. Аренда или пошив по вашим меркам.",
        "hy": "Tiknik. հարսանյաց կորսետներ, զգեստներ, քողեր և աքսեսուարներ՝ պատվերով։ Վարձույթ կամ կարում՝ ձեր չափսերով։",
    },

    # Header
    "nav_catalog": {"en": "Catalog", "ru": "Каталог", "hy": "Կատալոգ"},
    "nav_process": {"en": "Process", "ru": "Процесс", "hy": "Ընթացքը"},
    "nav_worldwide": {"en": "Worldwide", "ru": "По всему миру", "hy": "Ամբողջ աշխարհում"},
    "nav_contact": {"en": "Contact", "ru": "Контакты", "hy": "Կապ"},
    "book_fitting": {
        "en": "Book a fitting",
        "ru": "Записаться на примерку",
        "hy": "Գրանցվել փորձի",
    },

    # Hero
    "hero_tagline": {
        "en": "Bridal gowns and couture, sewn by hand in Yerevan for one bride at a time.",
        "ru": "Свадебные платья и couture, сшитые вручную в Ереване, для каждой невесты отдельно.",
        "hy": "Հարսանյաց զգեստներ և couture՝ ձեռքով կարված Երևանում, յուրաքանչյուր հարսնացուի համար առանձին։",
    },
    "cta_book_quote": {
        "en": "Book a fitting",
        "ru": "Записаться на примерку",
        "hy": "Գրանցվել փորձի",
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
    "stage1_short": {"en": "Design", "ru": "Дизайн", "hy": "Դիզայն"},
    "stage1_title": {"en": "Consultation & Design", "ru": "Консультация и дизайн", "hy": "Խորհրդատվություն և դիզայն"},
    "stage1_text": {
        "en": "Once an order is confirmed, we discuss the desired design, individual preferences and take the bride's measurements.",
        "ru": "После подтверждения заказа мы обсуждаем желаемый дизайн, ваши пожелания и снимаем мерки невесты.",
        "hy": "Պատվերը հաստատելուց հետո քննարկում ենք ցանկալի դիզայնը, անհատական նախասիրությունները և վերցնում հարսնացուի չափսերը։",
    },
    "stage2_short": {"en": "Pattern", "ru": "Выкройка", "hy": "Ձևվածք"},
    "stage2_title": {"en": "Pattern Making", "ru": "Построение выкройки", "hy": "Ձևվածքի պատրաստում"},
    "stage2_text": {
        "en": "An individual pattern is drafted according to the bride's measurements and chosen design.",
        "ru": "По меркам невесты и выбранному дизайну строится индивидуальная выкройка.",
        "hy": "Հարսնացուի չափսերով և ընտրված դիզայնով կառուցվում է անհատական ձևվածք։",
    },
    "stage3_short": {"en": "Toile", "ru": "Макет", "hy": "Մակետ"},
    "stage3_title": {"en": "Toile & First Fitting", "ru": "Макет и первая примерка", "hy": "Մակետ և առաջին փորձ"},
    "stage3_text": {
        "en": "A preliminary version of the dress (toile) is made in simple fabric to check the silhouette, proportions and fit before any final materials are used.",
        "ru": "Из простой ткани шьётся предварительная версия платья (макет), чтобы проверить силуэт, пропорции и посадку до работы с основными материалами.",
        "hy": "Պարզ կտորից կարվում է զգեստի նախնական տարբերակը (մակետ)՝ սիլուետը, համամասնությունները և նստվածքը ստուգելու համար, նախքան հիմնական նյութերով աշխատելը։",
    },
    "stage4_short": {"en": "Fabric", "ru": "Ткань", "hy": "Կտոր"},
    "stage4_title": {"en": "Fabric Selection", "ru": "Выбор ткани", "hy": "Կտորի ընտրություն"},
    "stage4_text": {
        "en": "We present carefully selected fabrics, vintage lace, colours and textures for the bride's approval.",
        "ru": "Мы предлагаем невесте на утверждение тщательно подобранные ткани, винтажное кружево, цвета и фактуры.",
        "hy": "Հարսնացուի հաստատմանն ենք ներկայացնում խնամքով ընտրված կտորներ, վինտաժային ժանյակ, գույներ և ֆակտուրաներ։",
    },
    "stage5_short": {"en": "Sewing", "ru": "Пошив", "hy": "Կարում"},
    "stage5_title": {"en": "Dressmaking & Second Fitting", "ru": "Пошив и вторая примерка", "hy": "Կարում և երկրորդ փորձ"},
    "stage5_text": {
        "en": "The final dress is created using the approved materials, followed by a second fitting and any necessary adjustments.",
        "ru": "Платье шьётся из утверждённых материалов, затем проходит вторая примерка и необходимые доработки.",
        "hy": "Զգեստը կարվում է հաստատված նյութերից, որից հետո անցկացվում է երկրորդ փորձը և անհրաժեշտ ճշգրտումները։",
    },
    "stage6_short": {"en": "Completion", "ru": "Готово", "hy": "Ավարտ"},
    "stage6_title": {"en": "Completion", "ru": "Завершение", "hy": "Ավարտ"},
    "stage6_text": {
        "en": "Once every detail and the fit are approved, the dress is finished and prepared for delivery.",
        "ru": "Когда каждая деталь и посадка утверждены, платье завершается и готовится к передаче.",
        "hy": "Երբ յուրաքանչյուր մանրուք և նստվածքը հաստատված են, զգեստն ավարտվում է և պատրաստվում հանձնման։",
    },
    "process_remote_title": {"en": "Remote ordering", "ru": "Заказ из другой страны", "hy": "Հեռավար պատվեր"},
    "process_remote_text": {
        "en": "For brides abroad, the process is managed entirely online. Measurements, photographs and videos are shared throughout each stage, allowing the bride to review designs, fabrics, fittings and adjustments remotely.",
        "ru": "Для невест из других стран весь процесс проходит онлайн. На каждом этапе мы обмениваемся мерками, фото и видео, и невеста видит дизайн, ткани, примерки и доработки удалённо.",
        "hy": "Արտերկրում գտնվող հարսնացուների համար ամբողջ ընթացքը կազմակերպվում է առցանց։ Յուրաքանչյուր փուլում փոխանակում ենք չափսեր, լուսանկարներ և տեսանյութեր, և հարսնացուն հեռավար տեսնում է դիզայնը, կտորները, փորձերն ու ճշգրտումները։",
    },

    # Worldwide
    "worldwide": {"en": "Worldwide", "ru": "По всему миру", "hy": "Ամբողջ աշխարհում"},
    "worldwide_title": {"en": "We Ship & Fit Remotely", "ru": "Доставка и примерка онлайн", "hy": "Առաքում և հեռավար փորձ"},
    "worldwide_text": {
        "en": "Based in Yerevan, working with clients worldwide. Remote measurement guides, video fittings and "
              "international shipping available for custom and made-to-order pieces.",
        "ru": "Мы находимся в Ереване и работаем с клиентами по всему миру. Для изделий на заказ инструкции "
              "по снятию мерок, примерки по видеосвязи и международная доставка.",
        "hy": "Գտնվում ենք Երևանում և աշխատում ենք ամբողջ աշխարհի հաճախորդների հետ։ Պատվերով իրերի համար՝ "
              "չափսեր վերցնելու ուղեցույց, տեսազանգով փորձ և միջազգային առաքում։",
    },

    # Contact
    "get_in_touch": {"en": "Get in Touch", "ru": "Связаться с нами", "hy": "Կապվեք մեզ հետ"},
    "contact_title": {
        "en": "Book a fitting",
        "ru": "Записаться на примерку",
        "hy": "Գրանցվել փորձի",
    },
    "form_name": {"en": "Your name", "ru": "Ваше имя", "hy": "Ձեր անունը"},
    "form_contact": {"en": "Phone, WhatsApp or Instagram", "ru": "Телефон, WhatsApp или Instagram", "hy": "Հեռախոս, WhatsApp կամ Instagram"},
    "form_interest": {"en": "What are you interested in?", "ru": "Что вас интересует?", "hy": "Ի՞նչն է ձեզ հետաքրքրում"},
    "form_message": {
        "en": "Tell us a little about what you're looking for",
        "ru": "Расскажите немного о том, что вы ищете",
        "hy": "Պատմեք մի փոքր, թե ինչ եք փնտրում",
    },
    "form_send": {
        "en": "Book a fitting",
        "ru": "Записаться на примерку",
        "hy": "Գրանցվել փորձի",
    },
    "contact_lead": {
        "en": "Tell us about your day and the dress you imagine. We reply personally, usually within a day.",
        "ru": "Расскажите о своём дне и платье, которое вы представляете. Мы ответим лично, обычно в течение дня.",
        "hy": "Պատմեք ձեր օրվա և ձեր պատկերացրած զգեստի մասին։ Մենք կպատասխանենք անձամբ, սովորաբար մեկ օրվա ընթացքում։",
    },
    "form_label_name": {"en": "Name", "ru": "Имя", "hy": "Անուն"},
    "form_label_contact": {"en": "Phone, WhatsApp or Instagram", "ru": "Телефон, WhatsApp или Instagram", "hy": "Հեռախոս, WhatsApp կամ Instagram"},
    "form_label_interest": {"en": "Interested in", "ru": "Интересует", "hy": "Հետաքրքրում է"},
    "form_label_message": {"en": "Your wedding and wishes", "ru": "Ваша свадьба и пожелания", "hy": "Ձեր հարսանիքը և ցանկությունները"},
    "dl_local_sum": {
        "en": "Free collection from our home studio in Yerevan, or local delivery",
        "ru": "Бесплатно: забрать в нашей студии в Ереване или доставка по стране",
        "hy": "Անվճար՝ վերցնել մեր արվեստանոցից Երևանում կամ առաքում",
    },
    "dl_intl_sum": {"en": "Registered post with tracking, 10–30 days", "ru": "Заказной почтой с трек-номером, 10–30 дней", "hy": "Պատվիրված փոստով, հետևման համարով, 10–30 օր"},
    "dl_pack_sum": {"en": "A protective garment bag, ready to wear, with care notes", "ru": "Защитный чехол, готово к носке, инструкция по уходу", "hy": "Պաշտպանիչ պարկ, պատրաստ հագնելու, խնամքի հրահանգներ"},
    "dl_cond_sum": {"en": "Dispatch dates, tracking and customs", "ru": "Даты отправки, отслеживание и таможня", "hy": "Ուղարկման ամսաթվեր, հետևում և մաքսային հարցեր"},

    # Product overlay
    "back_to_catalog": {"en": "Back to Catalog", "ru": "Назад к каталогу", "hy": "Վերադառնալ կատալոգ"},
    "prev_item": {"en": "Prev item", "ru": "Предыдущий", "hy": "Նախորդը"},
    "next_item": {"en": "Next item", "ru": "Следующий", "hy": "Հաջորդը"},
    "zoom_hint": {
        "en": "Scroll or double-click to zoom · drag to pan · Esc to close",
        "ru": "Колесо мыши или двойной клик: увеличить, перетащите: сдвинуть, Esc: закрыть",
        "hy": "Մկնիկի անիվ կամ կրկնակի սեղմում՝ խոշորացնել · քաշել՝ տեղաշարժել · Esc՝ փակել",
    },

    # The language / currency dial in the product view
    "dial_hint": {
        "en": "Turn the rings to change them",
        "ru": "Поверните кольца, чтобы сменить",
        "hy": "Պտտեք օղակները՝ փոխելու համար",
    },

    # Navigation (new sections)
    "nav_about": {"en": "About", "ru": "О нас", "hy": "Մեր մասին"},
    "nav_reviews": {"en": "Reviews", "ru": "Отзывы", "hy": "Կարծիքներ"},
    "nav_delivery": {"en": "Delivery", "ru": "Доставка", "hy": "Առաքում"},
    "nav_menu": {"en": "Menu", "ru": "Меню", "hy": "Մենյու"},
    "delivery": {"en": "Delivery & Shipping", "ru": "Доставка", "hy": "Առաքում"},

    # About us: the atelier's story in three chapters (static/img/about/1–3.jpg go with them)
    "about_gloss": {
        "en": "tiknik: “doll”, in Armenian",
        "ru": "тикник: «кукла» по-армянски",
        "hy": "տիկնիկ",
    },
    "about_p1": {
        "en": "Tiknik, meaning doll in Armenian, has its roots in a childhood memory. When her grandmother took her "
              "to a children's beauty competition, she wore specially made dresses and was given the title "
              "Kendani Tiknik, the Living Doll. Years later, this name became the identity of a bridal house shaped "
              "by a lasting appreciation for beautiful garments, individuality and craftsmanship.",
        "ru": "Tiknik, что по-армянски значит «кукла», берёт начало в детском воспоминании. Бабушка привела её "
              "на детский конкурс красоты: на ней были платья, сшитые специально для этого дня, и ей дали титул "
              "Kendani Tiknik, «Живая кукла». Годы спустя это имя стало именем свадебного дома, который вырос "
              "из любви к красивой одежде, индивидуальности и ручной работе.",
        "hy": "Tiknik անունը, որ հայերեն նշանակում է «տիկնիկ», սկիզբ է առնում մանկության մի հիշողությունից։ "
              "Տատիկը նրան տարավ մանկական գեղեցկության մրցույթի. նա կրում էր հատուկ կարված զգեստներ և "
              "արժանացավ «Կենդանի տիկնիկ» կոչմանը։ Տարիներ անց այս անունը դարձավ հարսանյաց տան անունը, "
              "որ ծնվել է գեղեցիկ զգեստների, անհատականության և ձեռքի աշխատանքի հանդեպ սիրուց։",
    },
    "about_p2": {
        "en": "Inspired by the elegance of past eras, Tiknik reinterprets historical references for the modern "
              "bride. Each dress begins with its own story, shaped by thoughtful design, carefully selected fabrics "
              "and original vintage lace. These rare details bring a sense of history and individuality to garments "
              "made today.",
        "ru": "Вдохновляясь изяществом прошлых эпох, Tiknik переосмысляет исторические мотивы для современной "
              "невесты. Каждое платье начинается со своей истории: продуманный крой, тщательно подобранные ткани "
              "и подлинное винтажное кружево. Эти редкие детали придают вещам, созданным сегодня, ощущение "
              "истории и неповторимости.",
        "hy": "Ոգեշնչվելով անցյալ դարաշրջանների նրբագեղությամբ՝ Tiknik-ը վերաիմաստավորում է պատմական "
              "մոտիվները ժամանակակից հարսնացուի համար։ Յուրաքանչյուր զգեստ սկսվում է իր պատմությամբ՝ "
              "մտածված ձևվածք, խնամքով ընտրված կտորներ և իսկական վինտաժային ժանյակ։ Այս հազվագյուտ "
              "մանրուքները այսօր ստեղծված զգեստներին տալիս են պատմության և անկրկնելիության զգացում։",
    },
    "about_p3": {
        "en": "Tiknik believes a wedding dress should hold meaning beyond a single occasion. Created to make every "
              "woman feel truly special, each piece carries the possibility of becoming a family heirloom.",
        "ru": "Tiknik верит, что свадебное платье должно значить больше, чем один день. Каждая вещь создана, "
              "чтобы женщина почувствовала себя по-настоящему особенной, и может стать семейной реликвией.",
        "hy": "Tiknik-ը հավատում է, որ հարսանյաց զգեստը պետք է նշանակություն ունենա մեկ օրից ավելի։ "
              "Յուրաքանչյուր զգեստ ստեղծված է, որպեսզի կինն իրեն իսկապես յուրահատուկ զգա, և կարող է "
              "դառնալ ընտանեկան մասունք։",
    },
    "about_quote": {
        "en": "Cherished, remembered and passed down through generations.",
        "ru": "Бережно хранимой, памятной и передаваемой из поколения в поколение.",
        "hy": "Խնամքով պահված, հիշվող և սերնդեսերունդ փոխանցվող։",
    },
    "about_alt1": {"en": "As a child, in a dress made for the competition", "ru": "В детстве, в платье, сшитом для конкурса", "hy": "Մանկության տարիներին՝ մրցույթի համար կարված զգեստով"},
    "about_alt2": {"en": "Tiers of silk and vintage lace on an Armenian carpet", "ru": "Ярусы шёлка и винтажного кружева на армянском ковре", "hy": "Մետաքսի և վինտաժային ժանյակի շերտեր հայկական գորգի վրա"},
    "about_alt3": {"en": "A couple embracing under an embroidered veil", "ru": "Пара в объятиях под вышитой фатой", "hy": "Զույգը գրկախառնված ասեղնագործ քողի տակ"},

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
    "cart": {
        "en": "Your request",
        "ru": "Ваш запрос",
        "hy": "Ձեր հարցումը",
    },
    "add_to_cart": {
        "en": "Order this dress",
        "ru": "Заказать это платье",
        "hy": "Պատվիրել այս զգեստը",
    },
    "add_buy": {
        "en": "Order this dress",
        "ru": "Заказать это платье",
        "hy": "Պատվիրել այս զգեստը",
    },
    "add_rent": {
        "en": "Rent for a shoot",
        "ru": "Арендовать для съёмки",
        "hy": "Վարձել նկարահանման համար",
    },
    "in_cart": {
        "en": "In your request ✓",
        "ru": "В запросе ✓",
        "hy": "Հարցման մեջ է ✓",
    },
    "cart_empty": {
        "en": "Nothing here yet. Choose a dress in the collection.",
        "ru": "Здесь пока пусто. Выберите платье в коллекции.",
        "hy": "Այստեղ դեռ դատարկ է։ Ընտրեք զգեստ հավաքածուից։",
    },
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
    "cart_send": {
        "en": "Send request",
        "ru": "Отправить запрос",
        "hy": "Ուղարկել հարցումը",
    },
    "cart_no_signup": {
        "en": "Nothing is paid now. We reply personally within a day to agree size, dates and payment.",
        "ru": "Сейчас ничего не оплачивается. Мы ответим лично в течение дня и согласуем размер, даты и оплату.",
        "hy": "Հիմա ոչինչ չեք վճարում։ Մենք կպատասխանենք անձամբ մեկ օրվա ընթացքում՝ չափսը, ամսաթվերը և վճարումը համաձայնեցնելու համար։",
    },
    "cart_sent": {
        "en": "Thank you! Order №{n} is with us. We'll be in touch shortly.",
        "ru": "Спасибо! Заказ №{n} у нас, скоро свяжемся с вами.",
        "hy": "Շնորհակալություն։ №{n} պատվերը ստացել ենք, շուտով կկապվենք ձեզ հետ։",
    },
    "cart_remove": {"en": "Remove", "ru": "Убрать", "hy": "Հեռացնել"},
    "busy_error": {
        "en": "Too many requests. Please try again in a few minutes.",
        "ru": "Слишком много запросов. Попробуйте через несколько минут.",
        "hy": "Չափազանց շատ հարցումներ, փորձեք մի քանի րոպեից։",
    },

    # Contact links
    "contact_direct": {"en": "Or write to us directly", "ru": "Или напишите нам напрямую", "hy": "Կամ գրեք մեզ անմիջապես"},

    # Prices on cards and in the product view (when an item can be both bought and rented)
    "card_or_rent": {"en": "or rent {p}", "ru": "или аренда {p}", "hy": "կամ վարձույթ {p}"},
    "card_rental": {"en": "for rent", "ru": "в аренду", "hy": "վարձույթով"},

    # Handmade facts in the product view ({n} is a number set per item in /admin)
    "handmade_hours": {
        "en": "About {n} hours of handwork",
        "ru": "Около {n} часов ручной работы",
        "hy": "Մոտ {n} ժամ ձեռքի աշխատանք",
    },
    "edition_one": {"en": "One of a kind", "ru": "Единственный экземпляр", "hy": "Միակ օրինակ"},
    "edition_n": {"en": "Only {n} made", "ru": "Тираж: {n} шт.", "hy": "Ընդամենը {n} օրինակ"},
    "share": {"en": "Share", "ru": "Поделиться", "hy": "Կիսվել"},
    "dial_lang": {"en": "Language", "ru": "Язык", "hy": "Լեզու"},
    "dial_cur": {"en": "Currency", "ru": "Валюта", "hy": "Արժույթ"},
    "toast_added": {
        "en": "Added to your request",
        "ru": "Добавлено в запрос",
        "hy": "Ավելացվեց հարցմանը",
    },
    "toast_view": {
        "en": "View request",
        "ru": "Открыть",
        "hy": "Բացել",
    },
    "pdp_piece": {"en": "The piece", "ru": "Об изделии", "hy": "Զգեստի մասին"},
    "pdp_details": {"en": "Details", "ru": "Детали", "hy": "Մանրամասներ"},
    "pdp_delivery": {"en": "Fittings & delivery", "ru": "Примерки и доставка", "hy": "Փորձեր և առաքում"},
    "link_copied": {"en": "Link copied", "ru": "Ссылка скопирована", "hy": "Հղումը պատճենված է"},

    # Delivery: three facts (all already stated elsewhere on the site)
    # Delivery & shipping section (and the short version in the product view)
    "dl_title": {"en": "Delivery & Shipping", "ru": "Доставка", "hy": "Առաքում"},
    "dl_local_title": {"en": "Local", "ru": "По Армении", "hy": "Հայաստանում"},
    "dl_local": {
        "en": "Brides in Armenia can collect their dresses from our home studio in Yerevan, by appointment, or arrange local delivery. Both options are complimentary.\n\nA final fitting is available before collection. We recommend receiving your dress at least 1–2 weeks before the wedding.",
        "ru": "Невесты в Армении могут забрать платье в нашей домашней студии в Ереване, по предварительной договорённости, или заказать доставку по стране. Оба варианта бесплатны.\n\nПеред тем как забрать платье, можно пройти финальную примерку. Мы советуем получить платье минимум за 1–2 недели до свадьбы.",
        "hy": "Հայաստանում հարսնացուները կարող են զգեստը վերցնել մեր տնային արվեստանոցից Երևանում՝ նախնական պայմանավորվածությամբ, կամ պատվիրել առաքում։ Երկու տարբերակն էլ անվճար են։\n\nՎերցնելուց առաջ հնարավոր է վերջին փորձը։ Խորհուրդ ենք տալիս զգեստը ստանալ հարսանիքից առնվազն 1–2 շաբաթ առաջ։",
    },
    "dl_intl_title": {"en": "Worldwide", "ru": "По всему миру", "hy": "Ամբողջ աշխարհում"},
    "dl_intl": {
        "en": "Tiknik ships worldwide via registered post. Each order is carefully packaged in a protective garment bag, with a box provided when necessary.\n\nA tracking number and all necessary shipping information are provided once the order is dispatched. Estimated delivery time is 10–30 days, depending on the destination.\n\nShipping costs are calculated individually according to the destination and package weight. Customs duties and import taxes, if applicable, are the responsibility of the recipient.\n\nExpress shipping is available upon request at an additional cost.",
        "ru": "Tiknik отправляет заказы по всему миру заказной почтой. Каждый заказ бережно упакован в защитный чехол для одежды, при необходимости в коробку.\n\nПосле отправки вы получаете трек-номер и всю нужную информацию. Срок доставки 10–30 дней, в зависимости от страны.\n\nСтоимость доставки рассчитывается индивидуально по стране и весу посылки. Таможенные пошлины и налоги на ввоз, если они есть, оплачивает получатель.\n\nПо запросу возможна экспресс-доставка за дополнительную плату.",
        "hy": "Tiknik-ը առաքում է ամբողջ աշխարհով՝ պատվիրված փոստով։ Յուրաքանչյուր պատվեր խնամքով փաթեթավորվում է պաշտպանիչ հագուստապարկում, անհրաժեշտության դեպքում՝ տուփում։\n\nՈւղարկելուց հետո տրամադրվում է հետևման համար և առաքման ողջ տեղեկատվությունը։ Առաքման ժամկետը 10–30 օր է՝ կախված երկրից։\n\nԱռաքման արժեքը հաշվարկվում է անհատապես՝ ըստ երկրի և ծանրոցի քաշի։ Մաքսատուրքերը և ներմուծման հարկերը, եթե կան, վճարում է ստացողը։\n\nՊահանջով հնարավոր է էքսպրես առաքում՝ լրացուցիչ վճարով։",
    },
    "dl_pack_title": {"en": "Packaging & care", "ru": "Упаковка и уход", "hy": "Փաթեթավորում և խնամք"},
    "dl_pack": {
        "en": "Dresses are prepared for shipping as close to ready-to-wear as possible. Each order includes care instructions to help preserve the garment and its delicate details.",
        "ru": "Платья готовятся к отправке так, чтобы их можно было надеть почти сразу. К каждому заказу прилагается инструкция по уходу, чтобы сохранить вещь и её тонкие детали.",
        "hy": "Զգեստները առաքման են պատրաստվում հնարավորինս պատրաստ հագնելու վիճակում։ Յուրաքանչյուր պատվերի հետ տրվում են խնամքի հրահանգներ՝ զգեստը և նրա նուրբ մանրուքները պահպանելու համար։",
    },
    "dl_cond_title": {"en": "Conditions", "ru": "Условия", "hy": "Պայմաններ"},
    "dl_cond": {
        "en": "Dispatch dates can be arranged in advance to fit the bride's wedding schedule.\nOnce dispatched, tracking information is provided for every international order.\nIn case of postal issues originating in Armenia, Tiknik will help the customer contact the postal service and resolve the matter.\nImport duties, customs fees and any additional taxes are the responsibility of the recipient.\nTiknik is not responsible for customs delays or charges imposed by the destination country.",
        "ru": "Дату отправки можно согласовать заранее под дату свадьбы.\nДля каждого международного заказа после отправки предоставляется трек-номер.\nЕсли проблема с почтой возникла на стороне Армении, Tiknik поможет связаться с почтовой службой и решить вопрос.\nВвозные пошлины, таможенные сборы и дополнительные налоги оплачивает получатель.\nTiknik не отвечает за задержки на таможне и сборы, установленные страной назначения.",
        "hy": "Առաքման ամսաթիվը կարելի է նախապես համաձայնեցնել հարսանիքի ժամանակացույցով։\nՅուրաքանչյուր միջազգային պատվերի համար ուղարկելուց հետո տրամադրվում է հետևման համար։\nԵթե փոստային խնդիրը ծագել է Հայաստանում, Tiknik-ը կօգնի կապվել փոստային ծառայության հետ և լուծել հարցը։\nՆերմուծման տուրքերը, մաքսային վճարները և լրացուցիչ հարկերը վճարում է ստացողը։\nTiknik-ը պատասխանատվություն չի կրում նպատակակետ երկրի մաքսային ուշացումների կամ վճարների համար։",
    },
    "delivery_f1_title": {"en": "Armenia", "ru": "Армения", "hy": "Հայաստան"},
    "delivery_f1_text": {
        "en": "Free collection from our home studio in Yerevan, by appointment, or local delivery, with a final fitting before collection.",
        "ru": "Бесплатно: забрать в нашей студии в Ереване по договорённости или доставка по стране, с финальной примеркой.",
        "hy": "Անվճար՝ վերցնել մեր արվեստանոցից Երևանում՝ պայմանավորվածությամբ, կամ առաքում, վերջին փորձով։",
    },
    "delivery_f2_title": {"en": "Worldwide", "ru": "По всему миру", "hy": "Ամբողջ աշխարհում"},
    "delivery_f2_text": {
        "en": "Registered post with tracking, 10–30 days. Shipping is calculated individually; express on request.",
        "ru": "Заказной почтой с трек-номером, 10–30 дней. Стоимость рассчитывается индивидуально; экспресс по запросу.",
        "hy": "Պատվիրված փոստով՝ հետևման համարով, 10–30 օր։ Արժեքը հաշվարկվում է անհատապես, էքսպրեսը՝ ըստ պահանջի։",
    },
    "delivery_f3_title": {"en": "Remote fittings", "ru": "Удалённые примерки", "hy": "Հեռավար փորձեր"},
    "delivery_f3_text": {
        "en": "Abroad, every stage is shared online: measurements, photos and videos of fabrics and fittings.",
        "ru": "Из другой страны всё проходит онлайн: мерки, фото и видео тканей и примерок на каждом этапе.",
        "hy": "Արտերկրից ամեն ինչ առցանց է՝ չափսեր, կտորների և փորձերի լուսանկարներ ու տեսանյութեր։",
    },

    # Footer
    "handmade_in": {"en": "Handmade in Yerevan", "ru": "Сшито вручную в Ереване", "hy": "Ձեռքով կարված Երևանում"},
    "hours_label": {"en": "Open", "ru": "Часы работы", "hy": "Աշխատում ենք"},

    "hero_line": {
        "en": "One dress, one bride. Sewn by hand in Yerevan.",
        "ru": "Одно платье, одна невеста. Сшито вручную в Ереване.",
        "hy": "Մեկ զգեստ՝ մեկ հարսի համար։ Ձեռքով կարված Երևանում։",
    },
    "made_to_order": {
        "en": "Made to order",
        "ru": "Шьётся под заказ",
        "hy": "Կարվում է պատվերով",
    },
    "vintage_lace": {
        "en": "Vintage lace, {era}",
        "ru": "Винтажное кружево, {era}",
        "hy": "Վինտաժային ժանյակ, {era}",
    },
    "pdp_note": {
        "en": "Made to order for you. Nothing is paid now; we reply personally within a day.",
        "ru": "Шьётся под заказ для вас. Сейчас ничего не оплачивается, мы ответим лично в течение дня.",
        "hy": "Կարվում է պատվերով՝ ձեզ համար։ Հիմա ոչինչ չեք վճարում, կպատասխանենք անձամբ մեկ օրվա ընթացքում։",
    },
    "prices_in": {
        "en": "Prices in {cur}",
        "ru": "Цены в {cur}",
        "hy": "Գները՝ {cur}",
    },
    "prefs_change": {
        "en": "change",
        "ru": "изменить",
        "hy": "փոխել",
    },
    "prefs_done": {
        "en": "Done",
        "ru": "Готово",
        "hy": "Պատրաստ է",
    },
    "cart_size": {"en": "Size", "ru": "Размер", "hy": "Չափս"},
    "size_error": {
        "en": "Choose a size for each rental.",
        "ru": "Выберите размер для каждой аренды.",
        "hy": "Ընտրեք չափսը յուրաքանչյուր վարձույթի համար։",
    },
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
        "en": "Thank you. We've received your request and will be in touch shortly.",
        "ru": "Спасибо! Мы получили вашу заявку и скоро свяжемся с вами.",
        "hy": "Շնորհակալություն։ Ձեր հայտը ստացել ենք և շուտով կկապվենք ձեզ հետ։",
    },
    "send_error": {
        "en": "Couldn't send. Check your connection and try again, or write to us on Instagram.",
        "ru": "Не удалось отправить. Проверьте соединение и попробуйте ещё раз или напишите нам в Instagram.",
        "hy": "Չհաջողվեց ուղարկել։ Ստուգեք կապը և փորձեք կրկին կամ գրեք մեզ Instagram-ում։",
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
    "card_or_rent", "card_rental", "collection", "pdp_piece", "pdp_details", "pdp_delivery", "toast_added", "toast_view", "cart_size", "size_error", "made_to_order", "vintage_lace", "pdp_note", "prices_in", "prefs_change", "dial_lang", "dial_cur",
    "delivery_f1_title", "delivery_f1_text", "delivery_f2_title", "delivery_f2_text", "delivery_f3_title", "delivery_f3_text",
    "handmade_hours", "edition_one", "edition_n", "share", "link_copied",
    "price_on_request", "per_day", "mode_Rent", "mode_Sale", "mode_Both", "mode_Custom",
    "load_error", "sending", "sent", "send_error", "required_error",
)


def translator(lang):
    return lambda key: UI[key].get(lang) or UI[key]["en"]
