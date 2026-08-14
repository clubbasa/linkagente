#!/usr/bin/env bash
# Crea (una sola vez) el producto y el plan de facturación de LinkAgente en
# PayPal, vía su API REST. No mueve dinero — solo registra catálogo.
#
# Uso:
#   PAYPAL_CLIENT_ID=xxx PAYPAL_CLIENT_SECRET=yyy PAYPAL_ENV=sandbox \
#     PRICE_MXN=149 bash scripts/setup-paypal-plan.sh
#
# PAYPAL_ENV: "sandbox" (default) o "live". Corre primero en sandbox para
# probar todo el flujo sin dinero real; cuando esté listo, vuelve a correr
# este mismo script con credenciales "live" y PAYPAL_ENV=live.
#
# Al final imprime el Plan ID (empieza con "P-") — eso va en
# NEXT_PUBLIC_PAYPAL_PLAN_ID en .env.local / variables de entorno de Vercel.

set -uo pipefail
# (Ojo: sin la "e" de errexit a propósito — con pipefail, un grep sin match
# dentro de una asignación con "$(...)" mataría el script ANTES de llegar a
# los mensajes de error de abajo. Cada paso valida su propio resultado.)

: "${PAYPAL_CLIENT_ID:?Falta PAYPAL_CLIENT_ID}"
: "${PAYPAL_CLIENT_SECRET:?Falta PAYPAL_CLIENT_SECRET}"
PAYPAL_ENV="${PAYPAL_ENV:-sandbox}"
PRICE_MXN="${PRICE_MXN:-149}"

if [ "$PAYPAL_ENV" = "live" ]; then
  BASE_URL="https://api-m.paypal.com"
else
  BASE_URL="https://api-m.sandbox.paypal.com"
fi

echo "== Usando $BASE_URL (PAYPAL_ENV=$PAYPAL_ENV), precio \$$PRICE_MXN MXN/mes =="

extract_field() {
  # extract_field '"id":"..."'  <<< "$json"  -> primer valor de ese campo
  # (el "|| true" evita que un grep sin match tumbe el script por pipefail)
  grep -o "\"$1\":\"[^\"]*" | head -1 | cut -d'"' -f4 || true
}

echo "-- Obteniendo access token..."
TOKEN_RESPONSE=$(curl -sS "$BASE_URL/v1/oauth2/token" \
  -u "$PAYPAL_CLIENT_ID:$PAYPAL_CLIENT_SECRET" \
  -d "grant_type=client_credentials")
TOKEN=$(printf '%s' "$TOKEN_RESPONSE" | extract_field "access_token")

if [ -z "$TOKEN" ]; then
  echo "No se pudo obtener el access token. Respuesta de PayPal:" >&2
  echo "$TOKEN_RESPONSE" >&2
  echo "" >&2
  echo "Revisa que el Client ID/Secret sean correctos y correspondan al ambiente ($PAYPAL_ENV)." >&2
  exit 1
fi
echo "   OK"

echo "-- Creando producto 'LinkAgente'..."
PRODUCT_RESPONSE=$(curl -sS "$BASE_URL/v1/catalogs/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "LinkAgente",
    "description": "Suscripcion mensual a LinkAgente",
    "type": "SERVICE",
    "category": "SOFTWARE"
  }')
PRODUCT_ID=$(echo "$PRODUCT_RESPONSE" | extract_field "id")
if [ -z "$PRODUCT_ID" ]; then
  echo "No se pudo crear el producto. Respuesta de PayPal:" >&2
  echo "$PRODUCT_RESPONSE" >&2
  exit 1
fi
echo "   Product ID: $PRODUCT_ID"

echo "-- Creando plan de facturación mensual..."
PLAN_RESPONSE=$(curl -sS "$BASE_URL/v1/billing/plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"product_id\": \"$PRODUCT_ID\",
    \"name\": \"LinkAgente Mensual\",
    \"billing_cycles\": [{
      \"frequency\": {\"interval_unit\": \"MONTH\", \"interval_count\": 1},
      \"tenure_type\": \"REGULAR\",
      \"sequence\": 1,
      \"total_cycles\": 0,
      \"pricing_scheme\": {\"fixed_price\": {\"value\": \"$PRICE_MXN\", \"currency_code\": \"MXN\"}}
    }],
    \"payment_preferences\": {
      \"auto_bill_outstanding\": true,
      \"payment_failure_threshold\": 2
    }
  }")
PLAN_ID=$(echo "$PLAN_RESPONSE" | extract_field "id")
if [ -z "$PLAN_ID" ]; then
  echo "No se pudo crear el plan. Respuesta de PayPal:" >&2
  echo "$PLAN_RESPONSE" >&2
  exit 1
fi

echo ""
echo "========================================"
echo "Listo. Plan ID: $PLAN_ID"
echo "========================================"
echo "Guarda esto como NEXT_PUBLIC_PAYPAL_PLAN_ID en .env.local y en las"
echo "variables de entorno de Vercel."
