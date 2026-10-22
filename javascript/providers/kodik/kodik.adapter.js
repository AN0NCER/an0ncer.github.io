/**
 * Kodik — адаптер источника для tplayer (внутри iframe).
 *
 * Провайдер (kodik.provider.js) работает на watch: отдаёт список озвучек и ссылку
 * для iframe. Адаптер работает в tplayer: по параметрам из URL получает само видео
 * и обновляет его, когда ссылки протухли. Контракт — SourceAdapter в ../registry.js.
 *
 * Пока пусто: сейчас эта логика зашита в tplayer напрямую —
 *  - pages/tplayer.js: Meta.getLink() → TSource.get() → new Source() → player.attach();
 *  - pages/tplayer/mod.tplayer.js: Player.refreshSource() (свежий источник без кэша);
 *  - pages/tplayer/utils/util.entity.js: классы Meta, TSource, Source.
 * Переносится сюда в пункте 14 плана (plans/player-mods-rooms.md), вместе с переделкой
 * tplayer (пункты 13–16): до этого адаптер никто не импортирует, и копия логики
 * расходилась бы с оригиналом.
 *
 * Что будет здесь:
 *  - id: 'kodik';
 *  - meta() — Meta.getLink(): название, озвучка, эпизод, last_episode, скриншоты;
 *  - load() — TSource.get(): Hub.access({ scope: 'player' }) → Tunime.video.source();
 *    результат { kind: 'qualities', qualities, skips, thumbnails, tiles };
 *  - refresh() — то же без кэша (caching=false), как Player.refreshSource сейчас;
 *  - canSwitchToKodik: true — при фатальной ошибке можно уйти в iframe Kodik.
 */
