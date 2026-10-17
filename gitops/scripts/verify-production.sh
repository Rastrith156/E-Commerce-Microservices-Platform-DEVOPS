#!/usr/bin/env sh
set -eu

: "${PRODUCTION_BASE_URL:?Set PRODUCTION_BASE_URL to the HTTPS production storefront URL}"
case "$PRODUCTION_BASE_URL" in
  https://*) ;;
  *) echo "PRODUCTION_BASE_URL must use HTTPS" >&2; exit 1 ;;
esac
base="${PRODUCTION_BASE_URL%/}"

mkdir -p reports
curl --connect-timeout 5 --max-time 30 --fail --silent --show-error "$base/" \
  --output reports/production-frontend.html
grep -Fq '<div id="root"></div>' reports/production-frontend.html || {
  echo "Production frontend root element is missing" >&2
  exit 1
}
curl --connect-timeout 5 --max-time 30 --fail --silent --show-error "$base/api/products" \
  --output reports/production-catalog.json
grep -Fq 'chair-form' reports/production-catalog.json || {
  echo "Production catalog did not return the expected product" >&2
  exit 1
}
curl --connect-timeout 5 --max-time 30 --fail --silent --show-error "$base/api/carts/ci-production" \
  --output reports/production-cart.json
grep -Fq '"items":[]' reports/production-cart.json || {
  echo "Production cart response was not the expected empty cart" >&2
  exit 1
}
curl --connect-timeout 5 --max-time 30 --fail --silent --show-error "$base/api/payments/paypal/status" \
  --output reports/production-payment-status.json
grep -Fq '"mode":"simulated-sandbox"' reports/production-payment-status.json || {
  echo "Production payment status is not the expected simulation mode" >&2
  exit 1
}

printf 'Production pre-promotion smoke checks passed for %s\n' "$base" \
  | tee reports/production-smoke.txt
