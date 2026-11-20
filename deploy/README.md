# city.maark.ru

## Сервер и схема

SSH: `ssh -i "$env:USERPROFILE\\.ssh\\id_ed25519" m.pivorental@195.133.25.63 -p 22`.
Административные команды выполняются через `sudo`. SSH-ключ остаётся на локальном компьютере.

Проект и исходники: `/opt/silentcity`. Docker Compose: `/opt/silentcity/compose.yaml`.
Системный Nginx принимает HTTP/HTTPS для `city.maark.ru` и передаёт запросы
контейнеру Caddy `silentcity-proxy` на `127.0.0.1:3080`. Caddy раздаёт сайт,
а запросы аккаунта передаёт контейнеру `silentcity-web` по сети Compose.

В контейнере `silentcity-web` SQLite открывается по пути `/data/accounts.sqlite`.
Данные сохраняются на хосте в `/opt/silentcity/data`. Перед первым запуском
создать `data` с владельцем `1000:1000` и режимом `0700`. Для резервной копии
использовать SQLite backup API либо копировать каталог после остановки `web`.

Корневые `compose.yaml` и `Caddyfile` на сервере копируются из `deploy/`.
TLS завершает Nginx, поэтому Caddy использует HTTP внутри сервера.
Сертификат: `/etc/letsencrypt/live/city.maark.ru/`, продление через `certbot.timer`.
Хук `deploy/renew-city-nginx.sh` устанавливается в
`/etc/letsencrypt/renewal-hooks/deploy/silentcity-nginx.sh` с владельцем root;
он проверяет и перезагружает Nginx только после продления сертификата города.

Публичная проверка: `https://city.maark.ru/healthz` возвращает `ok`.
Внутренняя: `curl --resolve city.maark.ru:3080:127.0.0.1 http://city.maark.ru:3080/healthz`.

## Первый запуск

1. Загрузить исходники в `/opt/silentcity`, создать `site/releases/<release-id>`, `site/weather` и `acme`.
2. Подготовить статический релиз и ссылку `site/current`, как описано ниже.
3. Скопировать `deploy/compose.yaml` и `deploy/Caddyfile` в корень проекта.
4. Проверить `sudo docker compose config --quiet` и конфигурацию Caddy; запустить `sudo docker compose up -d`.
5. Если домен ещё не настроен, подключить только `deploy/nginx-city-http.conf` как новый виртуальный хост города. Выполнить `sudo nginx -t` перед `sudo systemctl reload nginx`.
6. После смены A-записи на `195.133.25.63` выпустить сертификат:
   `sudo certbot certonly --non-interactive --webroot -w /opt/silentcity/acme -d city.maark.ru`.
7. Установить `deploy/nginx-city.conf` в `/etc/nginx/sites-available/city.maark.ru`; включить его ссылкой из `sites-enabled`. Проверить Nginx и мягко перезагрузить.
8. Установить хук продления и погодный таймер. Не передавать SSH-ключи в контейнер или архив исходников.

## Обновление и откат

1. Проверить `npm run check` локально.
2. Создать `/opt/silentcity/site/releases/<release-id>`. Загрузить `index.html`,
   `style.css`, `mobile.css`, `climate.css`, `radio-room.css`, `city-life.css`,
   `app.js`, `account.js`, `weather.js` и каталог `sounds/` с записями и атрибуцией.
   Сохранить ссылку `weather.json -> ../../weather/current.json`.
3. Из `/opt/silentcity/site` выполнить `ln -s releases/<release-id> current.next`,
   затем `mv -Tf current.next current`.
4. Проверить HTTPS, `/healthz`, `/weather.json`, поиск города, аудио и HTTP Range.
   Для обновления статических файлов перезапуск контейнера не нужен.

Откат: таким же атомарным переключением вернуть `current` на предыдущий релиз.
Старые релизы сохраняются. Не выполнять `docker compose down -v`.

## Погода и обслуживание

Московский кеш обновляет системный таймер `silentcity-weather.timer` каждые
10 минут. Служба работает от `silentcity-weather`, имеет право записи только
в `/opt/silentcity/site/weather`. Файлы службы и таймера лежат в `deploy/`.
Поиск и погоду других городов проксирует Caddy на фиксированные адреса Open-Meteo.

- Контейнер: `cd /opt/silentcity && sudo docker compose ps`.
- Логи: `sudo docker logs --tail 100 silentcity-web` и `sudo docker logs --tail 100 silentcity-proxy`.
- Проверка Caddy: `sudo docker exec silentcity-proxy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile`.
- Погода: `sudo systemctl status silentcity-weather.timer`.
- Проверка TLS-продления: `sudo certbot renew --cert-name city.maark.ru --dry-run`.
- Остановить сайт: `cd /opt/silentcity && sudo docker compose stop proxy web`.

## Вход через Google

Создать OAuth-клиент типа «Веб-приложение» в Google Cloud. Redirect URI —
`https://city.maark.ru/api/account/google/callback`. В `/opt/silentcity/.account.env`
с режимом `0600` задать `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET`, затем выполнить
`sudo docker compose up -d --force-recreate web`. Кнопка появится после настройки.
Google-аккаунт идентифицируется по `sub`. Вход по паролю с той же почтой создаёт
отдельный аккаунт.

Старый сервер `45.85.93.156:9022` и каталог `/opt/after-rain` больше не используются
для публикации. Его соседние приложения и настройки не переносились.
