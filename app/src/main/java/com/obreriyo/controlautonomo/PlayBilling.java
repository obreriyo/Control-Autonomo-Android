package com.obreriyo.controlautonomo;

import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import com.android.billingclient.api.*;
import org.json.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.*;
import java.util.concurrent.*;

/** Only verified server responses grant Pro. The debug APK keeps its preview. */
public final class PlayBilling implements PurchasesUpdatedListener {
    private static final String HOME = "https://appassets.androidplatform.net/assets/index.html";
    private static final String PRODUCT = "control_autonomo_pro";
    private static final String ENDPOINT = "https://europe-west1-control-autonomo.cloudfunctions.net/playEntitlement";
    private final Activity activity;
    private final WebView web;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final SharedPreferences cache;
    private final BillingClient client;
    private ProductDetails product;
    private ProductDetails.SubscriptionOfferDetails offer;
    private String token = "", uid = "", message = "Comprobando Google Play…";
    private long generation = 0, validUntil = 0;
    private boolean pro = false, verifying = false, destroyed = false, pending = false, serverReady = false;

    public PlayBilling(Activity activity, WebView web) {
        this.activity = activity; this.web = web;
        cache = activity.getSharedPreferences("play_verified_v1", Activity.MODE_PRIVATE);
        client = BillingClient.newBuilder(activity).setListener(this)
            .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
            .enableAutoServiceReconnection().build();
        if (BuildConfig.PLAY_DISTRIBUTION) connect();
    }

