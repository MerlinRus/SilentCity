#!/bin/sh
set -eu
if [ "${RENEWED_LINEAGE:-}" = /etc/letsencrypt/live/city.maark.ru ]; then
    nginx -t
    systemctl reload nginx
fi
