import { md5 } from "../../library/md5.wasm.min.js";
import { ScrollElementWithMouse, Sleep } from "../../modules/functions.js";
import { GraphQl } from "../../modules/ShikiAPI.js";
import { TCache } from "../../modules/tun.cache.js";
import { TInfo, TSearchType, TTSearch } from "./mod_search.js";

const setup = {
    showing: ["genre", "theme"],
    censored: [9, 539, 12, 105, 33, 133, 129, 34],
    ru: {
        "genre": "жанр",
        "theme": "тема",
        "demographic": "аудитория"
    },
    descriptio: {
        198: "В таких историях традиционное повествование получает своеобразную трактовку, поскольку в центре внимания оказывается женский персонаж, изображаемый злодейкой. В произведениях исследуются причины поступков главной героини, мотивы и личностный рост. Часто в тайтле бросается вызов стереотипам и предлагается новый взгляд на сложных персонажей, их выбор и путь к искуплению или самопознанию. Авторы предлагают нам взглянуть на мир под другим углом и сопереживать персонажам, которые могут оказаться не такими, какими кажутся на первый взгляд.",
        10: "В фэнтизийных аниме и манге часто встречаются элементы фольклора, чаще всего западноевропейского, но нередко используется и колорит Востока, и элементы японской и китайской мифологии. Основное действие происходит в вымышленном мире со сказочными существами. Непременный атрибут фэнтези - магия и волшебство.<br>Характерное отличие этого жанра состоит в том, что особенности этого мира и существование вымышленных существ не объясняются с научной точки зрения, а являются нормой.",
        5: "Произведения раздвигают границы традиционного и общепринятого повествования. Эти истории носят новаторский, экспериментальный характер и часто бросают вызов общепринятым нормам. В них могут использоваться нетрадиционные приёмы повествования, уникальные художественные стили, абстрактные и заставляющие задуматься темы. Авангардный жанр — это творчество и раздвижение границ возможного в истории, предлагающее зрителям свежий и уникальный опыт, который может быть нетрадиционным, но при этом глубоким по смыслу и заставляющим задуматься. Такие произведения часто вызывают тревожные чувства, поскольку отвергают традиционные способы восприятия мира.",
        7: "В основе таких историй лежат загадочные и интригующие события. В произведении всегда присутствует проблема или преступление, которое необходимо раскрыть. Персонажи сосредоточены на сборе улик, выявлении подозреваемых и теоретизировании возможных сценариев произошедшего, для того чтобы собрать части замысловатого пазла воедино и раскрыть тайну. Открывшаяся правда становится основанием для поимки преступника или способом разрешения сложившейся ситуации.<br>Почти всегда зрители располагают той же информацией, что и главные герои, и предвкушение при просмотре направлено на поиск объяснения, а не на то, что произойдет после того, как ответ будет найден.",
        117: "Жанр, нацеленный вызвать у зрителя внезапный прилив эмоций, чувство тревоги, возбуждение. Жанр не имеет чётких границ, элементы триллера присутствуют во многих произведениях разных жанров.",
        30: "Этот жанр аниме или манги целиком посвящён достижениям персонажей в определённом виде спорта. Чаще всего сюжет вращается вокруг одной спортивной команды (зачастую школьной), которая, благодаря высокой мотивации и труду, постепенно побеждает всех соперников.<br>Основная цель  – показать, что если есть сильное желание и интерес, то человек непременно добьётся успеха независимо от таланта.",
        2: "Приключенческие произведения — это захватывающие и увлекательные истории, в которых герои отправляются в путешествие по неизведанным местам, сталкиваясь по пути с трудностями и препятствиями. В таких тайтлах зачастую есть какая-то цель в виде квеста или миссии, которую необходимо выполнить. Миссия может быть связана с поиском сокровищ, исследованием неизведанных земель или борьбой со злодеями. Приключенческие сюжеты увлекают зрителей неизвестностью и смелостью героев, отправляющихся в путешествие полное опасностей.",
        539: "В эротических произведениях основное внимание уделяется сексуальным отношениям между персонажами. Сюжеты состоят из романтических и интимных отношений между героями и могут содержать сцены откровенного сексуального содержания (но без прямой демонстрации самого акта совокупления). Жанр рассчитан на взрослую аудиторию, которой интересны истории о чувственности, желании и страстных отношениях. Эротика призвана возбудить читателя или зрителя, предлагая откровенное и интимное исследование человеческих отношений и желаний. В связи с этим необходимо, чтобы зритель или читатель знал о содержании жанра и подходил к нему с определенной степенью эмоциональной и физической зрелости.",
        142: "Приоритет в таких тайтлах отдаётся художественным представлениям и живым выступлениям. В центре внимания следующие формы исполнительного искусства — театр, танцы, музыка и другие виды живого исполнения. В произведениях исследуется творчество, самовыражение и эмоции исполнителей, выступающих на сцене. Такие истории предлагают заглянуть в мир репетиций, премьер и связи между исполнителями и их зрителями. Будь то мюзикл, танцевальный концерт или спектакль — произведение подчеркивает красоту и силу живого исполнения как формы повествования и самовыражения.",
        102: `Поджанр "спорта", связанный с соревновательными видами спорта, в которые играют группы спортсменов. В произведениях рассказывается о командной работе, товариществе и проблемах, с которыми сталкиваются игроки в процессе совместной работы над достижением победы. Будь то баскетбол, футбол, бейсбол или другой командный вид спорта, этот поджанр передает захватывающий дух игры, динамику взаимоотношений между членами команды и самоотдачу, необходимую для достижения успеха. Такие тайтлы воспевают дух сотрудничества, целеустремленность и спортивный азарт, предлагая любителям командных спортивных состязаний увлекательный и захватывающий опыт.`,
        32: `Основные персонажи этого жанра - упыри, вурдалаки,  стригои, ламии, веталы и т.д. Герои могут быть разными. Они вечно живут, боятся света, чеснока и креста, но при этом они сильные, безумные, не отражающиеся в зеркалах, трагичные, смешные, но все как один желающие одного - крови.`,
        40: `Основная цель такого аниме или манги  - показать, как работает человеческая психология. Самый популярный сюжет -  как сообразительный персонаж использует знание психологии, чтобы добиться собственных целей.`,
        119: `Cute girls doing cute things, дословный перевод — "милые девушки делают милые вещи". В таких произведениях, демонстрируется очаровательное и трогательное взаимодействие между женскими персонажами. Эти истории посвящены повседневным делам и очаровательным моментам дружбы, веселья и общения. Сюжеты зачастую восхищают миловидностью и невинностью персонажей, создают приятную атмосферу, согревающую сердца зрителей, и дающие расслабление и удовольствие, воспевая простые радости жизни через умилительные взаимоотношения и приключения милых женских персонажей.`,
        17: `Боевые искусства — системы единоборств и самозащиты различного происхождения. Основная аудитория - мальчики, юноши и просто любители единоборств. Центральная линия сюжета – изучение какого-то вида боевого искусства. Особое внимание уделяется развитию навыков и росту силы персонажей. С помощью своих выдающихся способностей герои расправляются с врагами, побеждают в соревнованиях.`,
        29: `Большинство событий таких произведений происходит в космическом пространстве и за его пределами. Тайтлы про космос исследуют чудеса Вселенной, демонстрируя космические путешествия, футуристические технологии и встречи с внеземными существами.`,
        31: `В аниме и манге этого жанра герои наделены повышенными физическими возможностями. Природа супер силы может носить фантастический или мистический характер. Супер способности могут быть как врожденной чертой носителя - инопланетного пришельца, мистического существа и т.п., так и приобретенными обычными людьми в результате, например, воздействия какого-либо фактора, взаимодействия с каким-либо предметом или же увеличение силы физической достигается путем приложения силы духовной. Супер сила может быть постоянной характеристикой носителя или проявляться при необходимости.`,
        3: `Произведения такого толка представляют собой быстро развивающиеся и захватывающие сюжеты, основанные на гоночных соревнованиях. Это может быть гонка на автомобилях, мотоциклах, велосипедах или даже с участием животных. Отличительной чертой гонок является экспоненциальное адреналиновое воздействие от старта к финишу. Основной акцент в тайтлах делается на скорости, мастерстве и стремлении к победе. В гоночных историях зачастую присутствуют напряжённое соперничество, смелые маневры и желание победить.`,
        103: `В данных произведениях видеоигры могут быть как основным элементом сюжетной линии, так и сеттингом, в котором находятся персонажи.`,
        136: `Истории этих произведений происходят в индустрии развлечений. В тайтлах зачастую рассказывается о жизни актеров, музыкантов, исполнителей и о тех трудностях, с которыми они сталкиваются в погоне за славой и успехом. Сюжеты затрагивают темы амбиций, творчества, блеска и гламура шоу-бизнеса. Будь то драмы за кулисами, захватывающие живые выступления или динамика жизни знаменитостей, шоу-бизнес предлагает взглянуть с изнанки на увлекательный и порой сложный мир развлечений.`,
        105: `Жестокость представляет собой откровенные сцены насилия, кровопролития и ужасов. В таких историях зачастую присутствуют впечатляющие и жуткие изображения травм, увечий и других неприятных элементов. Произведения с жестокостью ориентированы на создание чувства страха, шока и напряженности, и они не рекомендуются для просмотра лицам, чувствительным к подобному графическому содержанию (слабонервным, несовершеннолетним и беременным).`,
        146: `Герои вовлечены в напряженные и рискованные игры или соревнования. В этих играх на кон часто ставится очень многое, например, большие суммы денег, жизнь или судьба мира. Произведение часто фокусируется на моментах, наполненных адреналином, принятии стратегических решений и психологических битвах, которые происходят между персонажами. Главным героям приходится преодолевать сильное давление, соперничество и неожиданные повороты, стремясь к победе или выживанию.`,
        111: `Персонажи отправляются в прошлое или будущее, переживая различные временные периоды, исторические события и «временные петли». По мере повествования поднимаются темы, что было бы, если бы человек мог изменить ход истории или увидеть, каким мог бы быть мир в будущем. В ходе путешествий во времени зритель наблюдает, как действия персонажей влияют на прошлое, настоящее и будущее.`,
        11: `Персонажи вступают в интеллектуальные поединки, в которых они используют ум, смекалку и стратегическое мышление, чтобы обойти соперника. Сюжеты таких произведений наполнены головоломками и запутанными ситуациями, заставляющими зрителей следить за тем, как герои разрабатывают хитроумные планы и парируют действия друг друга.`,
        131: `В данных тайтлах фигурируют герои-бунтари, доставляющие массу хлопот. Эти герои часто нарушают правила, ведут себя рискованно или вовлекаются в противоправную деятельность. В произведениях описываются драки, дружеские отношения героев-бунтарей и личностный рост, когда персонажи выходят из сложных жизненных ситуаций. Тема позволяет заглянуть в жизнь героев, не всегда следующим нормам права и морали, и показать какие последствия имеют их поступки. В некоторых произведениях показывается возможность искупления совершённых ранее действий и изменения жизненного уклада главных героев.`,
        130: `Поджанр "фэнтези", в котором главный герой попадает или перерождается в другом мире. Будь то фантастическое королевство, мир видеоигры или альтернативное измерение. Обычно в таких мирах присутствует магия или другая потусторонняя сила, которыми владеет подавляющее большинство персонажей, в том числе и главный герой. Сюжет зачастую повествует об адаптации к новому миру, о приключениях главного героя с новыми напарниками.`,
        197: `В данных произведениях присутствуют магические или сверхъестественные элементы, сочетающиеся с современной, повседневной городской обстановкой. Зачастую фигурируют такие персонажи, как маги, вампиры или иные мифические существа, живущие рядом с обычными людьми. В тайтлах поднимается вопрос, как магия и фэнтези вписываются в суетливую городскую жизнь, смешивая фантастическое с привычным. Это смесь приключений, мистики и воображения, где волшебный мир скрывается прямо под поверхностью нашего собственного.`,
        14: `Такие произведения наполнены саспенсом, жуткими элементами, призванными вызвать чувство страха и ужаса. Зрителя пугают различными способами: начиная домами с привидениями, скримерами и сверхъестественными существами, заканчивая проецированием подсознательных страхов человека в виде образов на экране. Жанр ужасов исследует самые тёмные стороны человеческого сознания, заставляя зрителя при просмотре находиться на краю своего кресла и оборачиваться от каждого шороха.`,
        36: `Основная цель таких аниме или манги - художественно, и в то же время максимально достоверно, рассказать о повседневных проблемах. В центре повествования будничная жизнь нескольких человек определенного возраста, чаще всего это школьники.
Обычно аниме состоит из нескольких маленьких новелл, где описаны сцены или ситуации, в которые можно попасть в реальной жизни. В повседневности есть и место комедии – тогда главные герои постоянно оказываются в череде нелепых и комических ситуаций.
Повседневность считается самым трудным жанром, поэтому требует от мангак, режиссёров и сейю высшего пилотажа и профессионализма.`,
        24: `Жанр, характеризуемый использованием фантастического допущения, «элемента необычайного», нарушением границ реальности, принятых условностей. Фантастическое допущение, или фантастическая идея — основной элемент жанра фантастики. Он заключается во введении в произведение фактора, который не встречается или невозможен в реальном мире.`,
        37: `Жанр, где основной акцент делается на сверхъестественных и необъяснимых явлениях. Непременные персонажи этого жанра - вампиры, призраки, духи, демоны. Наиболее популярен японский фольклор, отражающий буддийско-синтоистское представление о мире, в которое местами вкрапляются элементы христианства.`,
        12: `Хентайные аниме и манга рассчитаны в основном на мужскую аудиторию. Отличительная черта хентая - наличие эротических и сексуальных сцен. Иными словами, это нарисованное порно. Поскольку такое аниме создается для определенной, узкой аудитории, качество графики часто бывает низким, а сам хентай обычно выпускается в формате OVA. Чаще всего изображаются гетеросексуальные отношения.
Для этого жанра характерны демонстрации различных видов сексуальных отклонений: изнасилование, проявление жестокости, межвидовые связи, к примеру, когда героиню насилуют тентакли (также щупальца, лат. tentacula) и т.д.`,
        20: `В пародийных аниме или манге обычно высмеиваются другие жанры при помощи гротеска и сатиры. Характерные черты определенного жанра или жанров гиперболизируются и доводятся до абсурда.`,
        135: `В данных произведениях персонажи подвергаются сверхъестественной или магической трансформации, изменяющей их биологический пол.`,
        107: `Поджанр "романтики" в котором исследуются сложности и запутанность романтических отношений. Как правило, в произведениях участвуют несколько персонажей, романтически связанных друг с другом, создавая паутину безответной любви, запретного влечения и сложных эмоциональных связей. Тайтлы посвящены взлетам и падениям, радостям и страданиям любви, изучению того, как выбор и поступки каждого героя влияют на их взаимосвязанные отношения. В произведениях зачастую присутствуют запутанные сюжетные линии, драматические повороты и эмоциональные конфликты, в которых персонажи ориентируются в своей переплетённой любовью жизни и ищут счастье среди хаоса.`,
        141: `В основе таких тайтлов – сюжет о том, как персонажи попадают в экстремальные, часто опасные для жизни ситуации и должны использовать свою смекалку, навыки и решимость, чтобы остаться в живых. Как правило, в таких историях герои оказываются в дикой местности, сталкиваются со стихийными бедствиями или перемещаются по постапокалиптическому миру. Зачастую в произведениях исследуются темы стойкости, находчивости, преодоления трудностей. Истории выживания полны напряжения, опасности, борьбы за удовлетворение основных потребностей, таких как еда, кров и безопасность, что делает их захватывающим и часто душераздирающим произведением для просмотра.`,
        144: `В данных произведениях один или несколько главных героев одеваются в одежду, ассоциирующуюся с противоположным полом. Эти персонажи могут исследовать свою идентичность, пытаться достичь определенных целей или просто развлекаются в различных нарядах, получая от этого наслаждение. Тайтлы зачастую включают в себя юмор, недоразумения по поводу пола персонажа, и личностный рост, когда герои справляются со своими переживаниями, бросая вызов традиционным гендерным нормам. Затрагиваются вопросы самовыражения и принятия человека таким, какой он есть.`,
        18: `Это научно-фантастический жанр, отличительной чертой которого являются человекоподобные машины, чаще всего используемые в бою. Главными героями являются персонажи, управляющие этими роботами изнутри. Основной акцент делается на контакте и синхронизации людей и машин. Характерной чертой меха является детальное описание запуска такой машины и взаимодействие с ней.`,
        23: `Поскольку жанр посвящен всему, что связано со школой, основной аудиторией являются подростки. Главный акцент делается на школьных проблемах, включая взаимоотношения со сверстниками, родителями и учителями, становление личности и самоопределение. Основное действие происходит в клубах, поездках, на фестивалях и т.д.`,
        35: `Аниме или манга этого жанра имеют черты комедийного и романтического характера и рассчитаны на широкую аудиторию. Обычно по сюжету главный герой вовлечен в любовные истории с более чем 3 представителями противоположного пола. Основное внимание чаще всего уделяется выяснению отношений между персонажами.`,
        13: `Этот жанр рассчитан на широкую аудиторию. Действия в аниме и манге связаны с определёнными историческими событиями. Чаще всего это эпизоды из истории Западной Европы, Японии или Китая. Описываемые действия могут соответствовать реальности или быть вымышленными.`,
        150: `Главными героями таких тайтлов являются молодые мужчины, которые следуют по пути становления поп-идолов или звезд. Эти истории рассказывают об их внутренней борьбе, росте и успехах в конкурентном мире развлечений. В произведениях зачастую затрагиваются темы дружбы, упорного труда и стремления к мечте, когда герои вместе создают музыку, выступают на сцене и завоевывают сердца поклонников. Произведения такого толка демонстрируют талант, самоотверженность и трудности славы, позволяя заглянуть в жизнь и чаяния кумиров-мужчин на их пути к звездной славе.`,
        139: `В таких произведениях поднимаются вопросы, взаимоотношений и проблем сотрудников, возникающих в процессе их работы, карьеры и общения с коллегами. Будь то офис, школа, суд, ресторан или любое другое рабочее место, такие тайтлы позволяют взглянуть на ежедневные взлеты и падения, успехи и трудности, с которыми сталкиваются персонажи в профессиональной деятельности.`,
        114: `Произведения, получившие признание и престижные награды в конкурсах за их исключительное качество, креативность и воздействие на аудиторию. В качестве примера можно привести следующие мероприятия, на которых происходит церемония награждения аниме-произведений: Tokyo Anime Award, Japan Media Arts Festival, Animation Kobe Awards.`,
        112: `Комедийные произведения, в которых значительную роль играют визуальные шутки, основанные на очевидной нелепости происходящего.`,
        118: `Поджанр "спорта", в котором повествуется о состязательных физических видах спорта, спортсмены используют боевые приемы и навыки для участия в соревнованиях. Произведения демонстрируют напряженные бои один на один, стратегию противников и атлетизм. Будь то бокс, ММА, борьба или другие боевые искусства, единоборства предлагают захватывающие и полные адреналина сюжеты, в которых персонажи сталкиваются на ринге или на ковре. Такие тайтлы подчеркивают самоотверженность, тренированность и целеустремленность спортсменов, стремящихся к победе в мире боевых видов спорта.`,
        104: `В таких произведениях представлены истории, уделяющие внимание преимущественно взрослым персонажам. Произведения могут охватывать широкий спектр тем, от романтики до драмы, предлагая повествования, которые находят отклик у взрослой аудитории и отражают опыт и эмоции взрослых персонажей.`,
        138: `Произведения демонстрируют преступную деятельность, осуществляемую высокоструктурированными и влиятельными группировками. К таким группам могут относиться мафиозные семьи, наркокартели и другие организованные преступные организации. Сюжеты часто посвящены внутреннему устройству этих групп, их стратегиям, конфликтам и персонажам внутри группировок. Исследуется тёмная сторона общества, показывая сложности преступной жизни и усилия правоохранительных органов по борьбе с такими организациями.`,
        33: `это жанр аниме и манги, который сосредоточен на романтических и/или сексуальных отношениях между мужчинами. Он ориентирован в основном на женскую аудиторию и часто содержит драматические или эмоциональные элементы.`,
        4: `Комедийные аниме и манга рассчитаны на широкую аудиторию. Основная цель комедии - развеселить и дать возможность отдохнуть, что вовсе не исключает поднятия философских вопросов или привнесение весьма жесткой сатиры. Здесь можно увидеть шутки, насмешки, забавные ситуации, весьма своеобразных персонажей, игру слов. Комедия бывает как самостоятельным жанром, так и "украшением" других.`,
        9: `Этти в основном рассчитан на мужскую аудиторию. Это один из подвидов хентая. В аниме и манге мужчины изображаются сильными и мускулистыми, а женщины одарены подчёркнуто соблазнительными формами. Основная цель жанра - намекнуть зрителю на недвусмысленные отношения героев.
В этти часто можно увидеть белье персонажей и некоторые оголенные части тела. Сексуальные сцены в таком аниме отсутствуют, но есть сцены с эротическим содержанием и романтические чувства по отношению к персонажам противоположного пола.
Главным отличием этти от хентая является отсутствие демонстрации половых отношений; в этти присутствует лишь намек на таковые.`,
        1: `Этому жанру свойственна динамичность и быстрое развитие событий. Сюжет построен на сильном эмоциональном напряжении, ему характерен накал страстей и резкие спады.`,
        22: `В аниме и манге данного жанра акцент делается на близких взаимоотношениях между героями, а также трудностях и препятствиях на их пути.
Чувства могут быть как между девушкой и парнем, так и между девушкой и девушкой, парнем и парнем. На протяжении всего произведения зритель сопереживает злоключениям героев, радуется их успехам, ненавидит, когда, например, парень не выбрал понравившегося персонажа, а кого-то другого.
Романтической линии может отводиться и второстепенная роль, основной целью которой является лишь желание вызвать мечтания у зрителя о той или иной паре.`,
        543: `В произведениях описывается процесс приготовления и употребления пищи или напитков, а повествование составлено таким образом, чтобы показать множество существующих различных блюд и напитков. Уделяется пристальное внимание каждому этапу процесса готовки пищи — от подробного описания рецептов до демонстрации того, что чувствуют персонажи, когда пробуют готовое блюдо.`,
        133: `это поджанр аниме и манги, который фокусируется на романтических отношениях между мужчинами, но без откровенных сцен. В отличие от яоя, где могут присутствовать интимные моменты, сёнен-ай делает упор на чувства, эмоции, развитие отношений и драму.`,
        8: `В драматических аниме или манге основной акцент делается на игре сильных чувств, глубоких противоречиях и конфликтах, трудноразрешимых проблемах, которые нередко имеют непоправимые последствия. Драме свойственна трагичность, но может быть и счастливый конец.`,
        129: `это жанр аниме и манги, который фокусируется на романтических отношениях между девушками, но без откровенных сцен. В отличие от юри, который может включать интимные моменты, сёдзё-ай делает упор на эмоциональную связь, развитие чувств и романтику.`,
        134: `Сюжеты такого толка повествуют о радостях, трудностях и приключениях, связанных с уходом за детьми. Эти истории часто посвящены опыту родителей, воспитателей или лиц, ответственных за присмотр за детьми. Произведения исследуют динамику семейной жизни, юмористические и душевные моменты, а также ценные уроки, полученные при воспитании и уходе за малышами. Такие тайтлы предлагают заглянуть в мир воспитания детей и тех значимых связей, которые образуются между воспитателями и детьми, о которых они заботятся.`,
        148: `В таких произведениях уделяют особое внимание нашим любимым компаньонам-животным. В них повествуется о радостях и проблемах, связанных с наличием домашних животных, даётся познавательная информация об уходе за питомцами. Зачастую присутствуют истории о дружбе, преданности и особой связи между человеком и животным.`,
        143: `Главными действующими лицами произведений являются животные или предметы, которые обладают человекоподобными качествами или характеристиками. В тайтлах представлен мир, в котором животные или предметы могут говорить, думать и вести себя как люди. Персонажи часто имеют человеческие черты характера, носят одежду и занимаются теми же видами деятельности, что и люди.`,
        38: `В произведениях данного жанра демонстрируется функционирование различных воинских формирований от исторически достоверных армий, до отряда наемников или группы пилотов боевых роботов. Как правило, присутствуют боевые столкновения от индивидуальных схваток, до широкомасштабных сражений армий большой численности. Так же основной акцент в произведении может быть сделан на демонстрации военной техники, оружия, различных тактических приемов или на гуманитарный аспект последствий войн.`,
        145: `В основе произведений лежат сюжеты о девушках, которые стремятся стать поп-идолами или знаменитостями. Эти истории рассказывают о жизненном пути девушек, которые следуют по пути становления идолом через прослушивания, обучение и трудности в индустрии развлечений. В тайтлах регулярно поднимаются темы дружбы, упорного труда и достижения мечты, когда героини вместе работают над созданием музыки, выступают на сцене и добиваются популярности. Произведения такого толка прославляют талант, целеустремленность и гламурный, но требовательный мир шоу-бизнеса, предлагая взглянуть изнутри на жизнь и устремления начинающих кумиров.`,
        106: `В этих произведениях персонажи перерождаются в новой жизни после того, как их предыдущие жизни заканчиваются. В сюжетах рассматриваются темы второго шанса, личностного роста, а также идея о том, что наши поступки в одной жизни могут повлиять на следующую. Главные герои перерождаются в фэнтезийном мире, в исторической эпохе или в современном мире, зачастую при этой реинкарнации персонажи заново открывают прошлые воспоминания и решают проблемы новой жизни. Такие тайтлы затрагиваюют вопросы судьбы, предназначения и непреходящей природы человеческого духа, предлагающий новый взгляд на жизнь и личность через призму реинкарнации.`,
        147: `В таких тайтлах события происходят в медицинской среде, а главными действующими лицами являются врачи, медсёстры или другие медицинские работники. Истории посвящены медицинским процедурам, уходу за пациентами и трудностям работы в больнице или клинике. Произведения затрагивают темы сострадания, командной работы и этических дилемм, с которыми сталкиваются медицинские работники. Медицина — это и драматические операции, и личная жизнь медицинского персонала, и постоянные проверки вышестоящих организаций, всё это дает представление о мире здравоохранения и о людях, которые посвящают свою жизнь спасению людей.`,
        21: `Главными героями этого аниме или манги являются самураи. Большое внимание уделяется самурайскому кодексу чести – бусидо - и подвигам, и приключениям самураев. Действие обычно происходит на историческом фоне. Иногда основными действующими лицами являются ниндзя.`,
        151: `В таких произведениях есть акцент на тонких и скрытых романтических темах в сюжете, романтической напряженности или намёков на возможные романтические отношения между персонажами. Повествование на первый взгляд может казаться романтическим, но не является таковым.  В таких сюжетах присутствует одна или несколько главных пар, которые, как кажется, испытывают романтический интерес друг к другу, и их отношения будут занимать центральное место в основном сюжете. Однако, несмотря на то, что по сюжету пара будет переживать душевные или неловкие моменты, эти встречи не приведут к какому-либо существенному романтическому развитию, и герои не будут стремиться углубить отношения за определенную грань. К ранним признакам романтического подтекста можно отнести отсутствие эмоциональной сквозной линии (отсутствие личной рефлексии, позволяющей персонажам разобраться в своих чувствах и поделиться ими со зрителем) и отсутствие конфликта, углубляющего или разрывающего отношения. Почти всегда романтический подтекст относится к жанру комедии, и сюжеты таких историй направлены на то, чтобы вызвать у зрителей положительные эмоции или развеселить их.`,
        124: `Поджанр "сёдзе", в произведениях которого содержатся истории о девушках, которые превращаются в волшебных героев (девочек-волшебниц) с особыми способностями, чтобы бороться со злыми силами. В этих сюжетах обычно поднимаются темы дружбы, мужества, борьбы добра со злом. Девочки-волшебницы используют свои способности для защиты мира от страшных угроз, а сам поджанр зачастую сочетает в себе элементы фэнтези, сёдзе и приключений. Этот поджанр известен яркими и захватывающими сюжетами в произведениях, которые нравятся широкому кругу зрителей и в которых часто фигурируют сильные женщины, вдохновляющие зрителей своей смелостью и решительностью.`,
        149: `Цель образовательных произведений проинформировать, научить или дать ценные знания аудитории. В тайтлах зачастую затрагиваются различные концепции, жизненные уроки или исторические события. Такие сюжеты стремятся увлечь и просветить зрителя, предлагая ему информацию, способную расширить его представление о различных предметах.`,
        140: `Поджанр "повседневности", целью которого является умиротворение зрителей. Здесь нет острых конфликтов, погони за достижениями или романтических переживаний. Герои живут размеренной жизнью, созерцают красоту мира и радуются мелочам вроде хорошей погоды и вкусного тортика к чаю. А небольшие безобидные приключения и редкие мрачноватые, располагающие к философским размышлениям моменты разбавляют идиллию и не дают зрителям заскучать.`,
        19: `В аниме или манге рассказывается о музыке и музыкантах, трудностях достижения музыкальной мечты и музыкальной карьеры.`,
        6: `Такие истории черпают вдохновение в многочисленных древних сказаниях, легендах и фольклоре. В сюжетах зачастую фигурируют боги, духи, волшебные существа и герои мифов. В произведениях рассказывается о мистических приключениях, героических поступках и фантастических мирах. Мифология познакомит вас с миром ёкаев, сражениями между божествами и легендарными существами мифологии.`,
        137: `Сюжеты в произведениях посвящены миру аниме, манги и японской поп-культуры. В центре сюжета — персонажи, которые являются страстными поклонниками этих видов искусства и погружаются в различные аспекты фэндома. Они часто демонстрируют свою любовь к аниме и манге, занимаясь косплеем, создавая аниме или мангу (профессионально или с друзьями), посещая конвенции, собирая атрибутику и участвуя в фан-сообществах. Этот жанр находит отклик у тех, кто глубоко ценит японскую поп-культуру и её влияние на мировую индустрию развлечений.`,
        39: `В основе таких историй лежат загадочные и интригующие события. В произведении всегда присутствует проблема или преступление, которое необходимо раскрыть. Главными героями произведений являются профессиональные детективы (полицейские, частные детективы, следователи). Персонажи сосредоточены на сборе улик, выявлении подозреваемых и теоретизировании возможных сценариев произошедшего, для того чтобы собрать части замысловатого пазла воедино и раскрыть тайну. Открывшаяся правда становится основанием для поимки преступника или способом разрешения сложившейся ситуации.

Почти всегда зрители располагают той же информацией, что и главные герои, и предвкушение при просмотре направлено на поиск объяснения, а не на то, что произойдет после того, как ответ будет найден.`,
        108: `Приоритет в таких тайтлах отдаётся художественному самовыражению, творчеству и уникальным визуальным стилям. Персонажи в этих произведениях изучают исторически сложившиеся устойчивые формы искусств (рисунок, живопись, фотография, скульптура, керамика, каллиграфия), а затем создают объекты одной из форм искусств, используя профессиональные инструменты.`,
        125: `В реверс-гареме одна женщина окружена как минимум несколькими мужчинами, который проявляют к её персоне романтический интерес. В произведениях фигурирует разнообразная группа привлекательных и обаятельных парней, каждый из которых обладает своими уникальными чертами характера. По мере того как главная героиня общается с ними, отношения развиваются, и зрители получают возможность увидеть смесь романтики, юмора и драмы.`,
        34: `это жанр аниме и манги, который фокусируется на романтических и/или сексуальных отношениях между девушками. В отличие от сёдзё-ай, который делает упор на платоническую или романтическую сторону отношений, юри может включать как глубокую эмоциональную связь, так и откровенные сцены.`
    }
}

