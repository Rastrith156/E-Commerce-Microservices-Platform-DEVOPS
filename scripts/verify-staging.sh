#!/usr/bin/env sh
set -eu

: "${STAGING_BASE_URL:?Set STAGING_BASE_URL to the HTTPS staging storefront URL}"
case "$STAGING_BASE_URL" in
  https://*) ;;
  *) echo "STAGING_BASE_URL must use HTTPS" >&2; exit 1 ;;
esac
base="${STAGING_BASE_URL%/}"

mkdir -p reports
curl --connect-timeout 5 --max-time 30 --fail --silent --show-error "$base/" \
  --output reports/staging-frontend.html
grep -Fq '<div id="root"></div>' reports/staging-frontend.html || {
  echo "Staging frontend root element is missing" >&2
  exit 1
}
curl --connect-timeout 5 --max-time 30 --fail --silent --show-error "$base/api/products" \
  --output reports/staging-catalog.json
grep -Fq 'chair-form' reports/staging-catalog.json || {
  echo "Staging catalog did not return the expected product" >&2
  exit 1
}
curl --connect-timeout 5 --max-time 30 --fail --silent --show-error "$base/api/carts/ci-staging" \
  --output reports/staging-cart.json
grep -Fq '"items":[]' reports/staging-cart.json || {
  echo "Staging cart response was not the expected empty cart" >&2
  exit 1
}
curl --connect-timeout 5 --max-time 30 --fail --silent --show-error "$base/api/payments/paypal/status" \
  --output reports/staging-payment-status.json

grep -Fq '"mode":"simulated-sandbox"' reports/staging-payment-status.json || {
  echo "Staging payment status is not the expected simulation mode" >&2
  exit 1
}

printf 'Staging HTTP smoke checks passed for %s\n' "$base" \
  | tee reports/staging-smoke.txt