    @JavascriptInterface public boolean isPlayBuild() { return BuildConfig.PLAY_DISTRIBUTION; }
    private boolean trusted() { return BuildConfig.PLAY_DISTRIBUTION && !destroyed && HOME.equals(web.getUrl()); }
    @JavascriptInterface public void refresh() { activity.runOnUiThread(() -> { if (trusted()) { connect(); verify(null); } }); }
    @JavascriptInterface public void setSession(String idToken, String userId) {
        activity.runOnUiThread(() -> {
            if (!trusted()) return;
            if (idToken == null || idToken.length() > 8192 || userId == null || !userId.matches("[A-Za-z0-9_-]{1,128}")) {
                generation++; token = ""; uid = ""; pro = false; validUntil = 0; verifying = false; serverReady = false;
                message = "Versión gratuita. Inicia sesión para contratar o restaurar Pro."; emit(); return;
            }
            if (!uid.equals(userId)) {
                generation++; uid = userId; pro = false; validUntil = 0; verifying = false; serverReady = false;
            }
            token = idToken; verify(null); queryPurchases();
        });
    }
    @JavascriptInterface public void buy() {
        activity.runOnUiThread(() -> {
            if (!trusted()) return;
            if (uid.isEmpty() || token.isEmpty()) { message = "Inicia sesión en Mi cuenta para contratar Pro."; emit(); return; }
            if (verifying || pro) { emit(); return; }
            if (!serverReady) { message = "Conéctate para comprobar tu cuenta antes de comprar."; verify(null); return; }
            if (!client.isReady() || product == null || offer == null) {
                message = "La suscripción todavía no está disponible en Google Play."; connect(); emit(); return;
            }
            BillingFlowParams params = BillingFlowParams.newBuilder()
                .setObfuscatedAccountId(accountHash(uid))
                .setProductDetailsParamsList(Collections.singletonList(BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(product).setOfferToken(offer.getOfferToken()).build())).build();
            BillingResult result = client.launchBillingFlow(activity, params);
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                message = "No se pudo abrir la compra. Vuelve a intentarlo desde Google Play."; emit();
            }
        });
    }
    @JavascriptInterface public void restore() { activity.runOnUiThread(() -> { if (trusted()) queryPurchases(); }); }
    @JavascriptInterface public void manage() {
        activity.runOnUiThread(() -> {
            if (!trusted()) return;
            try { activity.startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/account/subscriptions?sku=" + PRODUCT + "&package=" + BuildConfig.APPLICATION_ID))); }
            catch (android.content.ActivityNotFoundException e) { message = "Abre Play Store → Pagos y suscripciones → Suscripciones."; emit(); }
        });
    }

    private void connect() {
        if (destroyed || !BuildConfig.PLAY_DISTRIBUTION) return;
        if (client.isReady()) { queryProduct(); return; }
        client.startConnection(new BillingClientStateListener() {
            @Override public void onBillingSetupFinished(BillingResult result) {
                if (destroyed) return;
                if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) { queryProduct(); queryPurchases(); }
                else { message = "Google Play no está disponible. Comprueba la instalación y tu conexión."; emit(); }
            }
            @Override public void onBillingServiceDisconnected() { if (!destroyed) { message = "Sin conexión con Google Play."; emit(); } }
        });
    }
    private void queryProduct() {
        QueryProductDetailsParams params = QueryProductDetailsParams.newBuilder().setProductList(Collections.singletonList(
            QueryProductDetailsParams.Product.newBuilder().setProductId(PRODUCT).setProductType(BillingClient.ProductType.SUBS).build())).build();
        client.queryProductDetailsAsync(params, (result, details) -> {
            if (destroyed) return;
            product = null; offer = null;
            if (result.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                for (ProductDetails p : details.getProductDetailsList()) {
                    if (!PRODUCT.equals(p.getProductId()) || p.getSubscriptionOfferDetails() == null) continue;
                    ProductDetails.SubscriptionOfferDetails base = null, trial = null;
                    for (ProductDetails.SubscriptionOfferDetails o : p.getSubscriptionOfferDetails()) {
                        if (!"anual".equals(o.getBasePlanId())) continue;
                        List<ProductDetails.PricingPhase> phases = o.getPricingPhases().getPricingPhaseList();
                        if (phases.isEmpty() || !"P1Y".equals(phases.get(phases.size()-1).getBillingPeriod())) continue;
                        if (o.getOfferId() == null) base = o;
                        else if ("prueba-7-dias".equals(o.getOfferId()) && phases.size() == 2
                            && phases.get(0).getPriceAmountMicros() == 0 && "P7D".equals(phases.get(0).getBillingPeriod())
                            && phases.get(0).getBillingCycleCount() == 1) trial = o;
                    }
                    if (trial != null || base != null) { product = p; offer = trial != null ? trial : base; }
                }
            }
            if (offer == null && !pro) message = "La suscripción anual todavía no está disponible en Google Play.";
            emit();
        });
    }
    private void queryPurchases() {
        if (uid.isEmpty()) { message = "Inicia sesión para restaurar las compras de esta cuenta."; emit(); return; }
        if (!client.isReady()) { connect(); verify(null); return; }
        final long queryGeneration = generation;
        final String queryUid = uid;
        client.queryPurchasesAsync(QueryPurchasesParams.newBuilder().setProductType(BillingClient.ProductType.SUBS).build(), (result, purchases) -> {
            if (destroyed || queryGeneration != generation || !queryUid.equals(uid)) return;
            if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) { verify(null); return; }
            pending = false;
            for (Purchase purchase : purchases) {
                if (!purchase.getProducts().contains(PRODUCT)) continue;
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) { pending = true; continue; }
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED && !purchase.isSuspended()) { verify(purchase.getPurchaseToken()); return; }
            }
            verify(null);
        });
    }
    @Override public void onPurchasesUpdated(BillingResult result, List<Purchase> purchases) {
        if (destroyed) return;
        if (result.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (Purchase purchase : purchases) {
                if (!purchase.getProducts().contains(PRODUCT)) continue;
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PENDING) {
                    pending = true; message = "Pago pendiente. Pro se activará cuando Google confirme el pago."; emit(); return;
                }
                if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED && !purchase.isSuspended()) { pending = false; verify(purchase.getPurchaseToken()); return; }
            }
        } else if (result.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
            message = "Compra cancelada. No se ha activado Pro."; emit();
        } else if (result.getResponseCode() == BillingClient.BillingResponseCode.ITEM_ALREADY_OWNED) queryPurchases();
        else { message = "No se pudo completar la compra. Puedes volver a intentarlo o restaurarla."; emit(); }
    }

    private void verify(String purchaseToken) {
        if (token.isEmpty() || uid.isEmpty() || destroyed) { emit(); return; }
        final String sessionUid = uid, sessionToken = token;
        final long sessionGeneration = generation;
        verifying = true; message = "Comprobando tu acceso Pro…"; emit();
        worker.execute(() -> {
            try {
                JSONObject body = new JSONObject(); if (purchaseToken != null) body.put("purchaseToken", purchaseToken);
                HttpURLConnection connection = (HttpURLConnection) new URL(ENDPOINT).openConnection();
                JSONObject response;
                try {
                    connection.setConnectTimeout(12000); connection.setReadTimeout(15000); connection.setRequestMethod("POST");
                    connection.setRequestProperty("Authorization", "Bearer " + sessionToken);
                    connection.setRequestProperty("Content-Type", "application/json"); connection.setDoOutput(true);
                    try (java.io.OutputStream out = connection.getOutputStream()) { out.write(body.toString().getBytes(StandardCharsets.UTF_8)); }
                    int code = connection.getResponseCode();
                    if (code == 401 || code == 403 || code == 409) throw new SecurityException("Cuenta o compra no válida");
                    if (code != 200) throw new java.io.IOException("Servidor no disponible");
                    try (java.io.InputStream input = connection.getInputStream(); java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
                        byte[] buffer = new byte[2048]; int n; while ((n = input.read(buffer)) != -1) {
                            out.write(buffer, 0, n); if (out.size() > 32768) throw new java.io.IOException("Respuesta no válida");
                        }
                        response = new JSONObject(out.toString("UTF-8"));
                    }
                    if (!sessionUid.equals(response.optString("uid"))) throw new SecurityException("Cuenta distinta");
                } finally { connection.disconnect(); }
                long until = response.optLong("expiresAt", 0);
                boolean active = response.optBoolean("pro", false) && until > System.currentTimeMillis();
                activity.runOnUiThread(() -> {
                    if (destroyed || sessionGeneration != generation || !sessionUid.equals(uid)) return;
                    pro = active; serverReady = true; validUntil = active ? Math.min(until, System.currentTimeMillis() + 86400000L) : 0;
                    cache.edit().putLong("until_" + accountHash(uid), validUntil).apply(); verifying = false;
                    message = pro ? "Pro activo." : pending ? "Pago pendiente de confirmación de Google Play." : "Versión gratuita."; emit();
                });
            } catch (Exception e) {
                final boolean rejected = e instanceof SecurityException;
                activity.runOnUiThread(() -> {
                    if (destroyed || sessionGeneration != generation || !sessionUid.equals(uid)) return;
                    verifying = false; serverReady = false;
                    validUntil = rejected ? 0 : cache.getLong("until_" + accountHash(uid), 0);
                    pro = validUntil > System.currentTimeMillis();
                    if (rejected) cache.edit().remove("until_" + accountHash(uid)).apply();
                    message = rejected ? "Esta compra pertenece a otra cuenta o la sesión ha caducado. Inicia sesión y restaura tus compras."
                        : pro ? "Pro verificado anteriormente. Acceso temporal sin conexión."
                        : "No se pudo verificar Pro. Comprueba tu conexión y pulsa Restaurar compras.";
                    emit();
                });
            }
        });
    }
    public void emit() {
        activity.runOnUiThread(() -> {
            if (destroyed || !trusted()) return;
            if (pro && validUntil <= System.currentTimeMillis()) pro = false;
            JSONObject state = new JSONObject();
            try {
                state.put("pro", pro); state.put("busy", verifying); state.put("message", message);
                state.put("canBuy", !pro && !verifying && serverReady && offer != null && client.isReady() && !uid.isEmpty());
                state.put("expiresAt", validUntil);
                if (offer != null) {
                    List<ProductDetails.PricingPhase> phases = offer.getPricingPhases().getPricingPhaseList();
                    String price = phases.get(phases.size()-1).getFormattedPrice();
                    boolean trial = phases.size() == 2 && phases.get(0).getPriceAmountMicros() == 0;
                    state.put("price", price); state.put("trial", trial);
                    state.put("terms", trial ? "7 días gratis; después " + price + " al año. Renovación automática. Cancela antes de terminar la prueba para evitar el cobro."
                        : price + " al año. Renovación automática. Puedes cancelar desde Google Play.");
                }
                web.evaluateJavascript("window.dispatchEvent(new CustomEvent('ca-billing',{detail:" + state + "}));", null);
            } catch (JSONException ignored) { }
        });
    }
    static String accountHash(String uid) {
        try {
            byte[] bytes = MessageDigest.getInstance("SHA-256").digest(uid.getBytes(StandardCharsets.UTF_8));
            StringBuilder out = new StringBuilder(); for (byte b : bytes) out.append(String.format(Locale.ROOT, "%02x", b & 255)); return out.toString();
        } catch (Exception e) { throw new IllegalStateException(e); }
    }
    public void resume() { if (BuildConfig.PLAY_DISTRIBUTION && !destroyed) { queryPurchases(); emit(); } }
    public void destroy() { destroyed = true; generation++; client.endConnection(); worker.shutdownNow(); }
}