export function GenreInfo(id) {
    return setup.descriptio[id];
}

export async function LoadGenres() {
    const data = await loadGenres();



    requestAnimationFrame(() => {
        for (let i = 0; i < data.length; i++) {
            const element = data[i];
            if (!setup.showing.includes(element.kind))
                continue;
            const html = `<div class="genre" data-id="${element.id}" data-val="${element.russian}">${element.russian}<div class="type">${setup.ru[element.kind]}</div></div>`

            // Получаем все три линии
            const lines = [".genres-list > .line-1", ".genres-list > .line-2", ".genres-list > .line-3"];

            // Определяем линию с наименьшей шириной
            let minLine = lines.reduce((min, line) => {
                return $(line).width() < $(min).width() ? line : min;
            }, lines[0]);


            $(minLine).append(html);
        }

        if ($PARAMETERS.censored) {
            setup.censored.forEach((id) => {
                $(`.genre[data-id="${id}"]`).addClass('censored');
            })
        }
    });

    $(`.genres-list`).on('click', '.genre', (e) => {
        const el = $(e.currentTarget);

        const id = parseInt(el.attr('data-id'));
        const val = el.attr('data-val');

        new TTSearch(TSearchType.genre({ id, val }), { info: TInfo.genre({ g: val, info: setup.descriptio[id] }) }).search();
    });

    ScrollElementWithMouse('.genres-list');
}

async function loadGenres() {
    const load = () => {
        return new Promise((resolve) => {
            GraphQl.genres({ entryType: `Anime` }, async (response) => {
                if (response.failed) {
                    if (response.status == 429) {
                        await Sleep(1000);
                        return load();
                    }
                    return resolve(null);
                }
                if (response?.data?.genres) {
                    return resolve(response.data.genres);
                }
                return resolve(null);
            }).POST(["id", "kind", "russian"]);
        });
    }

    return new Promise(async (resolve) => {
        const cache = new TCache();
        const path = await md5(`genres|type|Anime`);

        cache.get("requests", path).then(async (val) => {
            if (val !== null)
                return resolve(val);

            const l = await load();
            if (l === null)
                return;

            cache.put("requests", path, l, 30 * 24 * 60 * 60 * 1000).finally(() => {
                resolve(l);
            });
        });
    });
}