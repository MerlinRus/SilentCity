# city.maark.ru

Сервер: `root@45.85.93.156`, SSH-порт `9022`. Аутентификация локальным SSH-ключом; ключи на сервер вместе с сайтом не передаются.

Каталог на сервере: `/opt/after-rain`. `compose.yaml` запускает Caddy, который раздаёт статические файлы сайта, аудиозаписи и автоматически получает и продлевает HTTPS-сертификат. Приложение не требует Node.js на сервере. Порты 80/tcp и 443/tcp открыты для сайта. Остальные приложения сервера не изменяются.

Публичная проверка: `https://city.maark.ru/healthz` возвращает `ok`.

## Обновление

1. Проверить `npm run check` локально.
2. Создать `/opt/after-rain/site/releases/<release-id>` и загрузить в него `index.html`, `style.css`, `mobile.css`, `climate.css`, `radio-room.css`, `app.js`, `weather.js` и каталог `sounds/` с аудиозаписями и атрибуцией. Сохранить ссылку `weather.json -> ../../weather/current.json`.
3. Из `/opt/after-rain/site` выполнить `ln -s releases/<release-id> current.next`, затем `mv -Tf current.next current`.
4. Проверить `/healthz` и основные сценарии в браузере. Для изменения статических файлов перезапуск Caddy не нужен.

Для поиска и погоды выбранного города Caddy должен содержать точные маршруты
`/city-search` и `/city-weather` из репозиторного конфига. В живой конфигурации
могут быть соседние приложения: добавлять маршруты адресно, не заменять весь
Caddyfile репозиторной заготовкой. Перед перезагрузкой — резервная копия и
`caddy validate`; после — проверка сайта и соседних маршрутов.

## Откат

В `/opt/after-rain/site` создать `current.next`, указывающий на предыдущий каталог `releases/<release-id>`, затем выполнить `mv -Tf current.next current`. Старые релизы сохраняются. Остановка только этого сайта: `cd /opt/after-rain && docker compose stop web`.

## Обслуживание

Состояние: `cd /opt/after-rain && docker compose ps`.
Логи: `docker logs --tail 100 after-rain-web`.
Проверка конфигурации: `docker exec after-rain-web caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile`.
Перечитать конфигурацию: `docker exec after-rain-web caddy reload --config /etc/caddy/Caddyfile --adapter caddyfile`.

Имя Compose-проекта зафиксировано как `after-rain`. Тома `after-rain_caddy_data` и `after-rain_caddy_config` содержат состояние Caddy и сертификаты: сохранять при обновлении и не удалять через `docker compose down -v`. Каталог `/srv/site` в Caddyfile — путь внутри контейнера; он монтируется из `/opt/after-rain/site` на сервере.
