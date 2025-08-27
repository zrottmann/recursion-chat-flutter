var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};
import { a as reactExports, j as jsxRuntimeExports, b as React } from "./react-core.Djxt4ZS-.js";
import { R as ReactDOM } from "./react-dom.gWk1XNUt.js";
import { N as Navigate, u as useNavigate, a as useLocation, b as useSearchParams, R as Routes, c as Route, H as HashRouter } from "./react-router.Bxgm2N5f.js";
import { C as Capacitor, P as Preferences, D as Device, l as log$1, _ as __vitePreload } from "./vendor.D7QwsUjK.js";
import { A as Account, C as Client, D as Databases, I as ID, Q as Query } from "./appwrite.CStVTjwy.js";
var require_index_001 = __commonJS({
  "js/index.D8bF4m1K.js"(exports) {
    (function polyfill() {
      const relList = document.createElement("link").relList;
      if (relList && relList.supports && relList.supports("modulepreload")) {
        return;
      }
      for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
        processPreload(link);
      }
      new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type !== "childList") {
            continue;
          }
          for (const node of mutation.addedNodes) {
            if (node.tagName === "LINK" && node.rel === "modulepreload")
              processPreload(node);
          }
        }
      }).observe(document, { childList: true, subtree: true });
      function getFetchOpts(link) {
        const fetchOpts = {};
        if (link.integrity) fetchOpts.integrity = link.integrity;
        if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
        if (link.crossOrigin === "use-credentials")
          fetchOpts.credentials = "include";
        else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
        else fetchOpts.credentials = "same-origin";
        return fetchOpts;
      }
      function processPreload(link) {
        if (link.ep)
          return;
        link.ep = true;
        const fetchOpts = getFetchOpts(link);
        fetch(link.href, fetchOpts);
      }
    })();
    const FORCED_NYC_ENDPOINT = "https://nyc.cloud.appwrite.io/v1";
    const FORCED_PROJECT_ID = "689bdaf500072795b0f6";
    console.log("🚨 [ForcedNYCClient] LOADED - ALL APPWRITE CLIENTS WILL USE NYC ENDPOINT:", FORCED_NYC_ENDPOINT);
    class ForcedNYCClient extends Client {
      constructor() {
        super();
        console.log("🚨 [ForcedNYCClient] Creating new client with FORCED NYC endpoint");
        this.setEndpoint(FORCED_NYC_ENDPOINT);
        this.setProject(FORCED_PROJECT_ID);
        const originalConfig = this.config;
        this.config = new Proxy(originalConfig, {
          set(target, property, value) {
            if (property === "endpoint" && value !== FORCED_NYC_ENDPOINT) {
              console.warn("🚨 [ForcedNYCClient] BLOCKED attempt to set wrong endpoint:", value, "- FORCING NYC:", FORCED_NYC_ENDPOINT);
              target[property] = FORCED_NYC_ENDPOINT;
              return true;
            }
            target[property] = value;
            return true;
          }
        });
      }
      setEndpoint(endpoint) {
        if (endpoint !== FORCED_NYC_ENDPOINT) {
          console.warn("🚨 [ForcedNYCClient] BLOCKED setEndpoint:", endpoint, "- FORCING NYC:", FORCED_NYC_ENDPOINT);
          super.setEndpoint(FORCED_NYC_ENDPOINT);
        } else {
          super.setEndpoint(endpoint);
        }
        return this;
      }
    }
    const forcedClient = new ForcedNYCClient();
    const forcedAccount = new Account(forcedClient);
    const forcedDatabases = new Databases(forcedClient);
    console.log("✅ [ForcedNYCClient] Forced NYC client initialized:", {
      endpoint: forcedClient.config.endpoint,
      project: forcedClient.config.project
    });
    console.log("✅ Forced NYC client exports fixed - using pre-instantiated objects to prevent constructor errors");
    let currentUser$1 = null;
    let isInitialized = false;
    const initialize = () => __async(null, null, function* () {
      if (isInitialized) {
        return true;
      }
      try {
        if (!forcedClient || !forcedAccount) {
          throw new Error("Forced NYC client not available");
        }
        try {
          const user = yield forcedAccount.get();
          currentUser$1 = user;
        } catch (error) {
          currentUser$1 = null;
        }
        isInitialized = true;
        return true;
      } catch (error) {
        isInitialized = false;
        return false;
      }
    });
    const enhancedAuth = {
      /**
       * Initialize the service
       */
      initialize() {
        return __async(this, null, function* () {
          return yield initialize();
        });
      },
      /**
       * Sign up with email and password
       */
      signup(email, password, name) {
        return __async(this, null, function* () {
          try {
            const user = yield forcedAccount.create(ID.unique(), email, password, name || email.split("@")[0]);
            const session = yield forcedAccount.createEmailPasswordSession(email, password);
            currentUser$1 = user;
            return { success: true, user, session };
          } catch (error) {
            throw error;
          }
        });
      },
      /**
       * Sign in with email and password
       */
      signin(email, password) {
        return __async(this, null, function* () {
          try {
            const session = yield forcedAccount.createEmailPasswordSession(email, password);
            const user = yield forcedAccount.get();
            currentUser$1 = user;
            return { success: true, user, session };
          } catch (error) {
            throw error;
          }
        });
      },
      /**
       * Sign out
       */
      logout() {
        return __async(this, null, function* () {
          try {
            yield forcedAccount.deleteSession("current");
            currentUser$1 = null;
            localStorage.clear();
            sessionStorage.clear();
            return { success: true };
          } catch (error) {
            currentUser$1 = null;
            localStorage.clear();
            sessionStorage.clear();
            return { success: true };
          }
        });
      },
      /**
       * Get current user
       */
      getCurrentUser() {
        return __async(this, null, function* () {
          try {
            if (currentUser$1) {
              return currentUser$1;
            }
            const user = yield forcedAccount.get();
            currentUser$1 = user;
            return user;
          } catch (error) {
            currentUser$1 = null;
            return null;
          }
        });
      },
      /**
       * Get current session
       */
      getCurrentSession() {
        return __async(this, null, function* () {
          try {
            const session = yield forcedAccount.getSession("current");
            return session;
          } catch (error) {
            return null;
          }
        });
      },
      /**
       * OAuth sign in (Google)
       */
      signInWithGoogle(successUrl, failureUrl) {
        return __async(this, null, function* () {
          try {
            forcedAccount.createOAuth2Session(
              "google",
              successUrl || "".concat(window.location.origin, "/#/auth/success"),
              failureUrl || "".concat(window.location.origin, "/#/auth/failure")
            );
            return { success: true, redirecting: true };
          } catch (error) {
            throw error;
          }
        });
      },
      /**
       * Check if user is authenticated
       */
      isAuthenticated() {
        return __async(this, null, function* () {
          try {
            const user = yield this.getCurrentUser();
            return !!user;
          } catch (error) {
            return false;
          }
        });
      },
      /**
       * Initialize the auth service (alias for initialize for context compatibility)
       */
      init() {
        return __async(this, null, function* () {
          yield initialize();
          try {
            const user = yield this.getCurrentUser();
            const session = yield this.getCurrentSession();
            return {
              isAuthenticated: !!user,
              user,
              session
            };
          } catch (error) {
            return {
              isAuthenticated: false,
              user: null,
              session: null
            };
          }
        });
      },
      /**
       * Validate current session
       */
      validateSession(force = false) {
        return __async(this, null, function* () {
          try {
            const user = yield forcedAccount.get();
            if (user) {
              currentUser$1 = user;
              return true;
            } else {
              currentUser$1 = null;
              return false;
            }
          } catch (error) {
            currentUser$1 = null;
            return false;
          }
        });
      },
      /**
       * Login with OAuth provider (supports multiple providers)
       */
      loginWithOAuth(provider, successUrl, failureUrl) {
        return __async(this, null, function* () {
          try {
            const defaultSuccessUrl = successUrl || "".concat(window.location.origin, "/#/auth/success");
            const defaultFailureUrl = failureUrl || "".concat(window.location.origin, "/#/auth/error");
            const providerMap = {
              "google": "google",
              "github": "github",
              "discord": "discord"
            };
            const mappedProvider = providerMap[provider.toLowerCase()] || provider;
            forcedAccount.createOAuth2Session(
              mappedProvider,
              defaultSuccessUrl,
              defaultFailureUrl
            );
            return { success: true, redirecting: true };
          } catch (error) {
            throw error;
          }
        });
      },
      /**
       * Handle OAuth callback (processes OAuth response)
       */
      handleOAuthCallback() {
        return __async(this, null, function* () {
          try {
            yield new Promise((resolve) => setTimeout(resolve, 1e3));
            const user = yield forcedAccount.get();
            if (user) {
              let session = null;
              try {
                session = yield forcedAccount.getSession("current");
              } catch (sessionError) {
                session = {
                  $id: "oauth_".concat(user.$id, "_").concat(Date.now()),
                  userId: user.$id,
                  provider: "oauth",
                  $createdAt: (/* @__PURE__ */ new Date()).toISOString()
                };
              }
              currentUser$1 = user;
              return {
                success: true,
                user,
                session
              };
            } else {
              throw new Error("OAuth authentication failed - no user session found");
            }
          } catch (error) {
            throw error;
          }
        });
      },
      /**
       * Login with email and password (alias for signin for context compatibility)
       */
      loginWithEmail(email, password) {
        return __async(this, null, function* () {
          return yield this.signin(email, password);
        });
      },
      /**
       * Register new user (alias for signup for context compatibility)
       */
      register(email, password, username) {
        return __async(this, null, function* () {
          return yield this.signup(email, password, username);
        });
      }
    };
    initialize().catch((error) => {
    });
    const appwriteEnhancedAuth = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
      __proto__: null,
      enhancedAuth
    }, Symbol.toStringTag, { value: "Module" }));
    const getApiUrl = () => {
      console.log("[API Config] ==> RESOLVING API URL");
      console.log("[API Config] Environment info:");
      console.log("[API Config] - window.location.href:", window.location.href);
      console.log("[API Config] - window.location.hostname:", window.location.hostname);
      console.log("[API Config] - window.location.origin:", window.location.origin);
      console.log("[API Config] - window.location.protocol:", window.location.protocol);
      console.log("[API Config] - window.location.port:", window.location.port);
      console.log("[API Config] - Capacitor available:", !!window.Capacitor);
      console.log("[API Config] - Capacitor.isNativePlatform():", Capacitor.isNativePlatform());
      if (Capacitor.isNativePlatform()) {
        const apiUrl = "https://chat.recursionsystems.com";
        console.log("[API Config] 📱 Native platform detected - using production API:", apiUrl);
        return apiUrl;
      }
      const hostname = window.location.hostname;
      console.log("[API Config] 🌐 Web platform - analyzing hostname:", hostname);
      if (hostname.includes("recursionsystems.com")) {
        console.log("[API Config] ✅ Production domain detected - using relative URLs");
        return "";
      }
      if (hostname === "localhost" || hostname === "127.0.0.1") {
        const apiUrl = "http://".concat(hostname, ":5174");
        console.log("[API Config] 🖥️ Local development detected - using:", apiUrl);
        return apiUrl;
      }
      console.log("[API Config] ⚠️ Unknown hostname - defaulting to relative URLs");
      return "";
    };
    class MobileSafariAuthDebugger {
      constructor() {
        this.logs = [];
        this.authPhases = [];
        this.redirectAttempts = [];
        this.isDebugging = false;
        this.startTime = Date.now();
        if (this.isMobileSafari()) {
          this.startDebugging();
        }
      }
      // Enhanced mobile Safari detection
      isMobileSafari() {
        const ua = navigator.userAgent;
        return /iPhone|iPad|iPod/i.test(ua) && /Safari/i.test(ua) && !/CriOS|FxiOS|WebKit.*Mobile.*Version/i.test(ua);
      }
      // Start comprehensive debugging
      startDebugging() {
        this.isDebugging = true;
        this.log("🔍 MOBILE SAFARI AUTH DEBUGGER STARTED", "system");
        this.monitorStorage();
        this.monitorNavigation();
        this.monitorAuthContext();
      }
      // Comprehensive logging system
      log(message, type = "info", data = null) {
        const logEntry = {
          timestamp: Date.now(),
          relativeTime: Date.now() - this.startTime,
          type,
          message,
          data,
          url: window.location.href,
          userAgent: navigator.userAgent.substring(0, 100)
        };
        this.logs.push(logEntry);
        const emoji = type === "error" ? "❌" : type === "warning" ? "⚠️" : type === "success" ? "✅" : "📱";
        console.log("".concat(emoji, " [Mobile Safari Auth] ").concat(message), data || "");
        if (this.logs.length > 1e3) {
          this.logs = this.logs.slice(-500);
        }
      }
      // Monitor localStorage and sessionStorage changes
      monitorStorage() {
        const originalSetItem = Storage.prototype.setItem;
        const originalRemoveItem = Storage.prototype.removeItem;
        Storage.prototype.setItem = function(key, value) {
          var _a2;
          if (key.includes("auth") || key.includes("user") || key.includes("token")) {
            (_a2 = window.mobileSafariDebugger) == null ? void 0 : _a2.log("📦 Storage SET: ".concat(key), "storage", {
              key,
              value: value == null ? void 0 : value.substring(0, 100),
              storage: this === localStorage ? "localStorage" : "sessionStorage"
            });
          }
          return originalSetItem.call(this, key, value);
        };
        Storage.prototype.removeItem = function(key) {
          var _a2;
          if (key.includes("auth") || key.includes("user") || key.includes("token")) {
            (_a2 = window.mobileSafariDebugger) == null ? void 0 : _a2.log("🗑️ Storage REMOVE: ".concat(key), "storage", {
              key,
              storage: this === localStorage ? "localStorage" : "sessionStorage"
            });
          }
          return originalRemoveItem.call(this, key);
        };
      }
      // Monitor navigation attempts
      monitorNavigation() {
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        history.pushState = (...args) => {
          this.log("🧭 Navigation PUSH: ".concat(args[2]), "navigation", { args });
          this.checkForRedirectLoop(args[2]);
          return originalPushState.apply(history, args);
        };
        history.replaceState = (...args) => {
          this.log("🧭 Navigation REPLACE: ".concat(args[2]), "navigation", { args });
          this.checkForRedirectLoop(args[2]);
          return originalReplaceState.apply(history, args);
        };
        window.addEventListener("hashchange", (e) => {
          this.log("🧭 Hash change: ".concat(e.newURL), "navigation", { oldURL: e.oldURL, newURL: e.newURL });
        });
        document.addEventListener("visibilitychange", () => {
          if (!document.hidden) {
            this.log("👁️ Page visible - Auth check needed", "visibility");
            this.performComprehensiveAuthCheck();
          }
        });
      }
      // Check for redirect loops
      checkForRedirectLoop(url) {
        if ((url == null ? void 0 : url.includes("/auth")) || (url == null ? void 0 : url.includes("/login"))) {
          this.redirectAttempts.push({
            timestamp: Date.now(),
            url,
            authState: this.getAuthState()
          });
          const recentRedirects = this.redirectAttempts.filter(
            (r) => Date.now() - r.timestamp < 1e4
          );
          if (recentRedirects.length > 3) {
            this.log("🚨 REDIRECT LOOP DETECTED! ".concat(recentRedirects.length, " redirects in 10s"), "error", {
              redirects: recentRedirects,
              recommendedAction: "Emergency auth recovery needed"
            });
            this.triggerEmergencyRecovery();
          }
        }
      }
      // Monitor auth context changes
      monitorAuthContext() {
        window.mobileSafariAuthStateChange = (newState) => {
          this.log("🔐 Auth state change", "auth", newState);
          this.authPhases.push({
            timestamp: Date.now(),
            state: newState,
            phase: this.getCurrentAuthPhase()
          });
        };
      }
      // Get current auth state
      getAuthState() {
        return {
          localStorage: {
            user_data: !!localStorage.getItem("user_data"),
            auth_token: !!localStorage.getItem("auth_token"),
            backend_token: !!localStorage.getItem("backend_token")
          },
          sessionStorage: {
            user_data: !!sessionStorage.getItem("user_data"),
            auth_token: !!sessionStorage.getItem("auth_token"),
            mobile_auth_success: !!sessionStorage.getItem("mobile_auth_success")
          },
          url: window.location.href,
          timestamp: Date.now()
        };
      }
      // Determine current authentication phase
      getCurrentAuthPhase() {
        const hasLocalAuth = localStorage.getItem("user_data") && localStorage.getItem("auth_token");
        const hasSessionAuth = sessionStorage.getItem("user_data") && sessionStorage.getItem("auth_token");
        const isOnAuthPage = window.location.pathname.includes("/auth");
        if (!hasLocalAuth && !hasSessionAuth) return "unauthenticated";
        if (isOnAuthPage) return "auth_page_with_tokens";
        if (hasLocalAuth || hasSessionAuth) return "authenticated";
        return "unknown";
      }
      // Perform comprehensive authentication check
      performComprehensiveAuthCheck() {
        const authState = this.getAuthState();
        const phase = this.getCurrentAuthPhase();
        this.log("🔍 Comprehensive auth check", "check", {
          phase,
          authState,
          currentPath: window.location.pathname,
          shouldBeAuthenticated: (authState.localStorage.user_data || authState.sessionStorage.user_data) && (authState.localStorage.auth_token || authState.sessionStorage.auth_token)
        });
        const hasTokens = authState.localStorage.auth_token || authState.sessionStorage.auth_token;
        const hasUserData = authState.localStorage.user_data || authState.sessionStorage.user_data;
        const isOnAuthPage = window.location.pathname.includes("/auth");
        if (hasTokens && hasUserData && isOnAuthPage) {
          this.log("⚠️ INCONSISTENCY: Has valid auth but on auth page", "warning", {
            recommendation: "Should redirect to app",
            authState
          });
        }
        if (!hasTokens && !isOnAuthPage) {
          this.log("⚠️ INCONSISTENCY: No auth but not on auth page", "warning", {
            recommendation: "Should redirect to auth",
            authState
          });
        }
      }
      // Emergency recovery for stuck users
      triggerEmergencyRecovery() {
        this.log("🚨 EMERGENCY RECOVERY TRIGGERED", "error");
        try {
          this.showEmergencyUI();
          this.attemptAuthRecovery();
        } catch (error) {
          this.log("❌ Emergency recovery failed", "error", error);
        }
      }
      // Show emergency recovery UI
      showEmergencyUI() {
        const emergencyDiv = document.createElement("div");
        emergencyDiv.id = "mobile-safari-emergency-ui";
        emergencyDiv.style.cssText = "\n      position: fixed;\n      top: 0;\n      left: 0;\n      right: 0;\n      bottom: 0;\n      background: rgba(255, 0, 0, 0.9);\n      color: white;\n      padding: 20px;\n      z-index: 999999;\n      font-family: monospace;\n      overflow-y: auto;\n    ";
        emergencyDiv.innerHTML = '\n      <div style="text-align: center; margin-bottom: 20px;">\n        <h2>🚨 Mobile Safari Authentication Recovery</h2>\n        <p>A redirect loop was detected. Choose a recovery option:</p>\n      </div>\n      \n      <button onclick="window.mobileSafariDebugger.clearAllAuthAndReload()" \n              style="display: block; width: 100%; padding: 15px; margin: 10px 0; font-size: 16px; background: #ff4444; color: white; border: none; border-radius: 5px;">\n        🔄 Clear All Auth Data & Reload\n      </button>\n      \n      <button onclick="window.mobileSafariDebugger.forceAuthPage()" \n              style="display: block; width: 100%; padding: 15px; margin: 10px 0; font-size: 16px; background: #4444ff; color: white; border: none; border-radius: 5px;">\n        🔐 Force Go To Login Page\n      </button>\n      \n      <button onclick="window.mobileSafariDebugger.forceAppPage()" \n              style="display: block; width: 100%; padding: 15px; margin: 10px 0; font-size: 16px; background: #44ff44; color: white; border: none; border-radius: 5px;">\n        🏠 Force Go To App (If You Have Valid Auth)\n      </button>\n      \n      <button onclick="window.mobileSafariDebugger.exportDebugData()" \n              style="display: block; width: 100%; padding: 15px; margin: 10px 0; font-size: 16px; background: #ffaa44; color: white; border: none; border-radius: 5px;">\n        📊 Export Debug Data\n      </button>\n      \n      <button onclick="document.getElementById(\'mobile-safari-emergency-ui\').remove()" \n              style="display: block; width: 100%; padding: 15px; margin: 10px 0; font-size: 16px; background: #888; color: white; border: none; border-radius: 5px;">\n        ❌ Close (Continue At Your Own Risk)\n      </button>\n      \n      <div style="margin-top: 20px; font-size: 12px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;">\n        <strong>Debug Info:</strong><br>\n        Redirects: '.concat(this.redirectAttempts.length, "<br>\n        Current URL: ").concat(window.location.href, "<br>\n        Logs: ").concat(this.logs.length, "<br>\n        Time: ").concat((/* @__PURE__ */ new Date()).toLocaleTimeString(), "\n      </div>\n    ");
        document.body.appendChild(emergencyDiv);
      }
      // Recovery methods
      clearAllAuthAndReload() {
        this.log("🔄 Emergency: Clearing all auth data", "recovery");
        localStorage.clear();
        sessionStorage.clear();
        document.cookie.split(";").forEach(function(c) {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + (/* @__PURE__ */ new Date()).toUTCString() + ";path=/");
        });
        window.location.href = "/auth/signin";
      }
      forceAuthPage() {
        this.log("🔐 Emergency: Forcing auth page", "recovery");
        window.location.href = "/auth/signin";
      }
      forceAppPage() {
        this.log("🏠 Emergency: Forcing app page", "recovery");
        window.location.href = "/rooms";
      }
      // Export debug data
      exportDebugData() {
        const debugData = {
          logs: this.logs,
          authPhases: this.authPhases,
          redirectAttempts: this.redirectAttempts,
          authState: this.getAuthState(),
          userAgent: navigator.userAgent,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          url: window.location.href
        };
        const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "mobile-safari-auth-debug-".concat(Date.now(), ".json");
        a.click();
        URL.revokeObjectURL(url);
        this.log("📊 Debug data exported", "export");
      }
      // Inject debug UI for development
      injectDebugUI() {
        document.addEventListener("keydown", (e) => {
          if (e.ctrlKey && e.shiftKey && e.key === "D") {
            e.preventDefault();
            this.showDebugConsole();
          }
        });
        const debugButton = document.createElement("button");
        debugButton.textContent = "📱 Debug";
        debugButton.style.cssText = "\n      position: fixed;\n      bottom: 20px;\n      right: 20px;\n      z-index: 99999;\n      padding: 10px;\n      background: #333;\n      color: white;\n      border: none;\n      border-radius: 5px;\n      font-size: 12px;\n      cursor: pointer;\n    ";
        debugButton.onclick = () => this.showDebugConsole();
        document.body.appendChild(debugButton);
      }
      // Show debug console
      showDebugConsole() {
        const existing = document.getElementById("mobile-safari-debug-console");
        if (existing) {
          existing.remove();
          return;
        }
        const debugDiv = document.createElement("div");
        debugDiv.id = "mobile-safari-debug-console";
        debugDiv.style.cssText = "\n      position: fixed;\n      top: 10px;\n      left: 10px;\n      right: 10px;\n      bottom: 10px;\n      background: rgba(0, 0, 0, 0.95);\n      color: #00ff00;\n      padding: 20px;\n      z-index: 99998;\n      font-family: monospace;\n      font-size: 10px;\n      overflow-y: auto;\n      border: 2px solid #00ff00;\n    ";
        const recentLogs = this.logs.slice(-50);
        debugDiv.innerHTML = '\n      <div style="position: sticky; top: 0; background: rgba(0,0,0,0.9); padding: 10px; margin: -20px -20px 10px -20px;">\n        <h3>📱 Mobile Safari Auth Debugger (Ctrl+Shift+D to close)</h3>\n        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 10px;">\n          <button onclick="window.mobileSafariDebugger.performComprehensiveAuthCheck()" style="padding: 5px 10px; background: #333; color: white; border: 1px solid #555;">🔍 Auth Check</button>\n          <button onclick="window.mobileSafariDebugger.exportDebugData()" style="padding: 5px 10px; background: #333; color: white; border: 1px solid #555;">📊 Export Data</button>\n          <button onclick="window.mobileSafariDebugger.clearAllAuthAndReload()" style="padding: 5px 10px; background: #ff4444; color: white; border: 1px solid #555;">🔄 Emergency Reset</button>\n        </div>\n      </div>\n      \n      <div><strong>📊 Stats:</strong> '.concat(this.logs.length, " logs, ").concat(this.redirectAttempts.length, " redirects, Phase: ").concat(this.getCurrentAuthPhase(), "</div>\n      <div><strong>🌐 URL:</strong> ").concat(window.location.href, "</div>\n      <div><strong>⏰ Runtime:</strong> ").concat(Math.round((Date.now() - this.startTime) / 1e3), 's</div>\n      \n      <hr style="margin: 15px 0; border: 1px solid #333;">\n      \n      <div><strong>📝 Recent Logs:</strong></div>\n      ').concat(recentLogs.map((log2) => '\n        <div style="margin: 5px 0; padding: 5px; background: rgba(255,255,255,0.05); border-left: 3px solid '.concat(log2.type === "error" ? "#ff4444" : log2.type === "warning" ? "#ffaa44" : log2.type === "success" ? "#44ff44" : "#4444ff", ';">\n          <strong>[').concat(new Date(log2.timestamp).toLocaleTimeString(), "]</strong> ").concat(log2.message, "\n          ").concat(log2.data ? '<br><pre style="margin: 5px 0 0 0; font-size: 9px; color: #ccc;">'.concat(JSON.stringify(log2.data, null, 2).substring(0, 200), "</pre>") : "", "\n        </div>\n      ")).join(""), "\n    ");
        document.body.appendChild(debugDiv);
      }
      // Attempt automatic auth recovery
      attemptAuthRecovery() {
        this.log("🔧 Attempting automatic auth recovery", "recovery");
        const authState = this.getAuthState();
        if ((authState.localStorage.auth_token || authState.sessionStorage.auth_token) && (authState.localStorage.user_data || authState.sessionStorage.user_data)) {
          this.syncAuthStorage();
          if (window.location.pathname.includes("/auth")) {
            this.log("🔧 Recovery: Has valid auth, redirecting to app", "recovery");
            setTimeout(() => {
              window.location.href = "/rooms";
            }, 1e3);
          }
        }
      }
      // Track auth state changes (called by components)
      trackAuthState(stateData) {
        try {
          const stateEntry = {
            timestamp: Date.now(),
            data: stateData,
            phase: this.getCurrentAuthPhase(),
            url: window.location.href
          };
          this.authPhases.push(stateEntry);
          if (this.authPhases.length > 100) {
            this.authPhases = this.authPhases.slice(-50);
          }
          this.log("🔐 AUTH STATE TRACKED", "auth", stateData);
        } catch (error) {
          this.log("❌ Failed to track auth state", "error", error);
        }
      }
      // Sync authentication storage
      syncAuthStorage() {
        try {
          const localUser = localStorage.getItem("user_data");
          const localToken = localStorage.getItem("auth_token");
          if (localUser && localToken) {
            sessionStorage.setItem("user_data", localUser);
            sessionStorage.setItem("auth_token", localToken);
            sessionStorage.setItem("mobile_auth_success", "true");
            this.log("🔧 Synced localStorage to sessionStorage", "recovery");
          }
          const sessionUser = sessionStorage.getItem("user_data");
          const sessionToken = sessionStorage.getItem("auth_token");
          if (sessionUser && sessionToken && !localUser) {
            localStorage.setItem("user_data", sessionUser);
            localStorage.setItem("auth_token", sessionToken);
            this.log("🔧 Synced sessionStorage to localStorage", "recovery");
          }
        } catch (error) {
          this.log("❌ Storage sync failed", "error", error);
        }
      }
    }
    const mobileSafariAuthDebugger = new MobileSafariAuthDebugger();
    if (typeof window !== "undefined") {
      window.mobileSafariDebugger = mobileSafariAuthDebugger;
      console.log("🔧 Mobile Safari Auth Debugger v2.0 - trackAuthState method FIXED!");
    }
    const EnhancedAuthContext = reactExports.createContext({});
    const useAuth$1 = () => reactExports.useContext(EnhancedAuthContext);
    const EnhancedAuthProvider = ({ children }) => {
      const [user, setUser] = reactExports.useState(null);
      const [loading, setLoading] = reactExports.useState(true);
      const [session, setSession] = reactExports.useState(null);
      const [backendToken, setBackendToken] = reactExports.useState(null);
      const [authError, setAuthError] = reactExports.useState(null);
      const [isAuthenticated, setIsAuthenticated] = reactExports.useState(false);
      const [sessionValid, setSessionValid] = reactExports.useState(true);
      const [lastSessionCheck, setLastSessionCheck] = reactExports.useState(Date.now());
      const sessionCheckInterval = reactExports.useRef(null);
      const initializationRef = reactExports.useRef(false);
      const [authStateReady, setAuthStateReady] = reactExports.useState(false);
      const [mobileSessionRestored, setMobileSessionRestored] = reactExports.useState(false);
      const isMobileSafari = reactExports.useMemo(() => {
        return /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS/i.test(navigator.userAgent);
      }, []);
      const isMobileSafariAuthenticated = reactExports.useMemo(() => {
        if (!isMobileSafari) {
          return isAuthenticated;
        }
        const hasStoredAuth = !!(localStorage.getItem("user_data") || sessionStorage.getItem("user_data")) && !!(localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token"));
        return isAuthenticated || mobileSessionRestored || hasStoredAuth;
      }, [isAuthenticated, mobileSessionRestored, isMobileSafari]);
      const syncUserToBackend = reactExports.useCallback((userData) => __async(null, null, function* () {
        try {
          const apiUrl = getApiUrl();
          if (!apiUrl) {
            return { success: false, error: "No API URL" };
          }
          const response = yield fetch("".concat(apiUrl, "/api/auth/appwrite-sync"), {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              appwrite_user_id: userData.$id || userData.id,
              email: userData.email,
              username: userData.name || userData.username || userData.email.split("@")[0],
              user_metadata: {
                provider: "appwrite",
                created_at: userData.$createdAt || (/* @__PURE__ */ new Date()).toISOString(),
                updated_at: userData.$updatedAt || (/* @__PURE__ */ new Date()).toISOString()
              }
            }),
            signal: AbortSignal.timeout(1e4)
            // 10s timeout
          });
          if (!response.ok) {
            if (response.status === 405 || response.status === 404) {
              return { success: false, error: "Endpoint not available" };
            }
            throw new Error("Backend sync failed: ".concat(response.status));
          }
          const data = yield response.json();
          if (data.backend_token) {
            localStorage.setItem("backend_token", data.backend_token);
            localStorage.setItem("auth_token", data.backend_token);
            setBackendToken(data.backend_token);
          }
          return { success: true, data };
        } catch (error) {
          return { success: false, error: error.message };
        }
      }), []);
      const generateAuthToken = reactExports.useCallback((userData, sessionData) => {
        if (!userData) {
          return null;
        }
        let token = null;
        if (sessionData) {
          token = sessionData.secret || sessionData.$id;
        }
        if (!token && userData.$id) {
          token = "appwrite_user_".concat(userData.$id, "_").concat(Date.now());
        }
        if (token) {
          try {
            localStorage.setItem("auth_token", token);
            localStorage.setItem("token", token);
            localStorage.setItem("backend_token", token);
            const isMobileSafari2 = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
            if (isMobileSafari2) {
              sessionStorage.setItem("auth_token", token);
              sessionStorage.setItem("backend_token", token);
            }
            setBackendToken(token);
          } catch (error) {
            setBackendToken(token);
          }
        }
        return token;
      }, []);
      const updateAuthState = reactExports.useCallback((userData, sessionData) => __async(null, null, function* () {
        if (userData && sessionData) {
          setUser(userData);
          setSession(sessionData);
          setIsAuthenticated(true);
          setSessionValid(true);
          setAuthError(null);
          generateAuthToken(userData, sessionData);
          try {
            localStorage.setItem("user_data", JSON.stringify(userData));
            const isMobileSafari2 = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
            if (isMobileSafari2) {
              sessionStorage.setItem("user_data", JSON.stringify(userData));
            }
          } catch (error) {
          }
          syncUserToBackend(userData).catch((error) => {
          });
        } else {
          setUser(null);
          setSession(null);
          setIsAuthenticated(false);
          setSessionValid(false);
          setBackendToken(null);
          try {
            const keysToRemove = ["user_data", "auth_token", "backend_token", "token"];
            keysToRemove.forEach((key) => localStorage.removeItem(key));
          } catch (error) {
          }
        }
      }), [generateAuthToken, syncUserToBackend]);
      const validateCurrentSession = reactExports.useCallback((force = false) => __async(null, null, function* () {
        const now = Date.now();
        if (!force && now - lastSessionCheck < 3e5) {
          return sessionValid;
        }
        setLastSessionCheck(now);
        try {
          const isValid = yield enhancedAuth.validateSession(force);
          setSessionValid(isValid);
          if (!isValid && isAuthenticated) {
            yield updateAuthState(null, null);
          }
          return isValid;
        } catch (error) {
          return sessionValid;
        }
      }), [sessionValid, lastSessionCheck, isAuthenticated, updateAuthState]);
      const initializeAuth = reactExports.useCallback(() => __async(null, null, function* () {
        if (initializationRef.current) {
          mobileSafariAuthDebugger.log("⚠️ AUTH INIT SKIPPED - Already initializing");
          return;
        }
        initializationRef.current = true;
        mobileSafariAuthDebugger.log("🚀 ENHANCED AUTH INITIALIZATION STARTED", {
          isMobileSafari,
          currentUrl: window.location.href,
          hasInitRef: initializationRef.current,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (isMobileSafari) {
          mobileSafariAuthDebugger.log("📱 MOBILE SAFARI: Early auth state ready");
          setAuthStateReady(true);
        }
        try {
          const oauthRedirected = sessionStorage.getItem("oauth-redirected");
          const isOAuthCallback = window.location.hash.includes("/auth/success") || oauthRedirected;
          const cachedToken = localStorage.getItem("auth_token") || localStorage.getItem("backend_token") || (isMobileSafari ? sessionStorage.getItem("auth_token") : null);
          const cachedUser = localStorage.getItem("user_data") || (isMobileSafari ? sessionStorage.getItem("user_data") : null);
          if (cachedToken && cachedUser) {
            try {
              const userData = JSON.parse(cachedUser);
              if (isOAuthCallback) {
                setUser(userData);
                setBackendToken(cachedToken);
                setIsAuthenticated(true);
                setSession({ access_token: cachedToken });
              } else {
                if (isMobileSafari) {
                  setUser(userData);
                  setBackendToken(cachedToken);
                  setIsAuthenticated(true);
                  setSession({ access_token: cachedToken });
                  setMobileSessionRestored(true);
                  setTimeout(() => __async(null, null, function* () {
                    try {
                      const isSessionValid = yield enhancedAuth.validateSession(false);
                      if (!isSessionValid) {
                        const freshUser = localStorage.getItem("user_data") || sessionStorage.getItem("user_data");
                        if (!freshUser) {
                          yield updateAuthState(null, null);
                        }
                      }
                    } catch (error) {
                    }
                  }), 2e3);
                } else {
                  const isSessionValid = yield enhancedAuth.validateSession(true);
                  if (isSessionValid) {
                    setUser(userData);
                    setBackendToken(cachedToken);
                    setIsAuthenticated(true);
                    setSession({ access_token: cachedToken });
                  } else {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("backend_token");
                    localStorage.removeItem("user_data");
                    setIsAuthenticated(false);
                    setUser(null);
                    setSession(null);
                  }
                }
              }
            } catch (parseError) {
              localStorage.removeItem("auth_token");
              localStorage.removeItem("backend_token");
              localStorage.removeItem("user_data");
              setIsAuthenticated(false);
            }
          }
          const authStatus = yield enhancedAuth.init();
          if (authStatus.isAuthenticated && authStatus.user) {
            yield updateAuthState(authStatus.user, authStatus.session);
          } else {
            yield updateAuthState(null, null);
          }
          if (sessionCheckInterval.current) {
            clearInterval(sessionCheckInterval.current);
          }
          sessionCheckInterval.current = setInterval(() => {
            if (isAuthenticated) {
              validateCurrentSession().catch((error) => {
              });
            }
          }, 3e5);
        } catch (error) {
          setAuthError(error.message);
          const cachedToken = localStorage.getItem("auth_token");
          const cachedUser = localStorage.getItem("user_data");
          if (cachedToken && cachedUser) {
            try {
              const userData = JSON.parse(cachedUser);
              const oauthRedirected = sessionStorage.getItem("oauth-redirected");
              const isOAuthCallback = window.location.hash.includes("/auth/success") || oauthRedirected;
              if (isOAuthCallback) {
                setUser(userData);
                setBackendToken(cachedToken);
                setIsAuthenticated(true);
                setSession({ access_token: cachedToken });
              } else {
                if (isMobileSafari) {
                  setUser(userData);
                  setBackendToken(cachedToken);
                  setIsAuthenticated(true);
                  setSession({ access_token: cachedToken });
                  setMobileSessionRestored(true);
                  setTimeout(() => __async(null, null, function* () {
                    try {
                      const isSessionValid = yield enhancedAuth.validateSession(false);
                      if (!isSessionValid) {
                        try {
                          const freshAuth = yield enhancedAuth.init();
                          if (freshAuth.isAuthenticated) {
                            yield updateAuthState(freshAuth.user, freshAuth.session);
                          }
                        } catch (refreshError) {
                        }
                      }
                    } catch (error2) {
                    }
                  }), 1500);
                } else {
                  try {
                    const isSessionValid = yield enhancedAuth.validateSession(true);
                    if (isSessionValid) {
                      setUser(userData);
                      setBackendToken(cachedToken);
                      setIsAuthenticated(true);
                      setSession({ access_token: cachedToken });
                    } else {
                      localStorage.removeItem("auth_token");
                      localStorage.removeItem("backend_token");
                      localStorage.removeItem("user_data");
                      setIsAuthenticated(false);
                    }
                  } catch (validationError) {
                    localStorage.removeItem("auth_token");
                    localStorage.removeItem("backend_token");
                    localStorage.removeItem("user_data");
                    setIsAuthenticated(false);
                  }
                }
              }
            } catch (e) {
              setIsAuthenticated(false);
            }
          }
        } finally {
          setLoading(false);
          if (!authStateReady) {
            setAuthStateReady(true);
          }
          initializationRef.current = false;
        }
      }), [updateAuthState, validateCurrentSession, isAuthenticated]);
      const loginWithEmail = reactExports.useCallback((email, password) => __async(null, null, function* () {
        if (!email || !password) {
          const errorMsg = "Email and password are required";
          setAuthError(errorMsg);
          throw new Error(errorMsg);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          const errorMsg = "Please enter a valid email address";
          setAuthError(errorMsg);
          throw new Error(errorMsg);
        }
        setLoading(true);
        setAuthError(null);
        try {
          const result = yield enhancedAuth.loginWithEmail(email, password);
          if (!result || !result.user) {
            throw new Error("Invalid login response - no user data received");
          }
          yield updateAuthState(result.user, result.session);
          const isMobileSafari2 = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
          if (isMobileSafari2) {
            sessionStorage.setItem("mobile_auth_success", "true");
            sessionStorage.setItem("user_data", JSON.stringify(result.user));
          }
          return { success: true };
        } catch (error) {
          let errorMessage = error.message;
          if (error.message.includes("Invalid credentials")) {
            errorMessage = "Invalid email or password. Please try again.";
          } else if (error.message.includes("User not found")) {
            errorMessage = "No account found with this email. Please register first.";
          } else if (error.message.includes("network")) {
            errorMessage = "Network error. Please check your connection and try again.";
          }
          setAuthError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      }), [updateAuthState]);
      const loginWithOAuth = reactExports.useCallback((provider) => __async(null, null, function* () {
        setLoading(true);
        setAuthError(null);
        try {
          const baseUrl = window.location.origin;
          const successUrl = "".concat(baseUrl, "/auth/callback");
          const failureUrl = "".concat(baseUrl, "/auth/error");
          yield enhancedAuth.loginWithOAuth(provider, successUrl, failureUrl);
        } catch (error) {
          setAuthError(error.message);
          setLoading(false);
          throw error;
        }
      }), []);
      const handleOAuthCallback2 = reactExports.useCallback(() => __async(null, null, function* () {
        setLoading(true);
        setAuthError(null);
        try {
          const result = yield enhancedAuth.handleOAuthCallback();
          yield updateAuthState(result.user, result.session);
          return { success: true };
        } catch (error) {
          setAuthError(error.message);
          throw error;
        } finally {
          setLoading(false);
        }
      }), [updateAuthState]);
      const register = reactExports.useCallback((email, password, username) => __async(null, null, function* () {
        if (!email || !password) {
          const errorMsg = "Email and password are required";
          setAuthError(errorMsg);
          throw new Error(errorMsg);
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          const errorMsg = "Please enter a valid email address";
          setAuthError(errorMsg);
          throw new Error(errorMsg);
        }
        if (password.length < 8) {
          const errorMsg = "Password must be at least 8 characters long";
          setAuthError(errorMsg);
          throw new Error(errorMsg);
        }
        setLoading(true);
        setAuthError(null);
        try {
          const result = yield enhancedAuth.register(email, password, username);
          if (!result || !result.user) {
            throw new Error("Invalid registration response - no user data received");
          }
          yield updateAuthState(result.user, result.session);
          const isMobileSafari2 = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent);
          if (isMobileSafari2) {
            sessionStorage.setItem("mobile_auth_success", "true");
            sessionStorage.setItem("user_data", JSON.stringify(result.user));
          }
          return { success: true };
        } catch (error) {
          let errorMessage = error.message;
          if (error.message.includes("already exists") || error.message.includes("already registered")) {
            errorMessage = "An account with this email already exists. Please sign in instead.";
          } else if (error.message.includes("weak password")) {
            errorMessage = "Password is too weak. Please use a stronger password.";
          } else if (error.message.includes("network")) {
            errorMessage = "Network error. Please check your connection and try again.";
          }
          setAuthError(errorMessage);
          throw new Error(errorMessage);
        } finally {
          setLoading(false);
        }
      }), [updateAuthState]);
      const logout = reactExports.useCallback(() => __async(null, null, function* () {
        setLoading(true);
        try {
          if (sessionCheckInterval.current) {
            clearInterval(sessionCheckInterval.current);
            sessionCheckInterval.current = null;
          }
          yield enhancedAuth.logout();
          yield updateAuthState(null, null);
          window.location.replace("#/auth");
        } catch (error) {
          yield updateAuthState(null, null);
          window.location.replace("#/auth");
        } finally {
          setLoading(false);
        }
      }), [updateAuthState]);
      const getApiToken = reactExports.useCallback(() => __async(null, null, function* () {
        if (backendToken) {
          return backendToken;
        }
        const storedToken = localStorage.getItem("backend_token") || localStorage.getItem("auth_token");
        if (storedToken) {
          return storedToken;
        }
        if (session == null ? void 0 : session.access_token) {
          return session.access_token;
        }
        if (session == null ? void 0 : session.$id) {
          return session.$id;
        }
        if (user) {
          const syntheticToken = "user_".concat(user.$id || user.id, "_").concat(Date.now());
          setBackendToken(syntheticToken);
          return syntheticToken;
        }
        return null;
      }), [backendToken, session, user]);
      reactExports.useEffect(() => {
        initializeAuth();
        return () => {
          if (sessionCheckInterval.current) {
            clearInterval(sessionCheckInterval.current);
          }
        };
      }, [initializeAuth]);
      const refreshAuth = reactExports.useCallback(() => __async(null, null, function* () {
        setLoading(true);
        try {
          const authStatus = yield enhancedAuth.init();
          if (authStatus.isAuthenticated && authStatus.user) {
            yield updateAuthState(authStatus.user, authStatus.session);
            return { success: true, authenticated: true };
          } else {
            yield updateAuthState(null, null);
            return { success: true, authenticated: false };
          }
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          setLoading(false);
        }
      }), [updateAuthState]);
      const value = {
        // Auth state
        user,
        session,
        loading,
        backendToken,
        isAuthenticated: isMobileSafariAuthenticated,
        // Use mobile Safari aware state
        authError,
        sessionValid,
        authStateReady,
        // Expose ready state for protected routes
        isMobileSafariAuthenticated,
        // Enhanced mobile Safari auth state
        // Auth methods
        loginWithEmail,
        loginWithOAuth,
        handleOAuthCallback: handleOAuthCallback2,
        register,
        logout,
        // Utility methods
        getApiToken,
        validateSession: validateCurrentSession,
        refreshAuth,
        // Legacy compatibility
        signOut: logout,
        appwriteUser: user,
        appwriteSession: session,
        useAppwrite: true,
        getCurrentAuthProvider: () => isAuthenticated ? "appwrite" : null,
        isAppwriteAvailable: () => isAuthenticated,
        getApiTokenSync: () => {
          const storedBackendToken = localStorage.getItem("backend_token");
          const storedAuthToken = localStorage.getItem("auth_token");
          const sessionToken = (session == null ? void 0 : session.access_token) || (session == null ? void 0 : session.$id);
          const token = storedBackendToken || storedAuthToken || backendToken || sessionToken;
          if (!token && user) {
            const syntheticToken = "appwrite_".concat(user.$id || user.id, "_").concat(Date.now());
            localStorage.setItem("backend_token", syntheticToken);
            return syntheticToken;
          }
          return token;
        }
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsx(EnhancedAuthContext.Provider, { value, children });
    };
    class NativeAuthService {
      constructor() {
        this.isNative = Capacitor.isNativePlatform();
        this.baseURL = this.getServerURL();
        this.currentUser = null;
        this.authCallbacks = [];
      }
      /**
       * Get server URL based on platform
       */
      getServerURL() {
        if (typeof window !== "undefined") {
          const hostname = window.location.hostname;
          if (hostname.includes("recursionsystems.com")) {
            return "";
          }
        }
        return "http://localhost:5174";
      }
      /**
       * Register authentication state change callback
       */
      onAuthStateChange(callback) {
        this.authCallbacks.push(callback);
        callback(this.currentUser);
      }
      /**
       * Notify all callbacks of auth state change
       */
      notifyAuthChange(user) {
        this.currentUser = user;
        this.authCallbacks.forEach((callback) => callback(user));
      }
      /**
       * Sign up with email and password (native)
       */
      signUp(_0) {
        return __async(this, arguments, function* ({ email, password, userData = {} }) {
          try {
            const deviceInfo = yield this.getDeviceInfo();
            const response = yield fetch("".concat(this.baseURL, "/api/auth/signup"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Device-Info": JSON.stringify(deviceInfo)
              },
              body: JSON.stringify(__spreadProps(__spreadValues({
                email,
                password
              }, userData), {
                platform: "native-mobile"
              }))
            });
            const result = yield response.json();
            if (!response.ok) {
              throw new Error(result.message || "Signup failed");
            }
            if (result.user && result.session) {
              yield this.storeSession(result.session);
              this.notifyAuthChange(result.user);
            }
            return { user: result.user, session: result.session, error: null };
          } catch (error) {
            return { user: null, session: null, error };
          }
        });
      }
      /**
       * Sign in with email and password (native)
       */
      signIn(_0) {
        return __async(this, arguments, function* ({ email, password }) {
          try {
            const deviceInfo = yield this.getDeviceInfo();
            const response = yield fetch("".concat(this.baseURL, "/api/auth/signin"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Device-Info": JSON.stringify(deviceInfo)
              },
              body: JSON.stringify({
                email,
                password,
                platform: "native-mobile"
              })
            });
            const result = yield response.json();
            if (!response.ok) {
              throw new Error(result.message || "Sign in failed");
            }
            if (result.user && result.session) {
              yield this.storeSession(result.session);
              this.notifyAuthChange(result.user);
            }
            return { user: result.user, session: result.session, error: null };
          } catch (error) {
            return { user: null, session: null, error };
          }
        });
      }
      /**
       * Sign out and clear stored session
       */
      signOut() {
        return __async(this, null, function* () {
          try {
            const session = yield this.getStoredSession();
            if (session == null ? void 0 : session.access_token) {
              yield fetch("".concat(this.baseURL, "/api/auth/signout"), {
                method: "POST",
                headers: {
                  "Authorization": "Bearer ".concat(session.access_token),
                  "Content-Type": "application/json"
                }
              });
            }
            yield this.clearStoredSession();
            this.notifyAuthChange(null);
            return { error: null };
          } catch (error) {
            return { error };
          }
        });
      }
      /**
       * Get current user session
       */
      getSession() {
        return __async(this, null, function* () {
          try {
            const storedSession = yield this.getStoredSession();
            if (!(storedSession == null ? void 0 : storedSession.access_token)) {
              return { session: null, user: null };
            }
            const response = yield fetch("".concat(this.baseURL, "/api/auth/user"), {
              headers: {
                "Authorization": "Bearer ".concat(storedSession.access_token)
              }
            });
            if (!response.ok) {
              yield this.clearStoredSession();
              this.notifyAuthChange(null);
              return { session: null, user: null };
            }
            const userData = yield response.json();
            this.notifyAuthChange(userData.user);
            return { session: storedSession, user: userData.user };
          } catch (error) {
            return { session: null, user: null, error };
          }
        });
      }
      /**
       * Refresh expired access token
       */
      refreshSession() {
        return __async(this, null, function* () {
          try {
            const session = yield this.getStoredSession();
            if (!(session == null ? void 0 : session.refresh_token)) {
              throw new Error("No refresh token available");
            }
            const response = yield fetch("".concat(this.baseURL, "/api/auth/refresh"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                refresh_token: session.refresh_token
              })
            });
            const result = yield response.json();
            if (!response.ok) {
              yield this.clearStoredSession();
              this.notifyAuthChange(null);
              throw new Error(result.message || "Token refresh failed");
            }
            yield this.storeSession(result.session);
            return { session: result.session, user: result.user, error: null };
          } catch (error) {
            return { session: null, user: null, error };
          }
        });
      }
      /**
       * Store session securely on device
       */
      storeSession(session) {
        return __async(this, null, function* () {
          if (!this.isNative) {
            localStorage.setItem("recursion_auth_session", JSON.stringify(session));
            return;
          }
          yield Preferences.set({
            key: "recursion_auth_session",
            value: JSON.stringify(session)
          });
        });
      }
      /**
       * Get stored session from secure storage
       */
      getStoredSession() {
        return __async(this, null, function* () {
          if (!this.isNative) {
            const stored = localStorage.getItem("recursion_auth_session");
            return stored ? JSON.parse(stored) : null;
          }
          const result = yield Preferences.get({ key: "recursion_auth_session" });
          return result.value ? JSON.parse(result.value) : null;
        });
      }
      /**
       * Clear stored session
       */
      clearStoredSession() {
        return __async(this, null, function* () {
          if (!this.isNative) {
            localStorage.removeItem("recursion_auth_session");
            return;
          }
          yield Preferences.remove({ key: "recursion_auth_session" });
        });
      }
      /**
       * Get device information for security
       */
      getDeviceInfo() {
        return __async(this, null, function* () {
          if (!this.isNative) {
            return {
              platform: "web",
              userAgent: navigator.userAgent
            };
          }
          try {
            const deviceInfo = yield Device.getInfo();
            return {
              platform: deviceInfo.platform,
              model: deviceInfo.model,
              operatingSystem: deviceInfo.operatingSystem,
              osVersion: deviceInfo.osVersion,
              manufacturer: deviceInfo.manufacturer,
              isVirtual: deviceInfo.isVirtual
            };
          } catch (error) {
            return { platform: "mobile", error: error.message };
          }
        });
      }
      /**
       * Check if biometric authentication is available
       */
      isBiometricAvailable() {
        return __async(this, null, function* () {
          if (!this.isNative) {
            return false;
          }
          try {
            return window.Capacitor && window.Capacitor.isNativePlatform();
          } catch (error) {
            console.log("Biometric auth not available:", error.message);
            return false;
          }
        });
      }
      /**
       * Enable biometric authentication for user
       */
      enableBiometric(_0) {
        return __async(this, arguments, function* ({ email, password }) {
          if (!this.isNative || !(yield this.isBiometricAvailable())) {
            throw new Error("Biometric authentication not available");
          }
          try {
            const signInResult = yield this.signIn({ email, password });
            if (signInResult.error) {
              throw signInResult.error;
            }
            yield Preferences.set({
              key: "recursion_biometric_email",
              value: email
            });
            yield Preferences.set({
              key: "recursion_biometric_enabled",
              value: "true"
            });
            return { success: true, error: null };
          } catch (error) {
            return { success: false, error };
          }
        });
      }
      /**
       * Authenticate using biometrics
       */
      authenticateWithBiometric() {
        return __async(this, null, function* () {
          if (!this.isNative || !(yield this.isBiometricAvailable())) {
            throw new Error("Biometric authentication not available");
          }
          try {
            const biometricEnabled = yield Preferences.get({ key: "recursion_biometric_enabled" });
            if (biometricEnabled.value !== "true") {
              throw new Error("Biometric authentication not enabled");
            }
            const userConfirmed = window.confirm(
              "Biometric Authentication\n\nUse your fingerprint or face to sign in to Recursion Chat"
            );
            if (!userConfirmed) {
              throw new Error("Biometric verification cancelled");
            }
            const emailResult = yield Preferences.get({ key: "recursion_biometric_email" });
            const email = emailResult.value;
            if (!email) {
              throw new Error("No biometric credentials stored");
            }
            const response = yield fetch("".concat(this.baseURL, "/api/auth/biometric"), {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                email,
                biometric_verified: true,
                device_info: yield this.getDeviceInfo()
              })
            });
            const authResult = yield response.json();
            if (!response.ok) {
              throw new Error(authResult.message || "Biometric authentication failed");
            }
            if (authResult.user && authResult.session) {
              yield this.storeSession(authResult.session);
              this.notifyAuthChange(authResult.user);
            }
            return { user: authResult.user, session: authResult.session, error: null };
          } catch (error) {
            return { user: null, session: null, error };
          }
        });
      }
      /**
       * Disable biometric authentication
       */
      disableBiometric() {
        return __async(this, null, function* () {
          yield Preferences.remove({ key: "recursion_biometric_enabled" });
          yield Preferences.remove({ key: "recursion_biometric_email" });
        });
      }
    }
    const nativeAuth = new NativeAuthService();
    const NativeAuthContext = reactExports.createContext({});
    const useNativeAuth = () => reactExports.useContext(NativeAuthContext);
    const NativeAuthProvider = ({ children }) => {
      const [user, setUser] = reactExports.useState(null);
      const [loading, setLoading] = reactExports.useState(true);
      const [session, setSession] = reactExports.useState(null);
      const [isNativeApp] = reactExports.useState(Capacitor.isNativePlatform());
      reactExports.useEffect(() => {
        console.log("[NativeAuthContext] ==> INITIALIZING NATIVE AUTH");
        console.log("[NativeAuthContext] Initial state:");
        console.log("[NativeAuthContext] - isNativeApp:", isNativeApp);
        console.log("[NativeAuthContext] - Capacitor platform:", Capacitor.getPlatform());
        console.log("[NativeAuthContext] - User agent:", navigator.userAgent);
        initializeAuth();
        console.log("[NativeAuthContext] Setting up auth state listener...");
        nativeAuth.onAuthStateChange((user2) => {
          console.log("[NativeAuthContext] Auth state changed:");
          console.log("[NativeAuthContext] - New user:", user2 ? "AUTHENTICATED" : "NOT_AUTHENTICATED");
          if (user2) {
            console.log("[NativeAuthContext] - User details:", { id: user2.id, email: user2.email });
          }
          setUser(user2);
          setLoading(false);
        });
        console.log("[NativeAuthContext] Native auth initialization complete");
      }, []);
      const initializeAuth = () => __async(null, null, function* () {
        var _a2;
        try {
          console.log("[NativeAuthContext] Starting auth initialization...");
          setLoading(true);
          console.log("[NativeAuthContext] Calling nativeAuth.getSession()...");
          const result = yield nativeAuth.getSession();
          console.log("[NativeAuthContext] GetSession result:", result);
          if (result.session && result.user) {
            console.log("[NativeAuthContext] ✅ Valid session found:");
            console.log("[NativeAuthContext] - Session token length:", (_a2 = result.session.access_token) == null ? void 0 : _a2.length);
            console.log("[NativeAuthContext] - User details:", { id: result.user.id, email: result.user.email });
            setSession(result.session);
            setUser(result.user);
          } else {
            console.log("[NativeAuthContext] ❌ No valid session found");
            console.log("[NativeAuthContext] - Session exists:", !!result.session);
            console.log("[NativeAuthContext] - User exists:", !!result.user);
            setSession(null);
            setUser(null);
          }
        } catch (error) {
          console.error("[NativeAuthContext] ❌ Error initializing auth:", error.message);
          console.error("[NativeAuthContext] Error stack:", error.stack);
          setSession(null);
          setUser(null);
        } finally {
          console.log("[NativeAuthContext] Setting loading to false");
          setLoading(false);
        }
      });
      const signIn = (_0) => __async(null, [_0], function* ({ email, password }) {
        try {
          setLoading(true);
          const result = yield nativeAuth.signIn({ email, password });
          if (result.error) {
            throw new Error(result.error.message);
          }
          setSession(result.session);
          setUser(result.user);
          return { success: true, user: result.user, session: result.session };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          setLoading(false);
        }
      });
      const signUp = (_0) => __async(null, [_0], function* ({ email, password, userData = {} }) {
        try {
          setLoading(true);
          const result = yield nativeAuth.signUp({ email, password, userData });
          if (result.error) {
            throw new Error(result.error.message);
          }
          setSession(result.session);
          setUser(result.user);
          return { success: true, user: result.user, session: result.session };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          setLoading(false);
        }
      });
      const signOut = () => __async(null, null, function* () {
        try {
          setLoading(true);
          yield nativeAuth.signOut();
          setSession(null);
          setUser(null);
        } catch (error) {
          console.error("Error signing out:", error.message);
        } finally {
          setLoading(false);
        }
      });
      const signInWithBiometric = () => __async(null, null, function* () {
        try {
          setLoading(true);
          const result = yield nativeAuth.authenticateWithBiometric();
          if (result.error) {
            throw new Error(result.error.message);
          }
          setSession(result.session);
          setUser(result.user);
          return { success: true, user: result.user, session: result.session };
        } catch (error) {
          return { success: false, error: error.message };
        } finally {
          setLoading(false);
        }
      });
      const enableBiometric = (_0) => __async(null, [_0], function* ({ email, password }) {
        try {
          const result = yield nativeAuth.enableBiometric({ email, password });
          if (result.error) {
            throw new Error(result.error.message);
          }
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      const disableBiometric = () => __async(null, null, function* () {
        try {
          yield nativeAuth.disableBiometric();
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      const refreshSession = () => __async(null, null, function* () {
        try {
          if (!(session == null ? void 0 : session.refresh_token)) {
            throw new Error("No refresh token available");
          }
          const result = yield nativeAuth.refreshSession();
          if (result.error) {
            yield signOut();
            throw new Error(result.error.message);
          }
          setSession(result.session);
          setUser(result.user);
          return { success: true, session: result.session };
        } catch (error) {
          yield signOut();
          return { success: false, error: error.message };
        }
      });
      const value = {
        user,
        session,
        loading,
        isNativeApp,
        signIn,
        signUp,
        signOut,
        signInWithBiometric,
        enableBiometric,
        disableBiometric,
        refreshSession,
        // Legacy compatibility
        signInWithPassword: signIn,
        signUpWithPassword: signUp
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsx(NativeAuthContext.Provider, { value, children });
    };
    console.log("🔧 [AppwriteService] Using unified client - constructor errors should be resolved");
    class AppwriteCircuitBreaker {
      constructor(maxFailures = 3, resetTimeout = 3e4) {
        this.maxFailures = maxFailures;
        this.resetTimeout = resetTimeout;
        this.failures = 0;
        this.state = "CLOSED";
        this.nextAttempt = Date.now();
      }
      execute(operation, operationName = "Unknown") {
        return __async(this, null, function* () {
          if (this.state === "OPEN") {
            if (Date.now() < this.nextAttempt) {
              console.warn("[Appwrite] Circuit breaker is OPEN for ".concat(operationName, " - too many failures"));
              throw new Error("Appwrite circuit breaker is OPEN for ".concat(operationName));
            }
            this.state = "HALF_OPEN";
            console.log("[Appwrite] Circuit breaker moving to HALF_OPEN for ".concat(operationName));
          }
          try {
            const result = yield operation();
            this.onSuccess(operationName);
            return result;
          } catch (error) {
            this.onFailure(operationName, error);
            throw error;
          }
        });
      }
      onSuccess(operationName) {
        if (this.failures > 0) {
          console.log("[Appwrite] Circuit breaker reset for ".concat(operationName, " after success"));
        }
        this.failures = 0;
        this.state = "CLOSED";
      }
      onFailure(operationName, error) {
        this.failures += 1;
        console.warn("[Appwrite] Circuit breaker failure ".concat(this.failures, "/").concat(this.maxFailures, " for ").concat(operationName, ":"), error.message);
        if (this.failures >= this.maxFailures) {
          this.state = "OPEN";
          this.nextAttempt = Date.now() + this.resetTimeout;
          console.error("[Appwrite] Circuit breaker OPEN for ".concat(operationName, " - will retry in ").concat(this.resetTimeout, "ms"));
        }
      }
      reset() {
        this.failures = 0;
        this.state = "CLOSED";
        this.nextAttempt = Date.now();
      }
    }
    const authCircuitBreaker = new AppwriteCircuitBreaker(3, 3e4);
    const appwriteAuth$1 = {
      // Get current user session
      getCurrentUser() {
        return __async(this, null, function* () {
          return yield authCircuitBreaker.execute(() => __async(null, null, function* () {
            try {
              const user = yield forcedAccount.get();
              console.log("[Appwrite Auth] Current user:", user.email);
              return user;
            } catch (error) {
              if (error.code === 401) {
                console.log("[Appwrite Auth] No active session");
                return null;
              }
              throw error;
            }
          }), "getCurrentUser");
        });
      },
      // Login with email and password
      login(email, password) {
        return __async(this, null, function* () {
          return yield authCircuitBreaker.execute(() => __async(null, null, function* () {
            console.log("[Appwrite Auth] Attempting login for:", email);
            const session = yield forcedAccount.createEmailPasswordSession(email, password);
            console.log("[Appwrite Auth] Login successful");
            return session;
          }), "login");
        });
      },
      // Register new user
      register(email, password, username) {
        return __async(this, null, function* () {
          return yield authCircuitBreaker.execute(() => __async(null, null, function* () {
            console.log("[Appwrite Auth] Registering user:", email);
            const user = yield forcedAccount.create(ID.unique(), email, password, username);
            console.log("[Appwrite Auth] Registration successful");
            return user;
          }), "register");
        });
      },
      // Logout
      logout() {
        return __async(this, null, function* () {
          return yield authCircuitBreaker.execute(() => __async(null, null, function* () {
            console.log("[Appwrite Auth] Logging out");
            yield forcedAccount.deleteSession("current");
            console.log("[Appwrite Auth] Logout successful");
          }), "logout");
        });
      },
      // Get current session
      getSession() {
        return __async(this, null, function* () {
          return yield authCircuitBreaker.execute(() => __async(null, null, function* () {
            const session = yield forcedAccount.getSession("current");
            return session;
          }), "getSession");
        });
      }
    };
    class AppwriteDesignService {
      constructor() {
        this.client = null;
        this.databases = null;
        this.databaseId = "recursion_chat_db";
        this.collectionId = "designs";
        this.initialized = false;
      }
      initialize() {
        return __async(this, null, function* () {
          if (this.initialized) {
            return;
          }
          try {
            this.client = forcedClient;
            this.databases = new Databases(this.client);
            this.initialized = true;
          } catch (error) {
            console.error("[DesignService] Initialization error:", error);
            throw error;
          }
        });
      }
      saveDesignStyles(styles, userId) {
        return __async(this, null, function* () {
          try {
            yield this.initialize();
            const existingDocs = yield this.databases.listDocuments(
              this.databaseId,
              this.collectionId,
              [Query.equal("userId", userId)]
            );
            const timestamp = (/* @__PURE__ */ new Date()).toISOString();
            const designData = {
              userId,
              styles: JSON.stringify(styles),
              timestamp,
              styleCount: Object.keys(styles).length
            };
            let result;
            if (existingDocs.documents.length > 0) {
              const docId = existingDocs.documents[0].$id;
              result = yield this.databases.updateDocument(
                this.databaseId,
                this.collectionId,
                docId,
                designData
              );
            } else {
              result = yield this.databases.createDocument(
                this.databaseId,
                this.collectionId,
                ID.unique(),
                designData
              );
            }
            return {
              success: true,
              styles,
              timestamp,
              docId: result.$id
            };
          } catch (error) {
            console.error("[DesignService] Error saving design styles:", error);
            localStorage.setItem("recursion-custom-styles", JSON.stringify(styles));
            localStorage.setItem("recursion-last-save", (/* @__PURE__ */ new Date()).toISOString());
            return {
              success: false,
              error: error.message,
              fallback: "localStorage"
            };
          }
        });
      }
      loadDesignStyles(userId) {
        return __async(this, null, function* () {
          try {
            if (!this.initialized) {
              yield this.initialize();
            }
            if (!userId) {
              console.log("[DesignService] No userId provided, using localStorage");
              throw new Error("User ID required");
            }
            const result = yield this.databases.listDocuments(
              this.databaseId,
              this.collectionId,
              [Query.equal("userId", userId)]
            );
            if (result && result.documents && result.documents.length > 0) {
              const doc = result.documents[0];
              const styles = doc.styles ? JSON.parse(doc.styles) : {};
              localStorage.setItem("recursion-custom-styles", JSON.stringify(styles));
              localStorage.setItem("recursion-last-save", doc.timestamp);
              return {
                success: true,
                styles,
                timestamp: doc.timestamp
              };
            }
            const localStyles = localStorage.getItem("recursion-custom-styles");
            if (localStyles) {
              return {
                success: true,
                styles: JSON.parse(localStyles),
                timestamp: localStorage.getItem("recursion-last-save"),
                source: "localStorage"
              };
            }
            return {
              success: true,
              styles: {},
              timestamp: null
            };
          } catch (error) {
            console.log("[DesignService] Using localStorage fallback:", error.message);
            try {
              const localStyles = localStorage.getItem("recursion-custom-styles");
              if (localStyles) {
                return {
                  success: true,
                  styles: JSON.parse(localStyles),
                  timestamp: localStorage.getItem("recursion-last-save"),
                  source: "localStorage"
                };
              }
            } catch (parseError) {
              console.log("[DesignService] Failed to parse localStorage:", parseError.message);
            }
            return {
              success: true,
              styles: {},
              timestamp: null,
              source: "default"
            };
          }
        });
      }
    }
    const appwriteDesignService = new AppwriteDesignService();
    const DesignModeContext = reactExports.createContext();
    const DesignModeProvider = ({ children }) => {
      console.log("DesignModeProvider initializing...");
      const [isDesignMode, setIsDesignMode] = reactExports.useState(false);
      const [selectedElement, setSelectedElement] = reactExports.useState(null);
      const [elementStyles, setElementStyles] = reactExports.useState({});
      const [showColorPicker, setShowColorPicker] = reactExports.useState(false);
      const [hasUnsavedChanges, setHasUnsavedChanges] = reactExports.useState(false);
      const [savedStyles, setSavedStyles] = reactExports.useState({});
      const [lastSaveTime, setLastSaveTime] = reactExports.useState(null);
      const [notification, setNotification] = reactExports.useState(null);
      reactExports.useEffect(() => {
        const loadStyles = () => __async(null, null, function* () {
          try {
            const user = yield appwriteAuth$1.getCurrentUser();
            if (user && user.$id) {
              const result = yield appwriteDesignService.loadDesignStyles(user.$id);
              if (result.success && result.styles && Object.keys(result.styles).length > 0) {
                console.log("Loaded design styles from Appwrite:", result);
                setElementStyles(result.styles);
                setSavedStyles(result.styles);
                setHasUnsavedChanges(false);
                if (result.timestamp) {
                  setLastSaveTime(new Date(result.timestamp));
                }
                return;
              }
            }
            const savedStylesData = localStorage.getItem("recursion-custom-styles");
            const lastSaveData = localStorage.getItem("recursion-last-save");
            if (savedStylesData) {
              try {
                const parsedStyles = JSON.parse(savedStylesData);
                setElementStyles(parsedStyles);
                setSavedStyles(parsedStyles);
                setHasUnsavedChanges(false);
                if (lastSaveData) {
                  setLastSaveTime(new Date(lastSaveData));
                }
              } catch (error) {
                console.warn("Failed to parse saved styles from localStorage:", error);
              }
            }
          } catch (error) {
            console.warn("Failed to load styles:", error);
            const savedStylesData = localStorage.getItem("recursion-custom-styles");
            const lastSaveData = localStorage.getItem("recursion-last-save");
            if (savedStylesData) {
              try {
                const parsedStyles = JSON.parse(savedStylesData);
                setElementStyles(parsedStyles);
                setSavedStyles(parsedStyles);
                setHasUnsavedChanges(false);
                if (lastSaveData) {
                  setLastSaveTime(new Date(lastSaveData));
                }
              } catch (error2) {
                console.warn("Failed to parse saved styles from localStorage:", error2);
              }
            }
          }
        });
        loadStyles();
      }, []);
      reactExports.useEffect(() => {
        if (Object.keys(elementStyles).length > 0) {
          applyCustomStyles();
          const stylesChanged = JSON.stringify(elementStyles) !== JSON.stringify(savedStyles);
          setHasUnsavedChanges(stylesChanged);
        }
      }, [elementStyles, savedStyles]);
      const applyCustomStyles = () => {
        let styleElement = document.getElementById("design-mode-styles");
        if (!styleElement) {
          styleElement = document.createElement("style");
          styleElement.id = "design-mode-styles";
          document.head.appendChild(styleElement);
        }
        let css = "";
        Object.entries(elementStyles).forEach(([selector, styles]) => {
          css += "".concat(selector, " {\n");
          if (styles.backgroundColor) {
            css += "  background-color: ".concat(styles.backgroundColor, " !important;\n");
          }
          if (styles.color) {
            css += "  color: ".concat(styles.color, " !important;\n");
          }
          if (styles.borderColor) {
            css += "  border-color: ".concat(styles.borderColor, " !important;\n");
          }
          css += "}\n";
        });
        styleElement.textContent = css;
      };
      const toggleDesignMode = () => {
        console.log("toggleDesignMode called, current isDesignMode:", isDesignMode);
        setIsDesignMode(!isDesignMode);
        setSelectedElement(null);
        setShowColorPicker(false);
        if (!isDesignMode) {
          document.body.style.cursor = "crosshair";
          document.body.setAttribute("data-design-mode", "true");
        } else {
          document.body.style.cursor = "";
          document.body.removeAttribute("data-design-mode");
          const highlightedElements = document.querySelectorAll("[data-design-selected]");
          highlightedElements.forEach((el) => {
            el.removeAttribute("data-design-selected");
          });
        }
      };
      const selectElement = (element, event) => {
        if (!isDesignMode) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        const prevSelected = document.querySelectorAll("[data-design-selected]");
        prevSelected.forEach((el) => el.removeAttribute("data-design-selected"));
        element.setAttribute("data-design-selected", "true");
        setSelectedElement(element);
        setShowColorPicker(true);
      };
      const updateElementStyle = (property, value2) => {
        if (!selectedElement) {
          return;
        }
        const selector = generateSelector(selectedElement);
        const currentStyles = elementStyles[selector] || {};
        const newStyles = __spreadProps(__spreadValues({}, currentStyles), { [property]: value2 });
        setElementStyles((prev) => __spreadProps(__spreadValues({}, prev), {
          [selector]: newStyles
        }));
        selectedElement.style.setProperty(property, value2, "important");
      };
      const generateSelector = (element) => {
        if (element.id) {
          return "#".concat(element.id);
        }
        if (element.className && typeof element.className === "string") {
          const classes = element.className.split(" ").filter((c) => c.trim());
          if (classes.length > 0) {
            return ".".concat(classes[0]);
          }
        }
        let path = element.tagName.toLowerCase();
        let parent = element.parentElement;
        let depth = 0;
        while (parent && parent !== document.body && depth < 3) {
          if (parent.id) {
            path = "#".concat(parent.id, " ").concat(path);
            break;
          }
          if (parent.className && typeof parent.className === "string") {
            const parentClasses = parent.className.split(" ").filter((c) => c.trim());
            if (parentClasses.length > 0) {
              path = ".".concat(parentClasses[0], " ").concat(path);
              break;
            }
          }
          path = "".concat(parent.tagName.toLowerCase(), " ").concat(path);
          parent = parent.parentElement;
          depth++;
        }
        return path;
      };
      const resetStyles = () => {
        setElementStyles({});
        localStorage.removeItem("recursion-custom-styles");
        const styleElement = document.getElementById("design-mode-styles");
        if (styleElement) {
          styleElement.remove();
        }
        const elementsWithInlineStyles = document.querySelectorAll("[style]");
        elementsWithInlineStyles.forEach((element) => {
          element.removeAttribute("style");
        });
      };
      const saveStyles = () => __async(null, null, function* () {
        const timestamp = /* @__PURE__ */ new Date();
        try {
          const user = yield appwriteAuth$1.getCurrentUser();
          if (user && user.$id) {
            const result = yield appwriteDesignService.saveDesignStyles(elementStyles, user.$id);
            if (result.success) {
              console.log("Design styles saved to Appwrite:", result);
              setSavedStyles(__spreadValues({}, elementStyles));
              setHasUnsavedChanges(false);
              setLastSaveTime(timestamp);
              setNotification({
                message: "Design styles saved to cloud successfully!",
                type: "success"
              });
              return true;
            } else if (result.fallback === "localStorage") {
              setSavedStyles(__spreadValues({}, elementStyles));
              setHasUnsavedChanges(false);
              setLastSaveTime(timestamp);
              setNotification({
                message: "Saved locally (cloud save failed)",
                type: "warning"
              });
              return false;
            }
          } else {
            localStorage.setItem("recursion-custom-styles", JSON.stringify(elementStyles));
            localStorage.setItem("recursion-last-save", timestamp.toISOString());
            setSavedStyles(__spreadValues({}, elementStyles));
            setHasUnsavedChanges(false);
            setLastSaveTime(timestamp);
            setNotification({
              message: "Saved locally (sign in to save to cloud)",
              type: "info"
            });
            return true;
          }
        } catch (error) {
          console.error("Failed to save design styles:", error);
          localStorage.setItem("recursion-custom-styles", JSON.stringify(elementStyles));
          localStorage.setItem("recursion-last-save", timestamp.toISOString());
          setSavedStyles(__spreadValues({}, elementStyles));
          setHasUnsavedChanges(false);
          setLastSaveTime(timestamp);
          setNotification({
            message: "Saved locally (error occurred)",
            type: "warning"
          });
          return false;
        }
      });
      const discardChanges = () => {
        setElementStyles(__spreadValues({}, savedStyles));
        setSelectedElement(null);
        setShowColorPicker(false);
        setHasUnsavedChanges(false);
        if (Object.keys(savedStyles).length > 0) {
          const styleElement = document.getElementById("design-mode-styles");
          if (styleElement) {
            let css = "";
            Object.entries(savedStyles).forEach(([selector, styles]) => {
              css += "".concat(selector, " {\n");
              if (styles.backgroundColor) {
                css += "  background-color: ".concat(styles.backgroundColor, " !important;\n");
              }
              if (styles.color) {
                css += "  color: ".concat(styles.color, " !important;\n");
              }
              if (styles.borderColor) {
                css += "  border-color: ".concat(styles.borderColor, " !important;\n");
              }
              css += "}\n";
            });
            styleElement.textContent = css;
          }
        }
        console.log("Unsaved changes discarded");
        setNotification({
          message: "Unsaved changes discarded",
          type: "warning"
        });
      };
      const exportStyles = () => {
        const exportData = {
          styles: elementStyles,
          metadata: {
            exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
            totalStyles: Object.keys(elementStyles).length,
            lastSaved: (lastSaveTime == null ? void 0 : lastSaveTime.toISOString()) || null,
            hasUnsavedChanges
          }
        };
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        const exportFileDefaultName = "recursion-styles-".concat((/* @__PURE__ */ new Date()).toISOString().split("T")[0], ".json");
        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
      };
      const value = {
        isDesignMode,
        selectedElement,
        showColorPicker,
        elementStyles,
        hasUnsavedChanges,
        lastSaveTime,
        notification,
        setNotification,
        toggleDesignMode,
        selectElement,
        updateElementStyle,
        setShowColorPicker,
        saveStyles,
        discardChanges,
        resetStyles,
        exportStyles
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsx(DesignModeContext.Provider, { value, children });
    };
    function EnhancedNoPopupProtectedRoute({ children }) {
      const {
        user: appwriteUser,
        loading: appwriteLoading,
        isAuthenticated,
        authStateReady,
        isMobileSafariAuthenticated
      } = useAuth$1();
      const { user: nativeUser, loading: nativeLoading } = useNativeAuth();
      const isNativeApp = Capacitor.isNativePlatform();
      const isMobileSafari = React.useMemo(() => {
        const userAgent = navigator.userAgent;
        const isSafari = /Safari/i.test(userAgent) && !/CriOS|FxiOS|EdgiOS/i.test(userAgent);
        const isMobile2 = /iPhone|iPad|iPod/i.test(userAgent);
        const result = isMobile2 && isSafari;
        mobileSafariAuthDebugger.log("🔍 MOBILE SAFARI DETECTION", {
          userAgent,
          isSafari,
          isMobile: isMobile2,
          result,
          fullCheck: {
            hasSafari: /Safari/i.test(userAgent),
            hasChrome: /CriOS/i.test(userAgent),
            hasFirefox: /FxiOS/i.test(userAgent),
            hasEdge: /EdgiOS/i.test(userAgent)
          }
        });
        return result;
      }, []);
      const user = isNativeApp ? nativeUser : appwriteUser;
      const loading = isNativeApp ? nativeLoading : appwriteLoading;
      const authenticated = React.useMemo(() => {
        let result;
        if (isNativeApp) {
          result = !!nativeUser;
          mobileSafariAuthDebugger.log("🔐 AUTH STATE (Native App)", {
            hasNativeUser: !!nativeUser,
            result
          });
        } else if (isMobileSafari) {
          result = isMobileSafariAuthenticated;
          mobileSafariAuthDebugger.log("🔐 AUTH STATE (Mobile Safari)", {
            isMobileSafariAuthenticated,
            isAuthenticated,
            hasAppwriteUser: !!appwriteUser,
            result
          });
        } else {
          result = isAuthenticated;
          mobileSafariAuthDebugger.log("🔐 AUTH STATE (Desktop)", {
            isAuthenticated,
            hasAppwriteUser: !!appwriteUser,
            result
          });
        }
        return result;
      }, [isNativeApp, nativeUser, isMobileSafari, isMobileSafariAuthenticated, isAuthenticated, appwriteUser]);
      const [cachedAuth, setCachedAuth] = reactExports.useState(() => {
        mobileSafariAuthDebugger.log("🗄️ INITIAL CACHED AUTH CHECK");
        try {
          const localUserData = localStorage.getItem("user_data");
          const sessionUserData = sessionStorage.getItem("user_data");
          const localAuthToken = localStorage.getItem("auth_token");
          const sessionAuthToken = sessionStorage.getItem("auth_token");
          const localBackendToken = localStorage.getItem("backend_token");
          const sessionBackendToken = sessionStorage.getItem("backend_token");
          const userData = localUserData || sessionUserData;
          const authToken = localAuthToken || sessionAuthToken || localBackendToken || sessionBackendToken;
          mobileSafariAuthDebugger.log("🗄️ STORAGE SCAN RESULTS", {
            localStorage: {
              userData: !!localUserData,
              authToken: !!localAuthToken,
              backendToken: !!localBackendToken
            },
            sessionStorage: {
              userData: !!sessionUserData,
              authToken: !!sessionAuthToken,
              backendToken: !!sessionBackendToken
            },
            effective: {
              hasUserData: !!userData,
              hasAuthToken: !!authToken
            }
          });
          if (userData && authToken) {
            const parsedUser = JSON.parse(userData);
            mobileSafariAuthDebugger.log("🗄️ CACHED AUTH FOUND", {
              userEmail: parsedUser.email,
              userId: parsedUser.id,
              hasToken: true
            });
            return { user: parsedUser, authenticated: true };
          }
        } catch (e) {
          mobileSafariAuthDebugger.log("❌ CACHED AUTH PARSE ERROR", { error: e.message });
        }
        return { user: null, authenticated: false };
      });
      const [authCheckComplete, setAuthCheckComplete] = reactExports.useState(false);
      const [authCheckPhase, setAuthCheckPhase] = reactExports.useState("initializing");
      const checkTimeoutRef = reactExports.useRef(null);
      const hasCheckedRef = reactExports.useRef(false);
      reactExports.useRef(null);
      const [stateHistory, setStateHistory] = reactExports.useState([]);
      const trackStateChange = reactExports.useCallback((phase, data) => {
        const stateEntry = {
          timestamp: Date.now(),
          phase,
          data: __spreadProps(__spreadValues({}, data), {
            hasUser: !!user,
            userEmail: user == null ? void 0 : user.email,
            authenticated,
            loading,
            authStateReady,
            authCheckComplete,
            isMobileSafari,
            currentUrl: window.location.href
          })
        };
        setStateHistory((prev) => [...prev.slice(-19), stateEntry]);
        try {
          mobileSafariAuthDebugger.trackAuthState && mobileSafariAuthDebugger.trackAuthState(stateEntry.data);
        } catch (e) {
          console.warn("trackAuthState not available yet:", e.message);
        }
        mobileSafariAuthDebugger.log("📊 STATE CHANGE: ".concat(phase), stateEntry.data);
      }, [user, authenticated, loading, authStateReady, authCheckComplete, isMobileSafari]);
      const effectiveUser = user || cachedAuth.user;
      const effectiveAuthenticated = authenticated || cachedAuth.authenticated;
      reactExports.useEffect(() => {
        var _a2;
        mobileSafariAuthDebugger.log("🚫 ENHANCED PROTECTED ROUTE RENDER", {
          platform: isNativeApp ? "NATIVE" : "WEB",
          isMobileSafari,
          user: {
            hasUser: !!user,
            email: user == null ? void 0 : user.email,
            id: user == null ? void 0 : user.id
          },
          cached: {
            hasUser: !!cachedAuth.user,
            email: (_a2 = cachedAuth.user) == null ? void 0 : _a2.email,
            authenticated: cachedAuth.authenticated
          },
          effective: {
            hasUser: !!effectiveUser,
            email: effectiveUser == null ? void 0 : effectiveUser.email,
            authenticated: effectiveAuthenticated
          },
          state: {
            loading,
            authenticated,
            authCheckComplete,
            authStateReady,
            phase: authCheckPhase
          },
          location: {
            pathname: window.location.pathname,
            href: window.location.href
          }
        });
      });
      reactExports.useEffect(() => {
        if (hasCheckedRef.current) {
          return;
        }
        hasCheckedRef.current = true;
        setAuthCheckPhase("initial_check");
        trackStateChange("INITIAL_AUTH_CHECK_STARTED");
        mobileSafariAuthDebugger.log("🚫 STARTING ENHANCED AUTH CHECK");
        if (isMobileSafari) {
          mobileSafariAuthDebugger.log("📱 MOBILE SAFARI DETECTED - Enhanced Check");
          if (authStateReady) {
            mobileSafariAuthDebugger.log("📱 AUTH STATE ALREADY READY - Completing immediately");
            setAuthCheckPhase("completed");
            setAuthCheckComplete(true);
            trackStateChange("MOBILE_SAFARI_IMMEDIATE_COMPLETE");
            return;
          }
          checkTimeoutRef.current = setTimeout(() => {
            mobileSafariAuthDebugger.log("📱 MOBILE SAFARI TIMEOUT - Force completing");
            setAuthCheckPhase("timeout_completed");
            setAuthCheckComplete(true);
            trackStateChange("MOBILE_SAFARI_TIMEOUT_COMPLETE");
          }, 8e3);
        } else {
          checkTimeoutRef.current = setTimeout(() => {
            mobileSafariAuthDebugger.log("💻 DESKTOP TIMEOUT - Force completing");
            setAuthCheckPhase("timeout_completed");
            setAuthCheckComplete(true);
            trackStateChange("DESKTOP_TIMEOUT_COMPLETE");
          }, 3e3);
        }
        return () => {
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
        };
      }, [isMobileSafari, authStateReady, trackStateChange]);
      reactExports.useEffect(() => {
        const shouldComplete = () => {
          if (isMobileSafari) {
            return !loading && authStateReady;
          } else {
            return !loading;
          }
        };
        if (shouldComplete() && !authCheckComplete) {
          mobileSafariAuthDebugger.log("✅ LOADING COMPLETE - Completing auth check", {
            isMobileSafari,
            loading,
            authStateReady,
            shouldComplete: shouldComplete()
          });
          setAuthCheckPhase("loading_completed");
          setAuthCheckComplete(true);
          trackStateChange("LOADING_COMPLETE");
          if (checkTimeoutRef.current) {
            clearTimeout(checkTimeoutRef.current);
          }
        }
      }, [loading, authStateReady, isMobileSafari, authCheckComplete, trackStateChange]);
      const makeAuthDecision = reactExports.useCallback(() => {
        const decision2 = {
          timestamp: Date.now(),
          phase: authCheckPhase,
          inputs: {
            effectiveUser: !!effectiveUser,
            effectiveAuthenticated,
            authCheckComplete,
            isMobileSafari,
            loading,
            authStateReady
          }
        };
        if (isMobileSafari && !effectiveUser && !effectiveAuthenticated) {
          const hasStorageAuth = !!((localStorage.getItem("user_data") || sessionStorage.getItem("user_data")) && (localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || localStorage.getItem("backend_token") || sessionStorage.getItem("backend_token")));
          if (hasStorageAuth && !authStateReady) {
            decision2.action = "wait_for_context_init";
            decision2.reason = "Mobile Safari has storage auth but context not ready";
            mobileSafariAuthDebugger.log("⏳ MOBILE SAFARI WAITING FOR CONTEXT INIT", decision2);
            return decision2;
          }
        }
        if (!effectiveUser && !effectiveAuthenticated && authCheckComplete) {
          decision2.action = "redirect";
          decision2.reason = "No authentication found after check complete";
        } else if (effectiveUser && effectiveAuthenticated) {
          decision2.action = "allow";
          decision2.reason = "User authenticated";
        } else if (loading || isMobileSafari && !authStateReady) {
          decision2.action = "loading";
          decision2.reason = "Still loading or mobile Safari not ready";
        } else {
          decision2.action = "evaluate";
          decision2.reason = "Need further evaluation";
        }
        mobileSafariAuthDebugger.log("🎯 AUTH DECISION", decision2);
        trackStateChange("AUTH_DECISION_MADE", decision2);
        return decision2;
      }, [
        effectiveUser,
        effectiveAuthenticated,
        authCheckComplete,
        isMobileSafari,
        loading,
        authStateReady,
        authCheckPhase,
        trackStateChange
      ]);
      const decision = makeAuthDecision();
      if (decision.action === "loading" || decision.action === "wait_for_context_init") {
        mobileSafariAuthDebugger.log("⏳ SHOWING LOADING STATE", {
          action: decision.action,
          reason: decision.reason
        });
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          textAlign: "center",
          color: "white"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            width: "50px",
            height: "50px",
            border: "3px solid rgba(255,255,255,0.3)",
            borderTopColor: "white",
            borderRadius: "50%",
            margin: "0 auto 1rem",
            animation: "spin 1s linear infinite"
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: decision.action === "wait_for_context_init" ? "📱 Restoring mobile Safari session..." : "Checking authentication..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { fontSize: "14px", opacity: 0.8 }, children: [
            "Phase: ",
            authCheckPhase
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("style", { dangerouslySetInnerHTML: {
            __html: "@keyframes spin { to { transform: rotate(360deg); } }"
          } })
        ] }) });
      }
      if (decision.action === "redirect") {
        mobileSafariAuthDebugger.trackRedirect(
          window.location.pathname,
          "/auth/signin",
          decision.reason
        );
        const currentPath = window.location.pathname;
        if (currentPath !== "/" && currentPath !== "/auth" && currentPath !== "/auth/signin") {
          sessionStorage.setItem("auth_redirect", currentPath);
          mobileSafariAuthDebugger.log("🔄 STORED REDIRECT PATH", { path: currentPath });
        }
        mobileSafariAuthDebugger.log("🚫 REDIRECTING TO AUTH", {
          from: currentPath,
          to: "/auth/signin",
          reason: decision.reason,
          decision
        });
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/auth/signin", replace: true });
      }
      if (decision.action === "allow") {
        mobileSafariAuthDebugger.log("✅ ALLOWING ACCESS", {
          userEmail: effectiveUser == null ? void 0 : effectiveUser.email,
          reason: decision.reason,
          decision
        });
        trackStateChange("ACCESS_GRANTED");
        return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
      }
      if (decision.action === "evaluate") {
        if (effectiveUser && !effectiveAuthenticated && authCheckComplete) {
          mobileSafariAuthDebugger.log("🔄 USER EXISTS BUT NOT AUTHENTICATED - REDIRECTING");
          mobileSafariAuthDebugger.trackRedirect(
            window.location.pathname,
            "/auth/signin",
            "User exists but not authenticated"
          );
          return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/auth/signin", replace: true });
        }
      }
      mobileSafariAuthDebugger.log("⚠️ FALLBACK LOADING STATE", { decision });
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", color: "white" }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Evaluating authentication..." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          "Decision: ",
          decision.action
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          "Reason: ",
          decision.reason
        ] })
      ] }) });
    }
    const SignInPage = () => {
      const {
        loginWithEmail,
        loginWithOAuth,
        register,
        loading,
        authError,
        isAuthenticated
      } = useAuth$1();
      const navigate = useNavigate();
      const location = useLocation();
      const [mode, setMode] = reactExports.useState("signin");
      const [formData, setFormData] = reactExports.useState({
        email: "",
        password: "",
        confirmPassword: "",
        username: ""
      });
      const [error, setError] = reactExports.useState("");
      const [isLoading, setIsLoading] = reactExports.useState(false);
      const redirectTo = new URLSearchParams(location.search).get("redirect") || sessionStorage.getItem("auth_redirect") || "/rooms";
      const isMobileSafari = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS/i.test(navigator.userAgent);
      reactExports.useEffect(() => {
        const hasStorageAuth = isMobileSafari ? !!(localStorage.getItem("user_data") || sessionStorage.getItem("user_data")) && !!(localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token")) : false;
        const shouldRedirect = isAuthenticated || isMobileSafari && hasStorageAuth;
        if (shouldRedirect) {
          console.log("[SignInPage] 🔄 Already authenticated, redirecting:", {
            redirectTo,
            isAuthenticated,
            isMobileSafari,
            hasStorageAuth,
            finalAuthState: shouldRedirect
          });
          sessionStorage.removeItem("auth_redirect");
          const navigationMethod = isMobileSafari ? "replace" : "navigate";
          console.log("[SignInPage] 📱 Using navigation method:", navigationMethod);
          navigate(redirectTo, { replace: true });
        }
      }, [isAuthenticated, navigate, redirectTo, isMobileSafari]);
      reactExports.useEffect(() => {
        const autoSSO = sessionStorage.getItem("auto_sso");
        if (autoSSO === "true" && !isAuthenticated && !loading) {
          console.log("[SignInPage] 🚫 Auto-redirecting to Google SSO to prevent popups");
          sessionStorage.removeItem("auto_sso");
          handleOAuthSignIn("google");
        }
      }, [loading, isAuthenticated]);
      reactExports.useEffect(() => {
        if (authError) {
          setError(authError);
          setIsLoading(false);
        }
      }, [authError]);
      const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => __spreadProps(__spreadValues({}, prev), {
          [name]: value
        }));
        if (error) {
          setError("");
        }
      };
      const handleEmailSignIn = (e) => __async(null, null, function* () {
        e.preventDefault();
        setError("");
        setIsLoading(true);
        try {
          console.log("[SignInPage] 🔄 Attempting email sign-in:", {
            email: formData.email,
            redirectTo
          });
          yield loginWithEmail(formData.email, formData.password);
          console.log("[SignInPage] 🔄 Email sign-in successful, redirecting:", {
            redirectTo,
            success: true,
            isMobileSafari
          });
          if (isMobileSafari) {
            console.log("[SignInPage] 📱 Mobile Safari: Adding delay before navigation");
            setTimeout(() => {
              navigate(redirectTo, { replace: true });
            }, 500);
          } else {
            navigate(redirectTo, { replace: true });
          }
        } catch (err) {
          console.log("[SignInPage] 🔄 Email sign-in failed:", {
            error: err.message,
            email: formData.email
          });
          setError(err.message || "Sign-in failed. Please try again.");
        } finally {
          setIsLoading(false);
        }
      });
      const handleRegister = (e) => __async(null, null, function* () {
        e.preventDefault();
        setError("");
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          return;
        }
        if (formData.password.length < 8) {
          setError("Password must be at least 8 characters long");
          return;
        }
        setIsLoading(true);
        try {
          console.log("[SignInPage] 🔄 Attempting registration:", {
            email: formData.email,
            username: formData.username,
            redirectTo
          });
          yield register(formData.email, formData.password, formData.username);
          console.log("[SignInPage] 🔄 Registration successful, redirecting:", {
            redirectTo,
            success: true,
            isMobileSafari
          });
          if (isMobileSafari) {
            console.log("[SignInPage] 📱 Mobile Safari: Adding delay before navigation after registration");
            setTimeout(() => {
              navigate(redirectTo, { replace: true });
            }, 500);
          } else {
            navigate(redirectTo, { replace: true });
          }
        } catch (err) {
          console.log("[SignInPage] 🔄 Registration failed:", {
            error: err.message,
            email: formData.email
          });
          setError(err.message || "Registration failed. Please try again.");
        } finally {
          setIsLoading(false);
        }
      });
      const handleOAuthSignIn = (provider) => __async(null, null, function* () {
        setError("");
        setIsLoading(true);
        try {
          console.log("[SignInPage] 🔄 Attempting OAuth sign-in:", {
            provider,
            redirectTo
          });
          sessionStorage.setItem("oauth_redirect", redirectTo);
          yield loginWithOAuth(provider);
        } catch (err) {
          console.log("[SignInPage] 🔄 OAuth sign-in failed:", {
            provider,
            error: err.message
          });
          setError(err.message || "".concat(provider, " sign-in failed. Please try again."));
          setIsLoading(false);
        }
      });
      const switchMode = () => {
        setMode(mode === "signin" ? "register" : "signin");
        setError("");
        setFormData({
          email: "",
          password: "",
          confirmPassword: "",
          username: ""
        });
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flutter-scaffold signin-page", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flutter-container", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flutter-card signin-container", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-card-content", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "signin-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "Recursion Chat" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: mode === "signin" ? "Welcome Back" : "Create Account" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: mode === "signin" ? "Sign in to continue to your conversations" : "Join the conversation with a new account" })
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "error-message", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-icon", children: "⚠️" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-text", children: error })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "signin-methods", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "oauth-buttons", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              className: "flutter-button flutter-button-outlined oauth-button google-button",
              onClick: () => handleOAuthSignIn("google"),
              disabled: isLoading || loading,
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "oauth-icon", viewBox: "0 0 24 24", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#4285F4", d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#34A853", d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#FBBC05", d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#EA4335", d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" })
                ] }),
                isLoading ? "Signing in..." : "Continue with Google"
              ]
            }
          ) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "divider", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "or" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: mode === "signin" ? handleEmailSignIn : handleRegister, children: [
            mode === "register" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-text-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "flutter-text-field-label", htmlFor: "username", children: "Username" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "username",
                  type: "text",
                  name: "username",
                  className: "flutter-text-field-input",
                  value: formData.username,
                  onChange: handleInputChange,
                  placeholder: "Enter your username",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-text-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "flutter-text-field-label", htmlFor: "email", children: "Email" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "email",
                  type: "email",
                  name: "email",
                  className: "flutter-text-field-input",
                  value: formData.email,
                  onChange: handleInputChange,
                  placeholder: "Enter your email",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-text-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "flutter-text-field-label", htmlFor: "password", children: "Password" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "password",
                  type: "password",
                  name: "password",
                  className: "flutter-text-field-input",
                  value: formData.password,
                  onChange: handleInputChange,
                  placeholder: "Enter your password",
                  required: true,
                  minLength: mode === "register" ? 8 : void 0
                }
              ),
              mode === "register" && /* @__PURE__ */ jsxRuntimeExports.jsx("small", { className: "form-help", children: "Password must be at least 8 characters long" })
            ] }),
            mode === "register" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-text-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "flutter-text-field-label", htmlFor: "confirmPassword", children: "Confirm Password" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "confirmPassword",
                  type: "password",
                  name: "confirmPassword",
                  className: "flutter-text-field-input",
                  value: formData.confirmPassword,
                  onChange: handleInputChange,
                  placeholder: "Confirm your password",
                  required: true
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "submit",
                className: "flutter-button flutter-button-filled submit-button",
                disabled: isLoading || loading,
                children: isLoading || loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-spinner" }),
                  mode === "signin" ? "Signing in..." : "Creating account..."
                ] }) : mode === "signin" ? "Sign In" : "Create Account"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "signin-footer", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
          mode === "signin" ? "Don't have an account? " : "Already have an account? ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              className: "flutter-button flutter-button-text link-button",
              onClick: switchMode,
              disabled: isLoading || loading,
              children: mode === "signin" ? "Sign up here" : "Sign in here"
            }
          )
        ] }) }),
        false
      ] }) }) }) });
    };
    const isMobile = () => {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
    };
    const OAuthCallback = () => {
      const { handleOAuthCallback: handleOAuthCallback2, isAuthenticated } = useAuth$1();
      const navigate = useNavigate();
      const location = useLocation();
      const [status, setStatus] = reactExports.useState("processing");
      const [error, setError] = reactExports.useState("");
      reactExports.useEffect(() => {
        const processCallback = () => __async(null, null, function* () {
          console.log("[OAuthCallback] 🔄 Processing OAuth callback:", {
            currentURL: window.location.href,
            searchParams: location.search
          });
          try {
            if (isMobile()) {
              console.log("[OAuthCallback] 📱 Mobile device detected, using enhanced retry logic");
            }
            const params = new URLSearchParams(location.search);
            const hashParams = new URLSearchParams(window.location.hash.substring(1));
            const hasCallbackParams = params.has("code") || params.has("state") || params.has("oauth") || hashParams.has("userId") || hashParams.has("secret");
            console.log("[OAuthCallback] 🔄 Callback params detected:", {
              hasCallbackParams,
              hasCode: params.has("code"),
              hasState: params.has("state"),
              hasOAuth: params.has("oauth"),
              hasUserId: hashParams.has("userId"),
              hasSecret: hashParams.has("secret"),
              isMobile: isMobile()
            });
            if (hasCallbackParams || window.location.pathname.includes("/auth/callback")) {
              console.log("[OAuthCallback] 🔄 Processing OAuth callback...");
              if (isMobile()) {
                let retryCount = 0;
                const maxRetries = 3;
                let authSuccess = false;
                const startTime = Date.now();
                const MAX_TOTAL_TIME = 8e3;
                while (retryCount < maxRetries && !authSuccess) {
                  try {
                    if (Date.now() - startTime > MAX_TOTAL_TIME) {
                      console.log("[OAuthCallback] ⏱️ Timeout protection: Breaking retry loop after ".concat(Date.now() - startTime, "ms"));
                      break;
                    }
                    const delay = Math.min(500 * retryCount, 1e3);
                    if (retryCount > 0) {
                      console.log("[OAuthCallback] 📱 Mobile retry ".concat(retryCount, "/").concat(maxRetries, ", waiting ").concat(delay, "ms..."));
                      yield new Promise((resolve) => setTimeout(resolve, delay));
                    }
                    const timeoutPromise = new Promise(
                      (_, reject) => setTimeout(() => reject(new Error("Session check timeout")), 3e3)
                    );
                    const accountPromise = forcedAccount.get();
                    const user = yield Promise.race([accountPromise, timeoutPromise]);
                    if (user && user.$id) {
                      console.log("[OAuthCallback] ✅ User authenticated:", user.email);
                      authSuccess = true;
                      setStatus("success");
                      localStorage.setItem("mobile_auth_success", "true");
                      sessionStorage.setItem("oauth_complete", "true");
                    }
                  } catch (e) {
                    console.log("[OAuthCallback] ⚠️ Attempt ".concat(retryCount + 1, " failed:"), e.message);
                    retryCount++;
                  }
                }
                if (!authSuccess) {
                  yield handleOAuthCallback2();
                }
              } else {
                yield handleOAuthCallback2();
              }
              setStatus("success");
              setTimeout(() => {
                const redirectTo = sessionStorage.getItem("oauth_redirect") || sessionStorage.getItem("auth_redirect") || "/rooms";
                sessionStorage.removeItem("oauth_redirect");
                sessionStorage.removeItem("auth_redirect");
                console.log("[OAuthCallback] 🔄 OAuth success, redirecting:", {
                  redirectTo,
                  fromSessionStorage: !!sessionStorage.getItem("oauth_redirect") || !!sessionStorage.getItem("auth_redirect")
                });
                navigate(redirectTo, { replace: true });
              }, 1500);
            } else {
              if (isAuthenticated) {
                console.log("[OAuthCallback] 🔄 User already authenticated, redirecting to rooms");
                navigate("/rooms", { replace: true });
              } else {
                console.log("[OAuthCallback] 🔄 No callback params detected, redirecting to sign-in");
                navigate("/auth/signin", { replace: true });
              }
            }
          } catch (err) {
            console.log("[OAuthCallback] 🔄 OAuth callback error:", {
              error: err.message,
              redirectingToSignIn: true
            });
            setError(err.message);
            setStatus("error");
            setTimeout(() => {
              navigate("/auth/signin?error=oauth_failed", { replace: true });
            }, 3e3);
          }
        });
        processCallback();
      }, [handleOAuthCallback2, navigate, location.search, isAuthenticated]);
      const getStatusMessage = () => {
        switch (status) {
          case "processing":
            return {
              title: "Completing sign-in...",
              message: "Please wait while we finish authenticating you.",
              icon: "🔄"
            };
          case "success":
            return {
              title: "Sign-in successful!",
              message: "Redirecting you to the application...",
              icon: "✅"
            };
          case "error":
            return {
              title: "Sign-in failed",
              message: error || "Something went wrong during authentication. Redirecting to sign-in page...",
              icon: "❌"
            };
          default:
            return {
              title: "Processing...",
              message: "Please wait...",
              icon: "⏳"
            };
        }
      };
      const statusInfo = getStatusMessage();
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "oauth-callback-page", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "oauth-callback-container", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "oauth-callback-content", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "status-icon", children: status === "processing" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner" }) : statusInfo.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: statusInfo.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: statusInfo.message }),
          status === "processing" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-fill" }) }),
          status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => navigate("/auth/signin", { replace: true }),
              className: "retry-button",
              children: "Return to Sign In"
            }
          ) }),
          false
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { jsx: true, children: "\n        .oauth-callback-page {\n          min-height: 100vh;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n          padding: 20px;\n        }\n\n        .oauth-callback-container {\n          background: white;\n          border-radius: 16px;\n          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);\n          width: 100%;\n          max-width: 420px;\n          padding: 40px;\n          text-align: center;\n        }\n\n        .oauth-callback-content {\n          display: flex;\n          flex-direction: column;\n          align-items: center;\n          gap: 20px;\n        }\n\n        .status-icon {\n          font-size: 48px;\n          height: 60px;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n        }\n\n        .spinner {\n          width: 40px;\n          height: 40px;\n          border: 4px solid #e5e7eb;\n          border-top: 4px solid #667eea;\n          border-radius: 50%;\n          animation: spin 1s linear infinite;\n        }\n\n        @keyframes spin {\n          0% { transform: rotate(0deg); }\n          100% { transform: rotate(360deg); }\n        }\n\n        h1 {\n          margin: 0;\n          font-size: 24px;\n          font-weight: 600;\n          color: #1a1a1a;\n        }\n\n        p {\n          margin: 0;\n          color: #666;\n          font-size: 16px;\n          line-height: 1.5;\n          max-width: 300px;\n        }\n\n        .progress-bar {\n          width: 100%;\n          max-width: 200px;\n          height: 4px;\n          background: #e5e7eb;\n          border-radius: 2px;\n          overflow: hidden;\n        }\n\n        .progress-fill {\n          height: 100%;\n          background: linear-gradient(90deg, #667eea, #764ba2);\n          animation: progress 2s ease-in-out infinite;\n        }\n\n        @keyframes progress {\n          0% { width: 0%; }\n          50% { width: 70%; }\n          100% { width: 100%; }\n        }\n\n        .error-actions {\n          margin-top: 20px;\n        }\n\n        .retry-button {\n          padding: 12px 24px;\n          background: linear-gradient(135deg, #667eea, #764ba2);\n          color: white;\n          border: none;\n          border-radius: 8px;\n          font-size: 16px;\n          font-weight: 600;\n          cursor: pointer;\n          transition: all 0.2s ease;\n        }\n\n        .retry-button:hover {\n          transform: translateY(-1px);\n          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);\n        }\n\n        .debug-info {\n          margin-top: 32px;\n          padding: 16px;\n          background: #f3f4f6;\n          border-radius: 8px;\n          border: 1px solid #e5e7eb;\n          text-align: left;\n        }\n\n        .debug-info h4 {\n          margin: 0 0 12px 0;\n          font-size: 14px;\n          font-weight: 600;\n          color: #374151;\n        }\n\n        .debug-info p {\n          margin: 4px 0;\n          font-size: 12px;\n          color: #6b7280;\n          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;\n          max-width: none;\n        }\n\n        @media (max-width: 480px) {\n          .oauth-callback-page {\n            padding: 16px;\n          }\n\n          .oauth-callback-container {\n            padding: 24px;\n          }\n\n          h1 {\n            font-size: 20px;\n          }\n\n          p {\n            font-size: 14px;\n          }\n\n          .status-icon {\n            font-size: 36px;\n            height: 50px;\n          }\n\n          .spinner {\n            width: 32px;\n            height: 32px;\n            border-width: 3px;\n          }\n        }\n\n        @media (prefers-reduced-motion: reduce) {\n          .spinner,\n          .progress-fill {\n            animation: none;\n          }\n\n          .retry-button:hover {\n            transform: none;\n          }\n        }\n      " })
      ] });
    };
    const AuthContext = reactExports.createContext({});
    const useAuth = () => reactExports.useContext(AuthContext);
    function NativeAuth() {
      const [loading, setLoading] = reactExports.useState(false);
      const [email, setEmail] = reactExports.useState("");
      const [password, setPassword] = reactExports.useState("");
      const [isSignUp, setIsSignUp] = reactExports.useState(false);
      const [message, setMessage] = reactExports.useState({ type: "", text: "" });
      const [showPassword, setShowPassword] = reactExports.useState(false);
      const [biometricAvailable, setBiometricAvailable] = reactExports.useState(false);
      const [_biometricEnabled, setBiometricEnabled] = reactExports.useState(false);
      const [showBiometricSetup, setShowBiometricSetup] = reactExports.useState(false);
      const isNativeApp = Capacitor.isNativePlatform();
      const { loginWithSSO, loginWithAppwrite, registerWithAppwrite } = useAuth();
      reactExports.useEffect(() => {
        checkBiometricAvailability();
      }, []);
      const checkBiometricAvailability = () => __async(null, null, function* () {
        try {
          const available = yield nativeAuth.isBiometricAvailable();
          setBiometricAvailable(available);
        } catch (error) {
          console.log("Biometric check failed:", error.message);
        }
      });
      const handleEmailAuth = (e) => __async(null, null, function* () {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });
        try {
          if (isSignUp) {
            const result = yield registerWithAppwrite(email, password, email.split("@")[0]);
            if (!result.success) {
              throw new Error("Registration failed");
            }
            setMessage({
              type: "success",
              text: "Account created successfully! Welcome to Recursion!"
            });
            if (biometricAvailable) {
              setShowBiometricSetup(true);
            }
          } else {
            const result = yield loginWithAppwrite(email, password);
            if (!result.success) {
              throw new Error("Login failed");
            }
            setMessage({
              type: "success",
              text: "Successfully signed in!"
            });
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: error.message || "Authentication failed"
          });
        } finally {
          setLoading(false);
        }
      });
      const handleBiometricSignIn = () => __async(null, null, function* () {
        if (!email) {
          setMessage({
            type: "error",
            text: "Please enter your email first"
          });
          return;
        }
        setLoading(true);
        setMessage({ type: "", text: "" });
        try {
          const result = yield nativeAuth.authenticateWithBiometric();
          if (result.error) {
            throw result.error;
          }
          setMessage({
            type: "success",
            text: "Biometric authentication successful!"
          });
        } catch (error) {
          setMessage({
            type: "error",
            text: error.message || "Biometric authentication failed"
          });
        } finally {
          setLoading(false);
        }
      });
      const handleEnableBiometric = () => __async(null, null, function* () {
        if (!email || !password) {
          setMessage({
            type: "error",
            text: "Email and password required for biometric setup"
          });
          return;
        }
        setLoading(true);
        try {
          const result = yield nativeAuth.enableBiometric({ email, password });
          if (result.error) {
            throw result.error;
          }
          setBiometricEnabled(true);
          setShowBiometricSetup(false);
          setMessage({
            type: "success",
            text: "Biometric authentication enabled!"
          });
        } catch (error) {
          setMessage({
            type: "error",
            text: error.message || "Failed to enable biometric authentication"
          });
        } finally {
          setLoading(false);
        }
      });
      const isMobileApp = () => {
        var _a2;
        return ((_a2 = window.Capacitor) == null ? void 0 : _a2.isNativePlatform()) || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      };
      const handleGoogleLogin = () => __async(null, null, function* () {
        var _a2, _b2, _c2, _d;
        setLoading(true);
        setMessage({ type: "", text: "" });
        try {
          console.log("Starting Google SSO flow...", { isNativeApp, isMobile: isMobileApp() });
          const result = yield loginWithSSO("Google");
          if (result.success && result.redirecting) {
            setMessage({
              type: "info",
              text: "Redirecting to Google authentication..."
            });
            return;
          }
          setMessage({
            type: "success",
            text: "Google authentication successful!"
          });
        } catch (error) {
          console.error("Google login error:", error);
          let userMessage = "Google login is not available. Please use email/password login.";
          if (((_a2 = error.message) == null ? void 0 : _a2.includes("OAuth")) || ((_b2 = error.message) == null ? void 0 : _b2.includes("SSO"))) {
            userMessage = "Google authentication is not configured for this app.";
          } else if ((_c2 = error.message) == null ? void 0 : _c2.includes("network")) {
            userMessage = "Network error. Please check your connection and try again.";
          } else if ((_d = error.message) == null ? void 0 : _d.includes("not enabled")) {
            userMessage = "Google login is currently disabled. Please use email/password login.";
          }
          setMessage({
            type: "error",
            text: userMessage
          });
        } finally {
          setTimeout(() => setLoading(false), 1e3);
        }
      });
      const renderBiometricSetup = () => {
        if (!showBiometricSetup) {
          return null;
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "biometric-setup-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "biometric-setup-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Enable Biometric Sign-In" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Would you like to use fingerprint or face recognition for faster sign-in?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "biometric-setup-buttons", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleEnableBiometric,
                className: "btn btn-primary",
                disabled: loading,
                children: loading ? "Setting up..." : "Enable Biometric"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => setShowBiometricSetup(false),
                className: "btn btn-secondary",
                children: "Skip for now"
              }
            )
          ] })
        ] }) });
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-wrapper ".concat(isNativeApp ? "native-app" : ""), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-background", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-pattern" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "auth-container", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-header", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "recursion-logo", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "logo-text recursion-brand large", children: "Recursion" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "logo-tagline", children: "Infinite Conversations" })
            ] }),
            isSignUp && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "auth-subtitle", children: "Create your account" }),
            isNativeApp && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "native-app-badge", children: "Native App - Secure Authentication" })
          ] }),
          message.text && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-message ".concat(message.type), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "message-icon", children: message.type === "success" ? "✓" : "!" }),
            message.text
          ] }),
          !isSignUp && biometricAvailable && email && /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleBiometricSignIn,
              className: "btn btn-biometric",
              disabled: loading,
              type: "button",
              children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                "Sign in with ",
                isNativeApp ? "Biometric" : "Saved Credentials"
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleEmailAuth, className: "auth-form", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "form-group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "email", className: "form-label", children: "Email Address" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  id: "email",
                  type: "email",
                  className: "form-input",
                  placeholder: "you@example.com",
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  required: true,
                  disabled: loading,
                  autoComplete: "email"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "form-group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "password", className: "form-label", children: "Password" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "password-input-wrapper", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: "password",
                    type: showPassword ? "text" : "password",
                    className: "form-input with-toggle",
                    placeholder: isSignUp ? "Create a strong password" : "Enter your password",
                    value: password,
                    onChange: (e) => setPassword(e.target.value),
                    required: true,
                    disabled: loading,
                    minLength: "6",
                    autoComplete: isSignUp ? "new-password" : "current-password"
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "button",
                  {
                    type: "button",
                    className: "password-toggle-btn",
                    onClick: () => setShowPassword(!showPassword),
                    tabIndex: "-1",
                    "aria-label": showPassword ? "Hide password" : "Show password",
                    children: showPassword ? "Hide" : "Show"
                  }
                )
              ] }),
              isSignUp && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "form-hint", children: "Must be at least 6 characters" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                type: "submit",
                className: "btn btn-primary",
                disabled: loading,
                children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "btn-loading", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "spinner" }),
                  isSignUp ? "Creating Account..." : "Signing In..."
                ] }) : isSignUp ? "Create Account" : "Sign In"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "auth-divider", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "divider-text", children: "Or continue with" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleGoogleLogin,
              className: "btn btn-google",
              disabled: loading,
              type: "button",
              children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "btn-loading", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "spinner" }),
                "Connecting..."
              ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "google-icon", width: "20", height: "20", viewBox: "0 0 48 48", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#EA4335", d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#4285F4", d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#FBBC05", d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("path", { fill: "#34A853", d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Continue with Google" })
              ] })
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-footer", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "auth-switch-text", children: [
              isSignUp ? "Already have an account?" : "Don't have an account?",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "auth-switch-btn",
                  onClick: () => {
                    setIsSignUp(!isSignUp);
                    setMessage({ type: "", text: "" });
                    setShowBiometricSetup(false);
                  },
                  disabled: loading,
                  children: isSignUp ? "Sign In" : "Sign Up"
                }
              )
            ] }),
            isNativeApp && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "native-benefits", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "benefits-header", children: "Native App Security Benefits:" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "benefits-list", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "No browser popups" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Secure credential storage" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Biometric authentication" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Faster sign-in experience" })
              ] })
            ] })
          ] })
        ] }) }),
        renderBiometricSetup()
      ] });
    }
    function EmailConfirmation() {
      const [status, setStatus] = reactExports.useState("loading");
      const [message, setMessage] = reactExports.useState("");
      reactExports.useEffect(() => {
        const confirmEmail = () => __async(null, null, function* () {
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get("token");
            if (!token) {
              setStatus("error");
              setMessage("No confirmation token found in URL");
              return;
            }
            const apiUrl = getApiUrl();
            const response = yield fetch("".concat(apiUrl, "/api/auth/confirm-email?token=").concat(token));
            const data = yield response.json();
            if (response.ok) {
              setStatus("success");
              setMessage(data.message || "Email confirmed successfully!");
              setTimeout(() => {
                window.location.href = "/login";
              }, 3e3);
            } else {
              setStatus("error");
              setMessage(data.message || "Email confirmation failed");
            }
          } catch (error) {
            setStatus("error");
            setMessage("Network error during confirmation");
            console.error("Email confirmation error:", error);
          }
        });
        confirmEmail();
      }, []);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-wrapper", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-background", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-pattern" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "auth-container", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "auth-header", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "recursion-logo", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-symbol", children: "🔄" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "logo-text recursion-brand large pulse", children: "⭐ Recursion ⭐" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "logo-tagline", children: "Email Confirmation" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-content", children: [
            status === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "confirmation-status", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Confirming your email address..." })
            ] }),
            status === "success" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "confirmation-status success", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-icon", children: "✅" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Email Confirmed!" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: message }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "redirect-message", children: "Redirecting to login in 3 seconds..." })
            ] }),
            status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "confirmation-status error", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-icon", children: "❌" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Confirmation Failed" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: message }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/login", className: "auth-link", children: "Back to Login" })
            ] })
          ] })
        ] }) })
      ] });
    }
    var define_process_env_default = {};
    const performanceMetrics = /* @__PURE__ */ new Map();
    class AuthLogger {
      constructor(context = "Auth") {
        this.context = context;
        this.sessionId = this.generateSessionId();
      }
      generateSessionId() {
        return "auth_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 9));
      }
      formatMessage(level, message, data = null) {
        const timestamp = (/* @__PURE__ */ new Date()).toISOString();
        const sessionInfo = "[".concat(this.sessionId, "]");
        const contextInfo = "[".concat(this.context, "]");
        let formatted = "".concat(timestamp, " ").concat(sessionInfo, " ").concat(contextInfo, " ").concat(level, " ").concat(message);
        if (data) {
          formatted += "\n".concat(JSON.stringify(data, null, 2));
        }
        return formatted;
      }
      debug(message, data = null) {
      }
      info(message, data = null) {
        {
          console.log(this.formatMessage("ℹ️ INFO", message, data));
        }
      }
      warn(message, data = null) {
        {
          console.warn(this.formatMessage("⚠️ WARN", message, data));
        }
      }
      error(message, error = null, context = null) {
        {
          const errorData = error ? this.categorizeError(error, context) : {
            message: message || "Unknown error",
            code: "NO_ERROR_OBJECT",
            type: "MISSING_ERROR",
            context,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            sessionId: this.sessionId
          };
          console.error(this.formatMessage("❌ ERROR", message, errorData));
        }
      }
      /**
       * Start Performance Tracking for Auth Operations
       */
      startTimer(operationName) {
        const timerKey = "".concat(operationName, "_").concat(this.sessionId);
        performanceMetrics.set(timerKey, {
          startTime: performance.now(),
          operationName,
          sessionId: this.sessionId
        });
        this.debug("Started timing: ".concat(operationName));
        return timerKey;
      }
      /**
       * End Performance Tracking and Log Results
       */
      endTimer(timerKey, additionalData = null) {
        const metric = performanceMetrics.get(timerKey);
        if (!metric) {
          this.warn("Timer not found: ".concat(timerKey));
          return;
        }
        const duration = performance.now() - metric.startTime;
        const result = __spreadValues({
          operation: metric.operationName,
          duration_ms: Math.round(duration * 100) / 100,
          sessionId: metric.sessionId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        }, additionalData);
        if (duration > 5e3) {
          this.warn("Slow auth operation detected: ".concat(metric.operationName), result);
        } else {
          this.info("Auth operation completed: ".concat(metric.operationName), result);
        }
        performanceMetrics.delete(timerKey);
        return result;
      }
      /**
       * Categorize and Enhance Error Information
       */
      categorizeError(error, context = null) {
        if (!error) {
          return null;
        }
        let errorObj = error;
        if (typeof error === "string") {
          errorObj = { message: error, code: "STRING_ERROR" };
        } else if (!error || typeof error !== "object") {
          errorObj = { message: String(error), code: "UNKNOWN_ERROR" };
        }
        const errorInfo = {
          message: errorObj.message || "Unknown error",
          code: errorObj.code || "NO_CODE",
          type: errorObj.type || "UNKNOWN",
          name: errorObj.name || "Error",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          sessionId: this.sessionId,
          context,
          category: "UNKNOWN",
          severity: "HIGH",
          userFriendly: false,
          retryable: false,
          networkRelated: false
        };
        if (errorObj.code) {
          switch (errorObj.code) {
            case 401:
              errorInfo.category = "AUTHENTICATION_FAILED";
              errorInfo.severity = "HIGH";
              errorInfo.userFriendly = true;
              errorInfo.retryable = true;
              break;
            case 400:
              errorInfo.category = "VALIDATION_ERROR";
              errorInfo.severity = "MEDIUM";
              errorInfo.userFriendly = true;
              errorInfo.retryable = false;
              break;
            case 409:
              errorInfo.category = "CONFLICT_ERROR";
              errorInfo.severity = "MEDIUM";
              errorInfo.userFriendly = true;
              errorInfo.retryable = false;
              break;
            case 429:
              errorInfo.category = "RATE_LIMITED";
              errorInfo.severity = "MEDIUM";
              errorInfo.userFriendly = true;
              errorInfo.retryable = true;
              break;
            case 500:
              errorInfo.category = "SERVER_ERROR";
              errorInfo.severity = "HIGH";
              errorInfo.userFriendly = false;
              errorInfo.retryable = true;
              break;
          }
        }
        const networkKeywords = ["network", "fetch", "timeout", "connection", "offline", "dns"];
        if (networkKeywords.some(
          (keyword) => {
            var _a2, _b2;
            return ((_a2 = errorObj.message) == null ? void 0 : _a2.toLowerCase().includes(keyword)) || ((_b2 = errorObj.type) == null ? void 0 : _b2.toLowerCase().includes(keyword));
          }
        )) {
          errorInfo.networkRelated = true;
          errorInfo.category = "NETWORK_ERROR";
          errorInfo.retryable = true;
        }
        return errorInfo;
      }
      /**
       * Log Authentication State Changes
       */
      logStateChange(fromState, toState, reason, userData = null) {
        const stateChangeInfo = {
          from: fromState,
          to: toState,
          reason,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          sessionId: this.sessionId,
          userId: (userData == null ? void 0 : userData.id) || (userData == null ? void 0 : userData.$id) || "unknown",
          userEmail: (userData == null ? void 0 : userData.email) || "unknown"
        };
        this.info("Auth state changed: ".concat(fromState, " → ").concat(toState), stateChangeInfo);
      }
      /**
       * Log Network Connectivity Status
       */
      logNetworkStatus() {
        const networkInfo = {
          online: navigator.onLine,
          connection: navigator.connection ? {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt
          } : "not_available",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.debug("Network status check", networkInfo);
        return networkInfo;
      }
      /**
       * Create Child Logger with Additional Context
       */
      createChild(additionalContext) {
        const childLogger = new AuthLogger("".concat(this.context, ":").concat(additionalContext));
        childLogger.sessionId = this.sessionId;
        return childLogger;
      }
    }
    class AuthDebugger {
      static getEnvironmentInfo() {
        return {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          cookieEnabled: navigator.cookieEnabled,
          language: navigator.language,
          onLine: navigator.onLine,
          localStorage: typeof Storage !== "undefined",
          sessionStorage: typeof sessionStorage !== "undefined",
          appwriteEndpoint: define_process_env_default.VITE_APPWRITE_ENDPOINT || "not_set",
          appwriteProject: define_process_env_default.VITE_APPWRITE_PROJECT_ID || "not_set",
          nodeEnv: "production",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
      }
      static getStorageInfo() {
        const storageInfo = {
          localStorage: {},
          sessionStorage: {},
          cookies: document.cookie || "none"
        };
        const authKeys = ["appwrite-session", "appwrite-user", "token", "user", "oauth-provider"];
        authKeys.forEach((key) => {
          try {
            const value = localStorage.getItem(key);
            storageInfo.localStorage[key] = value ? "exists" : "not_found";
          } catch (_error) {
            storageInfo.localStorage[key] = "error_accessing";
          }
        });
        return storageInfo;
      }
      static generateDiagnosticsReport() {
        return __async(this, null, function* () {
          const logger2 = new AuthLogger("Diagnostics");
          try {
            const report = {
              timestamp: (/* @__PURE__ */ new Date()).toISOString(),
              environment: this.getEnvironmentInfo(),
              storage: this.getStorageInfo(),
              network: logger2.logNetworkStatus(),
              performanceMetrics: Array.from(performanceMetrics.values()),
              recentErrors: []
              // Could be populated from error tracking
            };
            logger2.info("Diagnostics report generated", report);
            return report;
          } catch (error) {
            logger2.error("Failed to generate diagnostics report", error);
            return { error: "Failed to generate report", details: error.message };
          }
        });
      }
    }
    new AuthLogger("Auth");
    const logger = new AuthLogger("UnifiedAuth");
    const signupLogger = logger.createChild("Signup");
    logger.createChild("Signin");
    logger.createChild("OAuth");
    logger.createChild("Session");
    let currentUser = null;
    let currentSession = null;
    let authListeners = [];
    logger.info("Unified Auth service initialized", {
      endpoint: "https://nyc.cloud.appwrite.io/v1",
      projectId: "689bdaf500072795b0f6",
      environment: AuthDebugger.getEnvironmentInfo()
    });
    function notifyAuthListeners(user, session, reason = "state_change") {
      const previousUser = currentUser;
      currentUser = user;
      currentSession = session;
      const fromState = previousUser ? "authenticated" : "unauthenticated";
      const toState = user ? "authenticated" : "unauthenticated";
      if (fromState !== toState) {
        logger.logStateChange(fromState, toState, reason, user);
      }
      let successfulNotifications = 0;
      let failedNotifications = 0;
      authListeners.forEach((listener, index) => {
        try {
          listener(user, session);
          successfulNotifications++;
        } catch (error) {
          failedNotifications++;
          logger.error("Auth listener ".concat(index, " failed"), error, { listenerIndex: index });
        }
      });
      logger.debug("Notified ".concat(successfulNotifications, " listeners, ").concat(failedNotifications, " failed"));
    }
    const appwriteAuth = {
      /**
       * Email/Password Registration - FIXED to handle 409 errors properly
       * CRITICAL FIX: Removes problematic user existence checking that creates signin attempts during signup
       */
      signup(email, password, name) {
        return __async(this, null, function* () {
          var _a2, _b2, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l;
          const timer = signupLogger.startTimer("email_signup");
          console.log("[SIGNUP-DEBUG] ==> Starting FIXED signup process (no signin attempts)");
          console.log("[SIGNUP-DEBUG] Email:", email);
          console.log("[SIGNUP-DEBUG] Password length:", password == null ? void 0 : password.length);
          console.log("[SIGNUP-DEBUG] Name:", name);
          try {
            signupLogger.info("Starting email signup", {
              email,
              hasPassword: !!password,
              hasName: !!name,
              passwordLength: (password == null ? void 0 : password.length) || 0
            });
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              throw new Error("Please enter a valid email address");
            }
            if (!password || password.length < 8) {
              throw new Error("Password must be at least 8 characters long");
            }
            if (password.length > 256) {
              throw new Error("Password must be less than 256 characters");
            }
            let displayName = (name == null ? void 0 : name.trim()) || "";
            if (!displayName) {
              const emailPrefix = email.split("@")[0];
              displayName = emailPrefix.replace(/[^a-zA-Z0-9\s]/g, "").trim();
              if (!displayName) {
                displayName = "User";
              }
            }
            if (displayName.length > 128) {
              displayName = displayName.substring(0, 128);
            }
            if (displayName.length < 1) {
              displayName = "User";
            }
            console.log("[SIGNUP-DEBUG] ==> Creating account directly (no pre-checks)");
            try {
              yield forcedAccount.get();
              console.log("[SIGNUP-DEBUG] ⚠️ Found existing session, clearing it first");
              yield forcedAccount.deleteSession("current");
              currentUser = null;
              currentSession = null;
              localStorage.removeItem("appwrite-session");
              localStorage.removeItem("appwrite-user");
            } catch (existingSessionError) {
              if (existingSessionError.code === 401) {
                console.log("[SIGNUP-DEBUG] ✅ No existing session found");
              }
            }
            let user;
            try {
              const userId = ID.unique();
              const emailStr = String(email).trim().toLowerCase();
              const passwordStr = String(password);
              const nameStr = String(displayName).trim();
              if (passwordStr.length < 8) {
                throw new Error("Password must be at least 8 characters long.");
              }
              if (passwordStr.length > 256) {
                throw new Error("Password must be 256 characters or less.");
              }
              if (!emailStr.includes("@") || !emailStr.includes(".")) {
                throw new Error("Please enter a valid email address.");
              }
              if (nameStr.length < 1) {
                throw new Error("Name cannot be empty.");
              }
              if (nameStr.length > 128) {
                throw new Error("Name must be 128 characters or less.");
              }
              console.log("[SIGNUP-DEBUG] Final parameters:");
              console.log("[SIGNUP-DEBUG] - userId:", userId);
              console.log("[SIGNUP-DEBUG] - email:", emailStr);
              console.log("[SIGNUP-DEBUG] - password length:", passwordStr.length);
              console.log("[SIGNUP-DEBUG] - password first char:", passwordStr.charAt(0));
              console.log("[SIGNUP-DEBUG] - password last char:", passwordStr.charAt(passwordStr.length - 1));
              console.log("[SIGNUP-DEBUG] - name:", nameStr);
              console.log("[SIGNUP-DEBUG] - name length:", nameStr.length);
              console.log("[SIGNUP-DEBUG] - client endpoint:", ((_a2 = forcedClient.config) == null ? void 0 : _a2.endpoint) || "unknown");
              console.log("[SIGNUP-DEBUG] - client project:", ((_b2 = forcedClient.config) == null ? void 0 : _b2.project) || "unknown");
              console.log("[SIGNUP-DEBUG] - account object type:", typeof forcedAccount);
              console.log("[SIGNUP-DEBUG] - account.create function:", typeof forcedAccount.create);
              console.log("[SIGNUP-DEBUG] ==> Calling account.create() with validated parameters...");
              console.log("[SIGNUP-DEBUG] API call: account.create(userId, email, password, name)");
              try {
                console.log("[SIGNUP-DEBUG] Testing basic API connection...");
                const healthCheck = yield forcedAccount.get().catch((e) => {
                  console.log("[SIGNUP-DEBUG] No active session (expected):", e.code);
                  return { status: "no_session_ok" };
                });
                console.log("[SIGNUP-DEBUG] API connection test result:", healthCheck);
              } catch (healthError) {
                console.error("[SIGNUP-DEBUG] API connection test failed:", healthError);
              }
              user = yield forcedAccount.create(userId, emailStr, passwordStr, nameStr);
              console.log("[SIGNUP-DEBUG] ✅ Account created successfully!");
            } catch (createError) {
              console.error("[SIGNUP-DEBUG] ❌ Account creation failed:");
              console.error("[SIGNUP-DEBUG] Error code:", createError.code);
              console.error("[SIGNUP-DEBUG] Error type:", createError.type);
              console.error("[SIGNUP-DEBUG] Error message:", createError.message);
              console.error("[SIGNUP-DEBUG] Error response:", createError.response);
              console.error("[SIGNUP-DEBUG] Error status:", createError.status);
              console.error("[SIGNUP-DEBUG] Error headers:", createError.headers);
              console.error("[SIGNUP-DEBUG] Full error object:", createError);
              console.error("[SIGNUP-DEBUG] Error stack:", createError.stack);
              if (createError.response) {
                console.error("[SIGNUP-DEBUG] Response body:", createError.response);
                console.error("[SIGNUP-DEBUG] Response status:", (_c2 = createError.response) == null ? void 0 : _c2.status);
                console.error("[SIGNUP-DEBUG] Response headers:", (_d = createError.response) == null ? void 0 : _d.headers);
              }
              if (createError.code === 400) {
                if ((_e = createError.message) == null ? void 0 : _e.includes("email")) {
                  throw new Error("Invalid email format. Please check your email address.");
                } else if ((_f = createError.message) == null ? void 0 : _f.includes("password")) {
                  throw new Error("Invalid password. Password must be 8-256 characters with no special restrictions.");
                } else if ((_g = createError.message) == null ? void 0 : _g.includes("name")) {
                  throw new Error("Invalid name. Please use only letters, numbers, and spaces.");
                } else if (createError.type === "user_already_exists") {
                  throw new Error("An account with this email already exists. Please sign in instead.");
                } else if (((_h = createError.message) == null ? void 0 : _h.includes("auth")) || ((_i = createError.message) == null ? void 0 : _i.includes("disabled"))) {
                  throw new Error("Email signup is currently disabled. Please try using Google sign-in instead.");
                } else {
                  const errorDetails = "Server response: ".concat(createError.message || "Unknown error");
                  throw new Error("Signup failed. ".concat(errorDetails, ". Please try using Google sign-in instead."));
                }
              } else if (createError.code === 409) {
                throw new Error("An account with this email already exists. Please sign in instead.");
              } else if (createError.code === 429) {
                throw new Error("Too many signup attempts. Please wait a moment and try again.");
              } else if (createError.code === 503 || createError.code === 500) {
                throw new Error("Server error. Please try again in a few moments.");
              } else {
                throw createError;
              }
            }
            signupLogger.info("User account created successfully", {
              userId: user.$id,
              userEmail: user.email,
              emailVerification: user.emailVerification
            });
            try {
              console.log("[SIGNUP-DEBUG] Auto-signing in to get session for verification email...");
              yield forcedAccount.createEmailPasswordSession(email, password);
              console.log("[SIGNUP-DEBUG] ✅ Session created, now sending verification email...");
              try {
                yield forcedAccount.createVerification("https://chat.recursionsystems.com/verify");
                signupLogger.info("Verification email sent successfully");
              } catch (verifyError) {
                signupLogger.error("Verification email failed", verifyError, {
                  userId: user.$id,
                  fallbackOptions: ["manual_verification", "admin_activation"]
                });
              }
            } catch (sessionError) {
              console.warn("[SIGNUP-DEBUG] Could not auto-sign in for verification email:", sessionError.message);
            }
            const performanceData = signupLogger.endTimer(timer, {
              success: true,
              userId: user.$id,
              emailVerificationSent: true
            });
            return {
              success: true,
              user,
              requiresVerification: true,
              message: "Account created successfully! Please check your email for verification.",
              performanceMetrics: performanceData
            };
          } catch (error) {
            signupLogger.error("Signup failed", error, {
              email,
              signupAttemptId: timer
            });
            signupLogger.endTimer(timer, {
              success: false,
              errorCode: (error == null ? void 0 : error.code) || "NO_CODE",
              errorType: (error == null ? void 0 : error.type) || "UNKNOWN"
            });
            if ((error == null ? void 0 : error.code) === 409 || (error == null ? void 0 : error.type) === "user_already_exists") {
              console.log("[SIGNUP-DEBUG] 🔄 409 error detected - user exists, attempting automatic signin...");
              try {
                console.log("[SIGNUP-DEBUG] Attempting signin for existing user...");
                const signinResult = yield this.signin(email, password);
                if (signinResult.success) {
                  console.log("[SIGNUP-DEBUG] ✅ Automatic signin successful for existing user");
                  return {
                    success: true,
                    user: signinResult.user,
                    session: signinResult.session,
                    message: "Welcome back! You already had an account, so we signed you in.",
                    autoSignin: true
                  };
                }
              } catch (signinError) {
                console.error("[SIGNUP-DEBUG] ❌ Automatic signin failed:", signinError.message);
                if (signinError.code === 401) {
                  throw new Error("An account with this email already exists, but the password is incorrect. Please use the correct password or reset it.");
                } else {
                  throw new Error("An account with this email already exists. Please sign in instead.");
                }
              }
              throw new Error("An account with this email already exists. Please sign in instead.");
            } else if ((error == null ? void 0 : error.code) === 400) {
              if ((_j = error.message) == null ? void 0 : _j.includes("password")) {
                throw new Error("Password must be between 8 and 256 characters");
              } else if ((_k = error.message) == null ? void 0 : _k.includes("email")) {
                throw new Error("Please enter a valid email address");
              } else if ((_l = error.message) == null ? void 0 : _l.includes("userId")) {
                throw new Error("Invalid user ID format. Please try again.");
              } else {
                throw new Error("Invalid input. Please check your email and password.");
              }
            } else if (error.message && !error.code) {
              throw error;
            }
            throw new Error(error.message || "Account creation failed. Please try again.");
          }
        });
      },
      /**
       * Email/Password Sign In - Enhanced with Session Cleanup
       * CRITICAL FIX: Clear any existing sessions before attempting new sign-in
       */
      signin(email, password) {
        return __async(this, null, function* () {
          var _a2, _b2, _c2, _d;
          try {
            console.log("[SIGNIN-DEBUG] ==> Starting signin process");
            console.log("[SIGNIN-DEBUG] Raw inputs received:");
            console.log("[SIGNIN-DEBUG] - email type:", typeof email);
            console.log("[SIGNIN-DEBUG] - email value:", email);
            console.log("[SIGNIN-DEBUG] - email length:", email == null ? void 0 : email.length);
            console.log("[SIGNIN-DEBUG] - password type:", typeof password);
            console.log("[SIGNIN-DEBUG] - password length:", password == null ? void 0 : password.length);
            console.log("[SIGNIN-DEBUG] - Timestamp:", (/* @__PURE__ */ new Date()).toISOString());
            console.log("[SIGNIN-DEBUG] - User agent:", navigator.userAgent);
            console.log("[SIGNIN-DEBUG] - Current URL:", window.location.href);
            console.log("[SIGNIN-DEBUG] - Client endpoint:", ((_a2 = forcedClient.config) == null ? void 0 : _a2.endpoint) || "unknown");
            console.log("[SIGNIN-DEBUG] - Client project:", ((_b2 = forcedClient.config) == null ? void 0 : _b2.project) || "unknown");
            console.log("[SIGNIN-DEBUG] - Account object type:", typeof forcedAccount);
            console.log("[SIGNIN-DEBUG] - Account.createEmailPasswordSession function:", typeof forcedAccount.createEmailPasswordSession);
            console.log("[Auth] 🔐 Starting email signin for:", email);
            if (!email || !password) {
              throw new Error("Please enter both email and password");
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              throw new Error("Please enter a valid email address");
            }
            const isOAuthCallback = window.location.hash.includes("/auth/") || window.location.pathname.includes("/auth/");
            if (!isOAuthCallback) {
              console.log("[SIGNIN-DEBUG] ==> Checking for existing sessions before signin...");
              try {
                const existingUser = yield forcedAccount.get();
                console.log("[SIGNIN-DEBUG] ⚠️ Found existing session for:", existingUser.email);
                console.log("[SIGNIN-DEBUG] Clearing existing session to prevent conflicts...");
                yield forcedAccount.deleteSession("current");
                console.log("[SIGNIN-DEBUG] ✅ Existing session cleared successfully");
                currentUser = null;
                currentSession = null;
                localStorage.removeItem("appwrite-session");
                localStorage.removeItem("appwrite-user");
              } catch (existingSessionError) {
                if (existingSessionError.code === 401) {
                  console.log("[SIGNIN-DEBUG] ✅ No existing session found (expected)");
                } else {
                  console.log("[SIGNIN-DEBUG] ⚠️ Error checking existing session:", existingSessionError.message);
                }
              }
            } else {
              console.log("[SIGNIN-DEBUG] 🔄 OAuth callback detected - skipping session cleanup to preserve OAuth session");
            }
            try {
              console.log("[SIGNIN-DEBUG] Testing basic API connection...");
              const healthCheck = yield forcedAccount.get().catch((e) => {
                console.log("[SIGNIN-DEBUG] No active session confirmed:", e.code);
                return { status: "no_session_ok" };
              });
              console.log("[SIGNIN-DEBUG] API connection test result:", healthCheck);
            } catch (healthError) {
              console.error("[SIGNIN-DEBUG] API connection test failed:", healthError);
            }
            console.log("[SIGNIN-DEBUG] ==> Calling account.createEmailPasswordSession()...");
            console.log("[SIGNIN-DEBUG] API call: account.createEmailPasswordSession(email, password)");
            console.log("[SIGNIN-DEBUG] - Final email:", email);
            console.log("[SIGNIN-DEBUG] - Password length:", password == null ? void 0 : password.length);
            const session = yield forcedAccount.createEmailPasswordSession(email, password);
            console.log("[SIGNIN-DEBUG] ✅ Session creation successful!");
            console.log("[SIGNIN-DEBUG] Session details:");
            console.log("[SIGNIN-DEBUG] - Session ID:", session.$id);
            console.log("[SIGNIN-DEBUG] - Session provider:", session.provider);
            console.log("[SIGNIN-DEBUG] - Session created at:", session.$createdAt);
            console.log("[SIGNIN-DEBUG] - Session expires:", session.expire);
            console.log("[Auth] ✅ Session created:", session.$id);
            console.log("[Auth] 🔍 Validating new session with account.get()...");
            const user = yield forcedAccount.get();
            console.log("[Auth] ✅ User data retrieved:", user.email);
            console.log("[Auth] Email verified:", user.emailVerification);
            currentUser = user;
            currentSession = session;
            try {
              localStorage.setItem("appwrite-session", JSON.stringify({
                id: session.$id,
                userId: user.$id,
                provider: session.provider || "email",
                expires: session.expire || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
              }));
              localStorage.setItem("appwrite-user", JSON.stringify({
                $id: user.$id,
                email: user.email,
                name: user.name,
                emailVerification: user.emailVerification
              }));
              console.log("[Auth] ✅ Session persisted to localStorage");
            } catch (storageError) {
              console.warn("[Auth] ⚠️ Could not persist session:", storageError.message);
            }
            notifyAuthListeners(user, session);
            return {
              success: true,
              session,
              user,
              emailVerified: user.emailVerification,
              message: "Successfully signed in!"
            };
          } catch (error) {
            console.error("[SIGNIN-DEBUG] ❌ Signin failed:");
            console.error("[SIGNIN-DEBUG] Error code:", error.code);
            console.error("[SIGNIN-DEBUG] Error type:", error.type);
            console.error("[SIGNIN-DEBUG] Error message:", error.message);
            console.error("[SIGNIN-DEBUG] Error response:", error.response);
            console.error("[SIGNIN-DEBUG] Error status:", error.status);
            console.error("[SIGNIN-DEBUG] Error headers:", error.headers);
            console.error("[SIGNIN-DEBUG] Full error object:", error);
            console.error("[SIGNIN-DEBUG] Error stack:", error.stack);
            if (error.response) {
              console.error("[SIGNIN-DEBUG] Response body:", error.response);
              console.error("[SIGNIN-DEBUG] Response status:", (_c2 = error.response) == null ? void 0 : _c2.status);
              console.error("[SIGNIN-DEBUG] Response headers:", (_d = error.response) == null ? void 0 : _d.headers);
            }
            console.error("[Auth] ❌ Signin failed:", error);
            console.error("[Auth] Error code:", error.code);
            if (error.code === 401) {
              throw new Error("Invalid email or password. Please check your credentials and try again.");
            } else if (error.code === 400) {
              throw new Error("Invalid request. Please check your email and password format.");
            } else if (error.message && !error.code) {
              throw error;
            }
            throw new Error(error.message || "Sign in failed. Please try again.");
          }
        });
      },
      /**
       * Sign Out - Enhanced to prevent popup issues
       */
      signout() {
        return __async(this, null, function* () {
          try {
            console.log("[Auth] 🚪 Signing out current user");
            try {
              yield forcedAccount.deleteSession("current");
            } catch (sessionError) {
              console.warn("[Auth] Session deletion failed (may already be expired):", sessionError.message);
            }
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("session");
            localStorage.removeItem("appwrite-session");
            localStorage.removeItem("oauth-provider");
            sessionStorage.clear();
            currentUser = null;
            currentSession = null;
            notifyAuthListeners(null, null);
            console.log("[Auth] ✅ Successfully signed out and cleared all auth state");
            return { success: true };
          } catch (error) {
            console.error("[Auth] ❌ Signout failed:", error);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("session");
            localStorage.removeItem("appwrite-session");
            localStorage.removeItem("oauth-provider");
            sessionStorage.clear();
            currentUser = null;
            currentSession = null;
            notifyAuthListeners(null, null);
            console.log("[Auth] ⚠️ Forced local auth state cleanup after signout error");
            return { success: true, warning: "Local signout completed, server signout failed" };
          }
        });
      },
      /**
       * Google OAuth Sign In - REDIRECT-ONLY Implementation
       * Completely removes popup behavior to prevent popup login issues
       */
      signInWithGoogle() {
        return __async(this, null, function* () {
          try {
            console.log("[Auth] 🔍 Starting Google OAuth signin (redirect-only)");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("session");
            sessionStorage.clear();
            const currentOrigin = window.location.origin;
            const isProduction = currentOrigin.includes("chat.recursionsystems.com");
            const baseUrl = isProduction ? "https://chat.recursionsystems.com" : currentOrigin;
            const successUrl = "".concat(baseUrl, "/#/auth/success");
            const failureUrl = "".concat(baseUrl, "/#/auth/failure");
            console.log("[Auth] OAuth redirect URLs (FIXED):", {
              baseUrl,
              successUrl,
              failureUrl,
              isProduction,
              currentOrigin
            });
            const oauthUrl = "https://nyc.cloud.appwrite.io/v1/account/sessions/oauth2/google?project=689bdaf500072795b0f6&success=".concat(encodeURIComponent(successUrl), "&failure=").concat(encodeURIComponent(failureUrl));
            console.log("[Auth] ✅ Redirecting to Google OAuth with correct URLs");
            console.log("[Auth] OAuth URL:", oauthUrl);
            console.log("[Auth] ⚠️ IMPORTANT: Ensure these URLs are configured in:");
            console.log("[Auth] 1. Google Cloud Console OAuth settings");
            console.log("[Auth] 2. Appwrite Console OAuth provider settings");
            window.location.replace(oauthUrl);
            return new Promise(() => {
            });
          } catch (error) {
            console.error("[Auth] ❌ Google OAuth redirect failed:", error);
            if (error.message.includes("region")) {
              throw new Error("Google sign-in temporarily unavailable. Please try email signin or try again later.");
            }
            if (error.message.includes("popup")) {
              throw new Error("Popup blocked. Please enable popups or try email signin.");
            }
            throw new Error(error.message || "Google sign in failed. Please try email signin.");
          }
        });
      },
      /**
       * Handle OAuth Callback - FIXED to prevent 409 user_already_exists errors
       * CRITICAL FIX: OAuth callbacks should NEVER try to create users - only authenticate existing sessions
       */
      handleOAuthCallback(urlParams) {
        return __async(this, null, function* () {
          var _a2, _b2, _c2;
          try {
            console.log("[Auth] 🔄 Processing FIXED OAuth callback (no user creation)");
            console.log("[Auth] URL params:", Object.fromEntries(urlParams.entries()));
            const error = urlParams.get("error");
            const errorDescription = urlParams.get("error_description");
            if (error) {
              console.error("[Auth] OAuth error in callback:", error, errorDescription);
              if (error.includes("user_already_exists") || (errorDescription == null ? void 0 : errorDescription.includes("user_already_exists"))) {
                console.log("[Auth] 🔄 OAuth callback received 409 - user exists, this is actually SUCCESS");
              } else {
                throw new Error(errorDescription || error || "OAuth authentication failed");
              }
            }
            console.log("[Auth] ⏳ Waiting for OAuth session to be established...");
            yield new Promise((resolve) => setTimeout(resolve, 2e3));
            let user = null;
            let session = null;
            let attempts = 0;
            const maxAttempts = 5;
            while (attempts < maxAttempts) {
              try {
                console.log("[Auth] 🔍 Validating OAuth session with account.get() (attempt ".concat(attempts + 1, "/").concat(maxAttempts, ")"));
                user = yield forcedAccount.get();
                console.log("[Auth] ✅ OAuth user validated:", user.email);
                console.log("[Auth] User ID:", user.$id);
                console.log("[Auth] Email verified:", user.emailVerification);
                try {
                  session = yield forcedAccount.getSession("current");
                  console.log("[Auth] ✅ OAuth session details:", {
                    sessionId: session.$id,
                    provider: session.provider,
                    created: session.$createdAt
                  });
                } catch (sessionDetailError) {
                  console.warn("[Auth] ⚠️ Could not get OAuth session details:", sessionDetailError.message);
                  session = {
                    $id: "oauth_".concat(user.$id, "_").concat(Date.now()),
                    userId: user.$id,
                    provider: "google",
                    $createdAt: (/* @__PURE__ */ new Date()).toISOString(),
                    synthetic: true
                  };
                  console.log("[Auth] ✅ Created synthetic OAuth session");
                }
                break;
              } catch (validationError) {
                console.warn("[Auth] OAuth session validation attempt ".concat(attempts + 1, " failed:"), validationError.message);
                attempts++;
                if (attempts < maxAttempts) {
                  const delay = 2e3 * Math.pow(1.5, attempts);
                  console.log("[Auth] Retrying OAuth validation in ".concat(delay, "ms..."));
                  yield new Promise((resolve) => setTimeout(resolve, delay));
                } else {
                  throw new Error("OAuth session validation failed after ".concat(maxAttempts, " attempts: ").concat(validationError.message));
                }
              }
            }
            if (!user) {
              throw new Error("OAuth callback completed but user validation failed");
            }
            console.log("[Auth] ✅ OAuth authentication completed successfully:", user.email);
            currentUser = user;
            currentSession = session;
            try {
              localStorage.setItem("oauth-provider", "google");
              localStorage.setItem("appwrite-session", JSON.stringify({
                id: session.$id,
                userId: user.$id,
                provider: session.provider || "google",
                expires: session.expire || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
              }));
              localStorage.setItem("appwrite-user", JSON.stringify({
                $id: user.$id,
                email: user.email,
                name: user.name,
                emailVerification: user.emailVerification
              }));
              console.log("[Auth] ✅ OAuth session persisted to localStorage");
            } catch (storageError) {
              console.warn("[Auth] ⚠️ Failed to store OAuth session info:", storageError.message);
            }
            notifyAuthListeners(user, session);
            return {
              success: true,
              session,
              user,
              provider: session.provider || "google",
              emailVerified: user.emailVerification,
              message: "Successfully signed in with Google!"
            };
          } catch (error) {
            console.error("[Auth] ❌ OAuth callback failed:", error);
            console.error("[Auth] Error details:", {
              message: error.message,
              code: error.code,
              type: error.type
            });
            let userFriendlyMessage = error.message;
            if (error.code === 401) {
              userFriendlyMessage = "Google sign-in was cancelled or expired. Please try again.";
            } else if ((_a2 = error.message) == null ? void 0 : _a2.includes("session")) {
              userFriendlyMessage = "Google sign-in completed but session creation failed. Please try signing in with email or try Google again.";
            } else if ((_b2 = error.message) == null ? void 0 : _b2.includes("network")) {
              userFriendlyMessage = "Network error during Google sign-in. Please check your connection and try again.";
            } else if ((_c2 = error.message) == null ? void 0 : _c2.includes("validation")) {
              userFriendlyMessage = "Google sign-in completed but could not validate the session. Please try again or use email sign-in.";
            }
            throw new Error(userFriendlyMessage);
          }
        });
      },
      /**
       * Get Current User
       */
      getCurrentUser() {
        return __async(this, null, function* () {
          try {
            if (currentUser) {
              return currentUser;
            }
            const user = yield forcedAccount.get();
            currentUser = user;
            return user;
          } catch (error) {
            if (error.code === 401) {
              return null;
            }
            console.error("[Auth] Get current user failed:", error);
            throw error;
          }
        });
      },
      /**
       * Get Current Session
       */
      getCurrentSession() {
        return __async(this, null, function* () {
          try {
            if (currentSession) {
              return currentSession;
            }
            const session = yield forcedAccount.getSession("current");
            currentSession = session;
            return session;
          } catch (error) {
            if (error.code === 401) {
              return null;
            }
            console.error("[Auth] Get current session failed:", error);
            throw error;
          }
        });
      },
      /**
       * Check if user is authenticated
       */
      isAuthenticated() {
        return __async(this, null, function* () {
          try {
            const user = yield this.getCurrentUser();
            return !!user;
          } catch (error) {
            return false;
          }
        });
      },
      /**
       * Verify Email
       */
      verifyEmail(userId, secret) {
        return __async(this, null, function* () {
          try {
            console.log("[Auth] 📧 Verifying email for user:", userId);
            yield forcedAccount.updateVerification(userId, secret);
            console.log("[Auth] ✅ Email verified successfully");
            return { success: true, message: "Email verified successfully!" };
          } catch (error) {
            console.error("[Auth] ❌ Email verification failed:", error);
            throw new Error(error.message || "Email verification failed");
          }
        });
      },
      /**
       * Send Password Reset Email
       */
      sendPasswordReset(email) {
        return __async(this, null, function* () {
          try {
            console.log("[Auth] 🔐 Sending password reset for:", email);
            yield forcedAccount.createRecovery(
              email,
              "https://chat.recursionsystems.com/reset-password"
            );
            console.log("[Auth] ✅ Password reset email sent");
            return { success: true, message: "Password reset email sent!" };
          } catch (error) {
            console.error("[Auth] ❌ Password reset failed:", error);
            throw new Error(error.message || "Failed to send password reset email");
          }
        });
      },
      /**
       * Complete Password Reset
       */
      completePasswordReset(userId, secret, newPassword, confirmPassword) {
        return __async(this, null, function* () {
          try {
            if (newPassword !== confirmPassword) {
              throw new Error("Passwords do not match");
            }
            console.log("[Auth] 🔐 Completing password reset for user:", userId);
            yield forcedAccount.updateRecovery(userId, secret, newPassword, confirmPassword);
            console.log("[Auth] ✅ Password reset completed");
            return { success: true, message: "Password reset successfully!" };
          } catch (error) {
            console.error("[Auth] ❌ Password reset completion failed:", error);
            throw new Error(error.message || "Password reset failed");
          }
        });
      },
      /**
       * Initialize Authentication - Enhanced with Proper account.get() Validation
       * Check for existing session on app start with robust session validation
       */
      initialize() {
        return __async(this, null, function* () {
          try {
            console.log("[Auth] 🚀 Initializing authentication system...");
            this.clearInvalidAuthState();
            console.log("[Auth] 🔍 Validating current session with account.get()...");
            let user = null;
            let session = null;
            try {
              user = yield forcedAccount.get();
              console.log("[Auth] ✅ Valid session found via account.get() for:", user.email);
              console.log("[Auth] User ID:", user.$id);
              console.log("[Auth] Email verified:", user.emailVerification);
              try {
                session = yield forcedAccount.getSession("current");
                console.log("[Auth] ✅ Session details retrieved:", {
                  sessionId: session.$id,
                  provider: session.provider,
                  created: session.$createdAt,
                  expires: session.expire
                });
                if (session.expire) {
                  const now = /* @__PURE__ */ new Date();
                  const sessionExpiry = new Date(session.expire);
                  if (now >= sessionExpiry) {
                    console.warn("[Auth] Session expired according to session.expire");
                    yield this.signout();
                    return { authenticated: false, user: null, session: null };
                  }
                }
              } catch (sessionError) {
                console.warn("[Auth] ⚠️ Could not get session details, but user is authenticated:", sessionError.message);
                session = {
                  $id: "synthetic_".concat(user.$id),
                  userId: user.$id,
                  provider: "appwrite",
                  $createdAt: user.$createdAt,
                  synthetic: true
                };
                console.log("[Auth] ✅ Created synthetic session for authenticated user");
              }
              currentUser = user;
              currentSession = session;
              try {
                localStorage.setItem("appwrite-session", JSON.stringify({
                  id: session.$id,
                  userId: user.$id,
                  provider: session.provider || "appwrite",
                  expires: session.expire || new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString()
                }));
                localStorage.setItem("appwrite-user", JSON.stringify({
                  $id: user.$id,
                  email: user.email,
                  name: user.name,
                  emailVerification: user.emailVerification
                }));
                console.log("[Auth] ✅ Session data stored in localStorage");
              } catch (storageError) {
                console.warn("[Auth] ⚠️ Could not store session in localStorage:", storageError.message);
              }
              notifyAuthListeners(user, session);
              return {
                authenticated: true,
                user,
                session,
                provider: session.provider || "appwrite",
                emailVerified: user.emailVerification
              };
            } catch (accountError) {
              if (accountError.code === 401) {
                console.log("[Auth] ℹ️ No active session - user needs to authenticate");
              } else {
                console.error("[Auth] ❌ Error validating session:", accountError.message);
              }
            }
            console.log("[Auth] 🔄 Attempting session recovery from localStorage...");
            try {
              const storedSession = localStorage.getItem("appwrite-session");
              const storedUser = localStorage.getItem("appwrite-user");
              if (storedSession && storedUser) {
                const sessionData = JSON.parse(storedSession);
                const userData = JSON.parse(storedUser);
                if (sessionData.expires) {
                  const now = /* @__PURE__ */ new Date();
                  const expires = new Date(sessionData.expires);
                  if (now < expires) {
                    console.log("[Auth] ✅ Recovered valid session from localStorage");
                    currentUser = userData;
                    currentSession = {
                      $id: sessionData.id,
                      userId: sessionData.userId,
                      provider: sessionData.provider,
                      recovered: true
                    };
                    try {
                      const validUser = yield forcedAccount.get();
                      if (validUser.$id === userData.$id) {
                        console.log("[Auth] ✅ LocalStorage session validated with Appwrite");
                        currentUser = validUser;
                        notifyAuthListeners(validUser, currentSession);
                        return { authenticated: true, user: validUser, session: currentSession, provider: sessionData.provider };
                      }
                    } catch (revalidationError) {
                      console.warn("[Auth] ⚠️ Could not revalidate recovered session:", revalidationError.message);
                      localStorage.removeItem("appwrite-session");
                      localStorage.removeItem("appwrite-user");
                    }
                  } else {
                    console.warn("[Auth] Stored session expired, clearing...");
                    localStorage.removeItem("appwrite-session");
                    localStorage.removeItem("appwrite-user");
                  }
                }
              }
            } catch (recoveryError) {
              console.error("[Auth] Error during session recovery:", recoveryError.message);
            }
            console.log("[Auth] ℹ️ No valid session found - user needs to authenticate");
            return { authenticated: false, user: null, session: null };
          } catch (error) {
            console.error("[Auth] ❌ Authentication initialization failed:", error.message);
            console.error("[Auth] Error details:", {
              message: error.message,
              code: error.code,
              type: error.type
            });
            this.clearInvalidAuthState();
            return { authenticated: false, user: null, session: null };
          }
        });
      },
      /**
       * Clear Invalid Authentication State
       * Helper to clean up corrupted auth data
       */
      clearInvalidAuthState() {
        try {
          const hasToken = localStorage.getItem("token");
          const hasUser = localStorage.getItem("user");
          const hasSession = localStorage.getItem("session");
          if ((hasToken || hasUser || hasSession) && !currentUser && !currentSession) {
            console.log("[Auth] Clearing invalid cached auth state");
            const authKeys = ["token", "user", "session", "oauth-provider", "appwrite-session"];
            authKeys.forEach((key) => {
              localStorage.removeItem(key);
              sessionStorage.removeItem(key);
            });
          }
        } catch (error) {
          console.warn("[Auth] Error clearing invalid auth state:", error.message);
        }
      }
    };
    function EmailVerification() {
      const [searchParams] = useSearchParams();
      const navigate = useNavigate();
      const [status, setStatus] = reactExports.useState("processing");
      const [message, setMessage] = reactExports.useState("Verifying your email...");
      const [error, setError] = reactExports.useState(null);
      reactExports.useEffect(() => {
        handleEmailVerification();
      }, []);
      const handleEmailVerification = () => __async(null, null, function* () {
        try {
          setStatus("processing");
          setMessage("Verifying your email address...");
          const userId = searchParams.get("userId");
          const secret = searchParams.get("secret");
          console.log("[EmailVerification] Processing verification:", { userId, secret: secret ? "***" : "missing" });
          if (!userId || !secret) {
            throw new Error("Invalid verification link. Please check the link in your email.");
          }
          const result = yield appwriteAuth.verifyEmail(userId, secret);
          if (result.success) {
            console.log("[EmailVerification] ✅ Email verification successful");
            setStatus("success");
            setMessage("Email verified successfully! You can now sign in.");
            setTimeout(() => {
              navigate("/auth", { replace: true });
            }, 3e3);
          } else {
            throw new Error("Email verification failed. Please try again.");
          }
        } catch (error2) {
          console.error("[EmailVerification] ❌ Verification failed:", error2);
          setStatus("error");
          setError(error2);
          setMessage(error2.message || "Email verification failed");
          setTimeout(() => {
            navigate("/auth", { replace: true });
          }, 5e3);
        }
      });
      const retry = () => {
        console.log("[EmailVerification] Manual retry - redirecting to auth");
        navigate("/auth", { replace: true });
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-wrapper", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-background", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-pattern" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "auth-container", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "auth-header", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "recursion-logo", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-symbol", children: "📧" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "logo-text recursion-brand large", children: "Email Verification" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "logo-tagline", children: "∞ Confirming Your Account ∞" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "auth-content", children: [
            status === "processing" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "callback-spinner", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-large" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "callback-title", children: "Verifying Email..." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "callback-message", children: message }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "callback-progress", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-fill processing" }) }) })
            ] }),
            status === "success" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "callback-icon success", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", children: "✓" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "callback-title", children: "Email Verified!" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "callback-message success", children: message }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "callback-progress", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-bar", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "progress-fill success" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "progress-text", children: "Redirecting to sign in..." })
              ] })
            ] }),
            status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "callback-icon error", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "icon", children: "!" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "callback-title", children: "Verification Failed" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "callback-message error", children: message }),
              error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "callback-error-details", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("summary", { children: "Error Details" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("pre", { children: JSON.stringify(error, null, 2) })
              ] }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "callback-troubleshooting", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "Possible Solutions:" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Check that you clicked the correct verification link" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Make sure the link hasn't expired" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Try requesting a new verification email" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Contact support if the issue persists" })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "callback-actions", children: /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: retry, className: "retry-button", children: "Back to Sign In" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "callback-redirect-notice", children: "You will be redirected automatically in 5 seconds..." })
            ] })
          ] })
        ] }) })
      ] });
    }
    const SimpleMobileAuthContext = reactExports.createContext({});
    const useSimpleMobileAuth = () => reactExports.useContext(SimpleMobileAuthContext);
    const SimpleMobileAuthProvider = ({ children }) => {
      const [user, setUser] = reactExports.useState(null);
      const [loading, setLoading] = reactExports.useState(true);
      const [isAuthenticated, setIsAuthenticated] = reactExports.useState(false);
      const [authError, setAuthError] = reactExports.useState(null);
      const [authToken, setAuthToken] = reactExports.useState(null);
      const initRef = reactExports.useRef(false);
      const isMobileSafari = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS/i.test(navigator.userAgent);
      const checkStoredAuth = reactExports.useCallback(() => {
        try {
          const storedUser = localStorage.getItem("user_data") || sessionStorage.getItem("user_data");
          const storedToken = localStorage.getItem("auth_token") || localStorage.getItem("backend_token") || sessionStorage.getItem("auth_token") || sessionStorage.getItem("backend_token");
          if (storedUser && storedToken) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setAuthToken(storedToken);
            setIsAuthenticated(true);
            setAuthError(null);
            return true;
          }
        } catch (error) {
        }
        return false;
      }, []);
      const initializeAuth = reactExports.useCallback(() => __async(null, null, function* () {
        var _a2, _b2;
        if (initRef.current) {
          return;
        }
        initRef.current = true;
        try {
          if (isMobileSafari) {
            if (checkStoredAuth()) {
              setLoading(false);
              return;
            }
          }
          const authResult = yield enhancedAuth.init();
          if (authResult.isAuthenticated && authResult.user) {
            const userData = authResult.user;
            const token = ((_a2 = authResult.session) == null ? void 0 : _a2.access_token) || ((_b2 = authResult.session) == null ? void 0 : _b2.$id) || "simple_auth_".concat(userData.$id, "_").concat(Date.now());
            setUser(userData);
            setAuthToken(token);
            setIsAuthenticated(true);
            setAuthError(null);
            try {
              localStorage.setItem("user_data", JSON.stringify(userData));
              localStorage.setItem("auth_token", token);
              localStorage.setItem("backend_token", token);
              if (isMobileSafari) {
                sessionStorage.setItem("user_data", JSON.stringify(userData));
                sessionStorage.setItem("auth_token", token);
              }
            } catch (storageError) {
            }
          } else {
            setIsAuthenticated(false);
            setUser(null);
            setAuthToken(null);
          }
        } catch (error) {
          if (isMobileSafari && checkStoredAuth()) ;
          else {
            setAuthError(error.message);
            setIsAuthenticated(false);
            setUser(null);
            setAuthToken(null);
          }
        } finally {
          setLoading(false);
          initRef.current = false;
        }
      }), [checkStoredAuth, isMobileSafari]);
      const loginWithEmail = reactExports.useCallback((email, password) => __async(null, null, function* () {
        var _a2, _b2;
        if (!email || !password) {
          throw new Error("Email and password are required");
        }
        setLoading(true);
        setAuthError(null);
        try {
          const result = yield enhancedAuth.loginWithEmail(email, password);
          if (!result || !result.user) {
            throw new Error("Login failed - no user data received");
          }
          const userData = result.user;
          const token = ((_a2 = result.session) == null ? void 0 : _a2.access_token) || ((_b2 = result.session) == null ? void 0 : _b2.$id) || "simple_login_".concat(userData.$id, "_").concat(Date.now());
          setUser(userData);
          setAuthToken(token);
          setIsAuthenticated(true);
          try {
            localStorage.setItem("user_data", JSON.stringify(userData));
            localStorage.setItem("auth_token", token);
            localStorage.setItem("backend_token", token);
            if (isMobileSafari) {
              sessionStorage.setItem("user_data", JSON.stringify(userData));
              sessionStorage.setItem("auth_token", token);
              sessionStorage.setItem("mobile_auth_success", "true");
            }
          } catch (storageError) {
          }
          return { success: true };
        } catch (error) {
          setAuthError(error.message);
          throw error;
        } finally {
          setLoading(false);
        }
      }), [isMobileSafari]);
      const loginWithOAuth = reactExports.useCallback((provider) => __async(null, null, function* () {
        setLoading(true);
        setAuthError(null);
        try {
          const baseUrl = window.location.origin;
          const successUrl = "".concat(baseUrl, "/auth/callback");
          const failureUrl = "".concat(baseUrl, "/auth/error");
          yield enhancedAuth.loginWithOAuth(provider, successUrl, failureUrl);
        } catch (error) {
          setAuthError(error.message);
          setLoading(false);
          throw error;
        }
      }), []);
      const handleOAuthCallback2 = reactExports.useCallback(() => __async(null, null, function* () {
        var _a2, _b2;
        setLoading(true);
        setAuthError(null);
        try {
          const result = yield enhancedAuth.handleOAuthCallback();
          const userData = result.user;
          const token = ((_a2 = result.session) == null ? void 0 : _a2.access_token) || ((_b2 = result.session) == null ? void 0 : _b2.$id) || "oauth_callback_".concat(userData.$id, "_").concat(Date.now());
          setUser(userData);
          setAuthToken(token);
          setIsAuthenticated(true);
          try {
            localStorage.setItem("user_data", JSON.stringify(userData));
            localStorage.setItem("auth_token", token);
            localStorage.setItem("backend_token", token);
            if (isMobileSafari) {
              sessionStorage.setItem("user_data", JSON.stringify(userData));
              sessionStorage.setItem("auth_token", token);
              sessionStorage.setItem("oauth_callback_success", "true");
            }
          } catch (storageError) {
          }
          return { success: true };
        } catch (error) {
          setAuthError(error.message);
          throw error;
        } finally {
          setLoading(false);
        }
      }), [isMobileSafari]);
      const register = reactExports.useCallback((email, password, username) => __async(null, null, function* () {
        var _a2, _b2;
        if (!email || !password) {
          throw new Error("Email and password are required");
        }
        setLoading(true);
        setAuthError(null);
        try {
          const result = yield enhancedAuth.register(email, password, username);
          if (!result || !result.user) {
            throw new Error("Registration failed - no user data received");
          }
          const userData = result.user;
          const token = ((_a2 = result.session) == null ? void 0 : _a2.access_token) || ((_b2 = result.session) == null ? void 0 : _b2.$id) || "simple_register_".concat(userData.$id, "_").concat(Date.now());
          setUser(userData);
          setAuthToken(token);
          setIsAuthenticated(true);
          try {
            localStorage.setItem("user_data", JSON.stringify(userData));
            localStorage.setItem("auth_token", token);
            localStorage.setItem("backend_token", token);
            if (isMobileSafari) {
              sessionStorage.setItem("user_data", JSON.stringify(userData));
              sessionStorage.setItem("auth_token", token);
              sessionStorage.setItem("registration_success", "true");
            }
          } catch (storageError) {
          }
          return { success: true };
        } catch (error) {
          setAuthError(error.message);
          throw error;
        } finally {
          setLoading(false);
        }
      }), [isMobileSafari]);
      const logout = reactExports.useCallback(() => __async(null, null, function* () {
        setLoading(true);
        try {
          setUser(null);
          setAuthToken(null);
          setIsAuthenticated(false);
          setAuthError(null);
          const keysToRemove = ["user_data", "auth_token", "backend_token", "token"];
          keysToRemove.forEach((key) => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
          });
          if (isMobileSafari) {
            const mobileKeys = ["mobile_auth_success", "oauth_callback_success", "registration_success"];
            mobileKeys.forEach((key) => sessionStorage.removeItem(key));
          }
          enhancedAuth.logout().catch(() => {
          });
        } catch (error) {
        } finally {
          setLoading(false);
          window.location.replace("/auth/signin");
        }
      }), [isMobileSafari]);
      const getApiToken = reactExports.useCallback(() => {
        return authToken || localStorage.getItem("auth_token") || localStorage.getItem("backend_token") || (isMobileSafari ? sessionStorage.getItem("auth_token") : null);
      }, [authToken, isMobileSafari]);
      reactExports.useEffect(() => {
        initializeAuth();
      }, [initializeAuth]);
      const value = {
        // Auth state
        user,
        loading,
        isAuthenticated,
        authError,
        authToken,
        isMobileSafari,
        // Auth methods
        loginWithEmail,
        loginWithOAuth,
        handleOAuthCallback: handleOAuthCallback2,
        register,
        logout,
        // Utility methods
        getApiToken,
        // Legacy compatibility
        signOut: logout,
        session: authToken ? { access_token: authToken } : null,
        getApiTokenSync: getApiToken,
        appwriteUser: user,
        appwriteSession: authToken ? { access_token: authToken } : null,
        useAppwrite: true,
        isAppwriteAvailable: () => isAuthenticated,
        getCurrentAuthProvider: () => isAuthenticated ? "appwrite" : null
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileAuthContext.Provider, { value, children });
    };
    function SimpleMobileProtectedRoute({ children }) {
      const {
        user,
        loading,
        isAuthenticated,
        isMobileSafari,
        getApiToken
      } = useSimpleMobileAuth();
      const [authCheckDone, setAuthCheckDone] = reactExports.useState(false);
      const isMobileSafariFallback = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS/i.test(navigator.userAgent);
      const actuallyMobileSafari = isMobileSafari || isMobileSafariFallback;
      reactExports.useEffect(() => {
        if (actuallyMobileSafari) {
          const hasStoredAuth = !!(localStorage.getItem("user_data") || sessionStorage.getItem("user_data") || localStorage.getItem("auth_token") || sessionStorage.getItem("auth_token") || getApiToken());
          if (hasStoredAuth || isAuthenticated) {
            setAuthCheckDone(true);
            return;
          }
        }
        if (!loading) {
          setAuthCheckDone(true);
        }
      }, [loading, isAuthenticated, user, actuallyMobileSafari, getApiToken]);
      const renderContent = () => {
        if (loading && !authCheckDone) {
          return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontFamily: "system-ui, sans-serif"
          }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              width: "50px",
              height: "50px",
              border: "3px solid rgba(255,255,255,0.3)",
              borderTopColor: "white",
              borderRadius: "50%",
              margin: "0 auto 1rem",
              animation: "spin 1s linear infinite"
            } }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { margin: "0 0 0.5rem" }, children: actuallyMobileSafari ? "📱 Mobile authentication..." : "Checking authentication..." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: { fontSize: "14px", opacity: 0.8, margin: 0 }, children: actuallyMobileSafari ? "Mobile Safari optimized" : "Please wait" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("style", { dangerouslySetInnerHTML: {
              __html: "@keyframes spin { to { transform: rotate(360deg); } }"
            } })
          ] }) });
        }
        if (authCheckDone) {
          if (isAuthenticated && user) {
            return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
          }
          if (actuallyMobileSafari) {
            const hasStoredAuth = !!(localStorage.getItem("user_data") || sessionStorage.getItem("user_data"));
            if (hasStoredAuth) {
              return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
            }
          }
          const currentPath = window.location.pathname;
          if (currentPath !== "/" && currentPath !== "/auth" && currentPath !== "/auth/signin") {
            sessionStorage.setItem("auth_redirect", currentPath);
          }
          return /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/auth/signin", replace: true });
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white"
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Loading..." }) }) });
      };
      return renderContent();
    }
    const log = (msg, ...args) => {
    };
    function SimpleMobileAuthPage() {
      const navigate = useNavigate();
      const {
        loginWithEmail,
        loginWithOAuth,
        register,
        loading,
        authError,
        isAuthenticated,
        isMobileSafari
      } = useSimpleMobileAuth();
      const [formMode, setFormMode] = reactExports.useState("signin");
      const [email, setEmail] = reactExports.useState("");
      const [password, setPassword] = reactExports.useState("");
      const [username, setUsername] = reactExports.useState("");
      const [formError, setFormError] = reactExports.useState("");
      const [isSubmitting, setIsSubmitting] = reactExports.useState(false);
      reactExports.useEffect(() => {
        if (isAuthenticated) {
          const redirectPath = sessionStorage.getItem("auth_redirect") || "/rooms";
          sessionStorage.removeItem("auth_redirect");
          navigate(redirectPath, { replace: true });
        }
      }, [isAuthenticated, navigate]);
      const handleSubmit = (e) => __async(null, null, function* () {
        e.preventDefault();
        if (isSubmitting || loading) return;
        setFormError("");
        setIsSubmitting(true);
        log("📋 Form submission", {
          mode: formMode,
          email: email.substring(0, 5) + "...",
          hasPassword: !!password
        });
        try {
          if (!email || !password) {
            throw new Error("Email and password are required");
          }
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            throw new Error("Please enter a valid email address");
          }
          if (password.length < 6) {
            throw new Error("Password must be at least 6 characters");
          }
          if (formMode === "signin") {
            yield loginWithEmail(email, password);
          } else {
            const displayName = username || email.split("@")[0];
            yield register(email, password, displayName);
          }
        } catch (error) {
          setFormError(error.message);
        } finally {
          setIsSubmitting(false);
        }
      });
      const handleOAuthLogin = (provider) => __async(null, null, function* () {
        if (isSubmitting || loading) return;
        setFormError("");
        setIsSubmitting(true);
        try {
          yield loginWithOAuth(provider);
        } catch (error) {
          setFormError(error.message);
          setIsSubmitting(false);
        }
      });
      const currentError = formError || authError;
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        fontFamily: "system-ui, sans-serif"
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        background: "white",
        borderRadius: "12px",
        padding: "32px",
        width: "100%",
        maxWidth: "400px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center", marginBottom: "32px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: {
            margin: "0 0 8px",
            fontSize: "28px",
            fontWeight: "700",
            color: "#1a1a1a"
          }, children: "Recursion Chat" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { style: {
            margin: "0 0 16px",
            color: "#666",
            fontSize: "16px"
          }, children: formMode === "signin" ? "Sign in to continue" : "Create your account" }),
          isMobileSafari && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
            background: "#e3f2fd",
            color: "#1565c0",
            padding: "8px 12px",
            borderRadius: "6px",
            fontSize: "14px",
            border: "1px solid #bbdefb"
          }, children: "📱 Mobile Safari optimized" })
        ] }),
        currentError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          background: "#ffebee",
          color: "#c62828",
          padding: "12px",
          borderRadius: "6px",
          marginBottom: "20px",
          fontSize: "14px",
          border: "1px solid #ffcdd2"
        }, children: currentError }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, style: { marginBottom: "24px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: {
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333"
            }, children: "Email" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "email",
                value: email,
                onChange: (e) => setEmail(e.target.value),
                placeholder: "Enter your email",
                required: true,
                style: {
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "6px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s"
                },
                onFocus: (e) => e.target.style.borderColor = "#667eea",
                onBlur: (e) => e.target.style.borderColor = "#e0e0e0"
              }
            )
          ] }),
          formMode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "16px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: {
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333"
            }, children: "Username (optional)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "text",
                value: username,
                onChange: (e) => setUsername(e.target.value),
                placeholder: "Choose a username",
                style: {
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "6px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s"
                },
                onFocus: (e) => e.target.style.borderColor = "#667eea",
                onBlur: (e) => e.target.style.borderColor = "#e0e0e0"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "20px" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { style: {
              display: "block",
              marginBottom: "6px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#333"
            }, children: "Password" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "input",
              {
                type: "password",
                value: password,
                onChange: (e) => setPassword(e.target.value),
                placeholder: "Enter your password",
                required: true,
                style: {
                  width: "100%",
                  padding: "12px",
                  border: "2px solid #e0e0e0",
                  borderRadius: "6px",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s"
                },
                onFocus: (e) => e.target.style.borderColor = "#667eea",
                onBlur: (e) => e.target.style.borderColor = "#e0e0e0"
              }
            )
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "submit",
              disabled: isSubmitting || loading,
              style: {
                width: "100%",
                padding: "14px",
                background: isSubmitting || loading ? "#ccc" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: isSubmitting || loading ? "not-allowed" : "pointer",
                transition: "background-color 0.2s"
              },
              onMouseOver: (e) => {
                if (!isSubmitting && !loading) {
                  e.target.style.backgroundColor = "#5a6fd8";
                }
              },
              onMouseOut: (e) => {
                if (!isSubmitting && !loading) {
                  e.target.style.backgroundColor = "#667eea";
                }
              },
              children: isSubmitting || loading ? "Please wait..." : formMode === "signin" ? "Sign In" : "Create Account"
            }
          )
        ] }),
        !isMobileSafari && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { marginBottom: "24px" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
            textAlign: "center",
            margin: "20px 0",
            position: "relative"
          }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
              background: "white",
              padding: "0 16px",
              color: "#666",
              fontSize: "14px"
            }, children: "or" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
              position: "absolute",
              top: "50%",
              left: "0",
              right: "0",
              height: "1px",
              background: "#e0e0e0",
              zIndex: "-1"
            } })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              onClick: () => handleOAuthLogin("google"),
              disabled: isSubmitting || loading,
              style: {
                width: "100%",
                padding: "12px",
                background: "white",
                color: "#333",
                border: "2px solid #e0e0e0",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: isSubmitting || loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "12px",
                transition: "all 0.2s"
              },
              onMouseOver: (e) => {
                if (!isSubmitting && !loading) {
                  e.target.style.borderColor = "#667eea";
                  e.target.style.boxShadow = "0 2px 8px rgba(102,126,234,0.2)";
                }
              },
              onMouseOut: (e) => {
                if (!isSubmitting && !loading) {
                  e.target.style.borderColor = "#e0e0e0";
                  e.target.style.boxShadow = "none";
                }
              },
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🔍" }),
                "Continue with Google"
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { textAlign: "center" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setFormMode(formMode === "signin" ? "signup" : "signin");
              setFormError("");
            },
            style: {
              background: "none",
              border: "none",
              color: "#667eea",
              fontSize: "14px",
              cursor: "pointer",
              textDecoration: "underline"
            },
            children: formMode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"
          }
        ) }),
        isMobileSafari && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          marginTop: "20px",
          padding: "12px",
          background: "#f5f5f5",
          borderRadius: "6px",
          fontSize: "12px",
          color: "#666",
          textAlign: "center"
        }, children: "Mobile Safari detected. OAuth disabled for optimal performance. Email/password authentication recommended." })
      ] }) });
    }
    {
      log$1.setDefaultLevel("warn");
    }
    const loggers = {};
    function getLogger(namespace) {
      if (!loggers[namespace]) {
        loggers[namespace] = log$1.getLogger(namespace);
        {
          loggers[namespace].setLevel("warn");
        }
      }
      return loggers[namespace];
    }
    getLogger("global");
    getLogger("auth");
    getLogger("socket");
    getLogger("api");
    getLogger("appwrite");
    getLogger("ui");
    const DATABASE_ID = "recursion_chat_db";
    const COLLECTIONS = {
      MESSAGES: "messages",
      ROOMS: "rooms",
      ROOM_MEMBERS: "room_members",
      TYPING_INDICATORS: "typing_indicators",
      USER_PRESENCE: "user_presence"
    };
    class AppwriteRoomService {
      constructor() {
        this.currentUser = null;
        this.subscriptions = /* @__PURE__ */ new Map();
        this.logger = getLogger("appwrite:rooms");
        this.initializeAuth();
      }
      // Initialize the service
      initialize() {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== SERVICE INITIALIZATION ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Initializing AppWrite Room Service...");
          const initStartTime = performance.now();
          yield this.initializeAuth();
          const initEndTime = performance.now();
          console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Service initialization completed");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Initialization took:", (initEndTime - initStartTime).toFixed(2), "ms");
        });
      }
      // Safe room document checker to prevent 404 errors
      roomExists(roomId) {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] Checking if room exists:", roomId);
          try {
            yield forcedDatabases.getDocument(DATABASE_ID, COLLECTIONS.ROOMS, roomId);
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Room exists:", roomId);
            return true;
          } catch (error) {
            if (error.code === 404) {
              console.log("🔧 [ROOM-SERVICE-DEBUG] ❌ Room does not exist:", roomId);
              return false;
            }
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error checking room existence:", error);
            return true;
          }
        });
      }
      // Initialize authentication
      initializeAuth() {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== AUTH INITIALIZATION ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Checking authentication status...");
          try {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Calling account.get()...");
            const authStartTime = performance.now();
            this.currentUser = yield forcedAccount.get();
            const authEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ User authenticated successfully!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Auth check took:", (authEndTime - authStartTime).toFixed(2), "ms");
            console.log("🔧 [ROOM-SERVICE-DEBUG] User details:", {
              userId: this.currentUser.$id,
              userName: this.currentUser.name,
              userEmail: this.currentUser.email,
              emailVerified: this.currentUser.emailVerification,
              fullUser: this.currentUser
            });
          } catch (error) {
            console.warn("🔧 [ROOM-SERVICE-DEBUG] ⚠️ User not authenticated");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Auth error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              fullError: error
            });
            this.currentUser = null;
          }
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== AUTH INITIALIZATION COMPLETED ==========");
        });
      }
      // Get current user
      getCurrentUser() {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] Getting current user...");
          if (!this.currentUser) {
            try {
              console.log("🔧 [ROOM-SERVICE-DEBUG] Fetching user from account.get()...");
              this.currentUser = yield forcedAccount.get();
              console.log("🔧 [ROOM-SERVICE-DEBUG] User fetched successfully:", {
                userId: this.currentUser.$id,
                userName: this.currentUser.name,
                userEmail: this.currentUser.email
              });
            } catch (error) {
              console.error("🔧 [ROOM-SERVICE-DEBUG] Failed to get current user:", error);
              throw new Error("User not authenticated: ".concat(error.message));
            }
          } else {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Using cached user:", {
              userId: this.currentUser.$id,
              userName: this.currentUser.name
            });
          }
          return this.currentUser;
        });
      }
      // Create a new room
      createRoom(roomData) {
        return __async(this, null, function* () {
          this.logger.info("Creating new room:", roomData.name);
          this.logger.debug("Room creation request:", roomData);
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== CREATE ROOM ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Room creation request:", {
            roomData,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          try {
            this.logger.debug("Getting current user for room creation...");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Getting current user for room creation...");
            const user = yield this.getCurrentUser();
            this.logger.debug("Current user for creation:", { id: user.$id, email: user.email });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Current user for creation:", {
              userId: user.$id,
              userEmail: user.email,
              userName: user.name
            });
            let dbRoomType = "group";
            if (roomData.type === "public") {
              dbRoomType = "channel";
            } else if (roomData.type === "private") {
              dbRoomType = "group";
            } else if (roomData.type) {
              const allowedTypes = ["direct", "group", "channel", "broadcast"];
              dbRoomType = allowedTypes.includes(roomData.type) ? roomData.type : "group";
            } else {
              dbRoomType = roomData.isPrivate ? "group" : "channel";
            }
            const isPrivateRoom = roomData.type === "private" || dbRoomType === "group" || roomData.isPrivate === true;
            const roomDocument = {
              name: roomData.name,
              description: roomData.description || "",
              type: dbRoomType,
              // Fixed: Use database-allowed values (direct, group, channel, broadcast)
              owner_id: user.$id,
              creator_id: user.$id,
              // Database only expects creator_id field
              is_private: isPrivateRoom,
              tags: roomData.topics || [],
              member_count: 1,
              max_members: 100,
              created_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            this.logger.debug("Room document to create:", roomDocument);
            this.logger.info("Creating room in Appwrite database...");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Room document to create:", roomDocument);
            console.log("🔧 [ROOM-SERVICE-DEBUG] Creating room in database...");
            console.log("🔧 [ROOM-SERVICE-DEBUG] DATABASE SCHEMA REQUIREMENTS:");
            console.log("🔧 [ROOM-SERVICE-DEBUG] - creator_id: REQUIRED (user who created room)");
            console.log("🔧 [ROOM-SERVICE-DEBUG] - owner_id: REQUIRED (current room owner)");
            console.log("🔧 [ROOM-SERVICE-DEBUG] - type: MUST be one of (direct, group, channel, broadcast)");
            console.log("🔧 [ROOM-SERVICE-DEBUG] - type mapping: private -> group, public -> channel");
            console.log("🔧 [ROOM-SERVICE-DEBUG] - created_by: NOT ALLOWED (database rejects this field)");
            console.log("🔧 [ROOM-SERVICE-DEBUG] ========== TYPE MAPPING ==========");
            console.log("🔧 [ROOM-SERVICE-DEBUG] - Input type from UI:", roomData.type);
            console.log("🔧 [ROOM-SERVICE-DEBUG] - Mapped database type:", dbRoomType);
            console.log("🔧 [ROOM-SERVICE-DEBUG] - Is private room:", isPrivateRoom);
            const createStartTime = performance.now();
            const room = yield forcedDatabases.createDocument(
              DATABASE_ID,
              COLLECTIONS.ROOMS,
              ID.unique(),
              roomDocument
            );
            const createEndTime = performance.now();
            const duration = createEndTime - createStartTime;
            this.logger.info("Room created successfully in ".concat(duration.toFixed(2), "ms - ID: ").concat(room.$id));
            this.logger.debug("Created room details:", { id: room.$id, name: room.name, owner: room.owner_id });
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Room created in database!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Creation took:", duration.toFixed(2), "ms");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Created room details:", {
              roomId: room.$id,
              roomName: room.name,
              ownerId: room.owner_id,
              fullRoom: room
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Auto-joining creator to room...");
            const joinResult = yield this.joinRoom(room.$id);
            console.log("🔧 [ROOM-SERVICE-DEBUG] Auto-join result:", joinResult);
            if (!joinResult.success) {
              console.warn("🔧 [ROOM-SERVICE-DEBUG] ⚠️ Failed to auto-join creator to room:", joinResult.error);
            } else {
              console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Creator successfully auto-joined to room");
            }
            const finalRoom = {
              success: true,
              room: {
                $id: room.$id,
                // CRITICAL FIX: Use $id to match Appwrite format
                id: room.$id,
                // Provide both for compatibility
                name: room.name,
                description: room.description,
                owner_id: room.owner_id,
                creator_id: room.creator_id,
                type: room.type,
                is_private: room.is_private
              }
            };
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Room creation completed successfully!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Final room result:", finalRoom);
            console.log("🔧 [ROOM-SERVICE-DEBUG] ========== CREATE ROOM COMPLETED SUCCESSFULLY ==========");
            return finalRoom;
          } catch (error) {
            this.logger.error("Failed to create room:", error.message);
            this.logger.debug("Room creation error details:", { code: error.code, type: error.type });
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR creating room!");
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              errorStack: error.stack,
              fullError: error
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] ========== CREATE ROOM COMPLETED WITH ERROR ==========");
            return { success: false, error: error.message };
          }
        });
      }
      // Get all active rooms
      getRooms() {
        return __async(this, null, function* () {
          var _a2, _b2;
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== GET ROOMS ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Fetching rooms from database...");
          try {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Database query parameters:", {
              databaseId: DATABASE_ID,
              collection: COLLECTIONS.ROOMS,
              queries: ["orderDesc(created_at)", "limit(50)"]
            });
            const queryStartTime = performance.now();
            const response = yield forcedDatabases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ROOMS,
              [
                Query.orderDesc("created_at"),
                Query.limit(50)
              ]
            );
            const queryEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Database query completed!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Query took:", (queryEndTime - queryStartTime).toFixed(2), "ms");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Raw database response:", {
              documentCount: response.documents.length,
              total: response.total,
              fullResponse: response
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Raw rooms from database:");
            response.documents.forEach((room, index) => {
              console.log("🔧 [ROOM-SERVICE-DEBUG]   Room ".concat(index + 1, ":"), {
                id: room.$id,
                name: room.name,
                description: room.description,
                ownerId: room.owner_id,
                memberCount: room.member_count,
                tags: room.tags,
                createdAt: room.created_at,
                fullRoom: room
              });
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Transforming rooms data...");
            const currentUserId = ((_a2 = this.currentUser) == null ? void 0 : _a2.$id) || ((_b2 = this.currentUser) == null ? void 0 : _b2.id);
            let membershipMap = {};
            if (currentUserId) {
              try {
                const membershipResponse = yield forcedDatabases.listDocuments(
                  DATABASE_ID,
                  COLLECTIONS.ROOM_MEMBERS,
                  [
                    Query.equal("user_id", currentUserId),
                    Query.limit(100)
                  ]
                );
                membershipMap = membershipResponse.documents.reduce((map, membership) => {
                  map[membership.room_id] = true;
                  return map;
                }, {});
                console.log("🔧 [ROOM-SERVICE-DEBUG] User membership checked:", {
                  userId: currentUserId,
                  memberOfRooms: Object.keys(membershipMap)
                });
              } catch (error) {
                console.warn("🔧 [ROOM-SERVICE-DEBUG] Could not check membership:", error);
              }
            }
            const rooms = response.documents.map((room, index) => {
              const transformedRoom = {
                $id: room.$id,
                // CRITICAL FIX: Use $id to match Appwrite format
                id: room.$id,
                // Provide both for compatibility
                name: room.name,
                description: room.description,
                owner_id: room.owner_id,
                creator_id: room.creator_id,
                creator_name: room.owner_id === "system" ? "System" : "Unknown",
                member_count: room.member_count || 0,
                topics: room.tags || [],
                type: room.type,
                is_private: room.is_private,
                is_member: membershipMap[room.$id] || false,
                // Check actual membership
                created_at: room.created_at
              };
              console.log("🔧 [ROOM-SERVICE-DEBUG]   Transformed Room ".concat(index + 1, ":"), transformedRoom);
              return transformedRoom;
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Room transformation completed!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Final rooms array:", {
              count: rooms.length,
              rooms
            });
            return { success: true, rooms };
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR fetching rooms!");
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              errorStack: error.stack,
              fullError: error
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Error occurred, returning failure");
            return { success: false, error: error.message, rooms: [] };
          }
        });
      }
      // Helper method for completing operations
      _logCompletion(operation) {
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== ".concat(operation, " COMPLETED =========="));
      }
      // Join a room
      joinRoom(roomId) {
        return __async(this, null, function* () {
          var _a2, _b2, _c2;
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== JOIN ROOM ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Room join request:", {
            roomId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          try {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Verifying room exists before join...");
            const roomExists = yield this.roomExists(roomId);
            if (!roomExists) {
              console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ Cannot join room - room does not exist:", roomId);
              return {
                success: false,
                error: "Room '".concat(roomId, "' does not exist. Please select a valid room.")
              };
            }
            console.log("🔧 [ROOM-SERVICE-DEBUG] Getting current user for room join...");
            const user = yield this.getCurrentUser();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Current user for join:", {
              userId: user.$id,
              userEmail: user.email,
              userName: user.name
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Checking existing membership...");
            const membershipQuery = [
              Query.equal("room_id", [roomId]),
              Query.equal("user_id", [user.$id])
            ];
            console.log("🔧 [ROOM-SERVICE-DEBUG] Membership query:", membershipQuery);
            const memberCheckStartTime = performance.now();
            const existingMember = yield forcedDatabases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ROOM_MEMBERS,
              membershipQuery
            );
            const memberCheckEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Membership check completed:", {
              queryTime: (memberCheckEndTime - memberCheckStartTime).toFixed(2) + "ms",
              existingMemberCount: existingMember.documents.length,
              existingMembers: existingMember.documents
            });
            if (existingMember.documents.length > 0) {
              console.log("🔧 [ROOM-SERVICE-DEBUG] ⚠️ User already in room - returning existing membership");
              console.log("🔧 [ROOM-SERVICE-DEBUG] Existing membership details:", existingMember.documents[0]);
              return { success: true, membership: existingMember.documents[0] };
            }
            console.log("🔧 [ROOM-SERVICE-DEBUG] Creating new membership record...");
            const membershipData = {
              room_id: roomId,
              user_id: user.$id,
              username: user.name,
              role: "member",
              joined_at: (/* @__PURE__ */ new Date()).toISOString()
            };
            console.log("🔧 [ROOM-SERVICE-DEBUG] Membership document to create:", membershipData);
            const createMemberStartTime = performance.now();
            const membership = yield forcedDatabases.createDocument(
              DATABASE_ID,
              COLLECTIONS.ROOM_MEMBERS,
              ID.unique(),
              membershipData
            );
            const createMemberEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Joined room successfully!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Membership creation took:", (createMemberEndTime - createMemberStartTime).toFixed(2), "ms");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Created membership:", {
              membershipId: membership.$id,
              roomId: membership.room_id,
              userId: membership.user_id,
              username: membership.username,
              role: membership.role,
              joinedAt: membership.joined_at,
              fullMembership: membership
            });
            return { success: true, membership };
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR joining room!");
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              errorStack: error.stack,
              fullError: error
            });
            if (error.code === 404 || ((_a2 = error.message) == null ? void 0 : _a2.includes("404")) || ((_b2 = error.message) == null ? void 0 : _b2.includes("not found")) || ((_c2 = error.message) == null ? void 0 : _c2.includes("Document not found"))) {
              console.warn("🔧 [ROOM-SERVICE-DEBUG] ⚠️ Room not found (404) - likely accessing invalid cached room ID");
              return { success: false, error: "Room not found: ".concat(roomId), code: 404 };
            }
            console.log("🔧 [ROOM-SERVICE-DEBUG] Error occurred in join room");
            return { success: false, error: error.message };
          }
        });
      }
      // Leave a room
      leaveRoom(roomId) {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== LEAVE ROOM ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Room leave request:", {
            roomId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          try {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Getting current user for room leave...");
            const user = yield this.getCurrentUser();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Current user for leave:", {
              userId: user.$id,
              userEmail: user.email,
              userName: user.name
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Finding user membership...");
            const membershipQuery = [
              Query.equal("room_id", [roomId]),
              Query.equal("user_id", [user.$id])
            ];
            console.log("🔧 [ROOM-SERVICE-DEBUG] Membership query:", membershipQuery);
            const memberFindStartTime = performance.now();
            const membership = yield forcedDatabases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ROOM_MEMBERS,
              membershipQuery
            );
            const memberFindEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Membership search completed:", {
              queryTime: (memberFindEndTime - memberFindStartTime).toFixed(2) + "ms",
              membershipCount: membership.documents.length,
              memberships: membership.documents
            });
            if (membership.documents.length > 0) {
              console.log("🔧 [ROOM-SERVICE-DEBUG] Membership found, updating to banned status...");
              const updateStartTime = performance.now();
              yield forcedDatabases.updateDocument(
                DATABASE_ID,
                COLLECTIONS.ROOM_MEMBERS,
                membership.documents[0].$id,
                { is_banned: true }
              );
              const updateEndTime = performance.now();
              console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Left room successfully!");
              console.log("🔧 [ROOM-SERVICE-DEBUG] Update took:", (updateEndTime - updateStartTime).toFixed(2), "ms");
            } else {
              console.log("🔧 [ROOM-SERVICE-DEBUG] ⚠️ No membership found - user not in room");
            }
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR leaving room!");
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              errorStack: error.stack,
              fullError: error
            });
            throw error;
          }
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== LEAVE ROOM COMPLETED ==========");
        });
      }
      // Get room members
      getRoomMembers(roomId) {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== GET ROOM MEMBERS ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Fetching members for room:", {
            roomId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          try {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Database query parameters:", {
              databaseId: DATABASE_ID,
              collection: COLLECTIONS.ROOM_MEMBERS,
              queries: ["equal('room_id', '".concat(roomId, "')"), "orderAsc(joined_at)"]
            });
            const queryStartTime = performance.now();
            const response = yield forcedDatabases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ROOM_MEMBERS,
              [
                Query.equal("room_id", [roomId]),
                Query.orderAsc("joined_at")
              ]
            );
            const queryEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Room members fetched successfully!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Query took:", (queryEndTime - queryStartTime).toFixed(2), "ms");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Members found:", {
              memberCount: response.documents.length,
              members: response.documents.map((m) => ({
                id: m.$id,
                userId: m.user_id,
                username: m.username,
                role: m.role,
                joinedAt: m.joined_at
              }))
            });
            return response.documents;
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR fetching room members!");
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              errorStack: error.stack,
              fullError: error
            });
            throw error;
          }
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== GET ROOM MEMBERS COMPLETED ==========");
        });
      }
      // Get room messages
      getRoomMessages(roomId, limit = 50) {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== GET ROOM MESSAGES ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Fetching messages for room:", {
            roomId,
            limit,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          try {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Database query parameters:", {
              databaseId: DATABASE_ID,
              collection: COLLECTIONS.MESSAGES,
              queries: ["equal('room_id', '".concat(roomId, "')"), "orderDesc(created_at)", "limit(".concat(limit, ")")]
            });
            const queryStartTime = performance.now();
            const response = yield forcedDatabases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.MESSAGES,
              [
                Query.equal("room_id", [roomId]),
                Query.orderDesc("created_at"),
                Query.limit(limit)
              ]
            );
            const queryEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Messages fetched successfully!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Query took:", (queryEndTime - queryStartTime).toFixed(2), "ms");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Messages found:", {
              messageCount: response.documents.length,
              totalInDatabase: response.total,
              fullResponse: response
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Raw messages from database:");
            response.documents.forEach((message, index) => {
              console.log("🔧 [ROOM-SERVICE-DEBUG]   Message ".concat(index + 1, ":"), {
                id: message.$id,
                userId: message.user_id,
                username: message.username,
                content: message.content.substring(0, 50) + (message.content.length > 50 ? "..." : ""),
                type: message.type,
                createdAt: message.created_at,
                fullMessage: message
              });
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Reversing message order (oldest first)...");
            const reversedMessages = response.documents.reverse();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Final message order:");
            reversedMessages.forEach((message, index) => {
              console.log("🔧 [ROOM-SERVICE-DEBUG]   Final Message ".concat(index + 1, ":"), {
                id: message.$id,
                createdAt: message.created_at,
                content: message.content.substring(0, 30) + "..."
              });
            });
            return reversedMessages;
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR fetching messages!");
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              errorStack: error.stack,
              fullError: error
            });
            throw error;
          }
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== GET ROOM MESSAGES COMPLETED ==========");
        });
      }
      // Send a message (with optional custom user info for AI messages)
      sendMessage(roomId, content, type = "text", customUserInfo = null) {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== SEND MESSAGE ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Message send request:", {
            roomId,
            contentLength: (content == null ? void 0 : content.length) || 0,
            contentPreview: (content == null ? void 0 : content.substring(0, 50)) + ((content == null ? void 0 : content.length) > 50 ? "..." : ""),
            type,
            timestamp: (/* @__PURE__ */ new Date()).toISOString()
          });
          try {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Getting current user for message send...");
            const user = yield this.getCurrentUser();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Current user for send:", {
              userId: user.$id,
              userEmail: user.email,
              userName: user.name
            });
            if (!customUserInfo) {
              console.log("🔧 [ROOM-SERVICE-DEBUG] Verifying user membership in room...");
              const membershipQuery = [
                Query.equal("room_id", [roomId]),
                Query.equal("user_id", [user.$id])
              ];
              console.log("🔧 [ROOM-SERVICE-DEBUG] Membership check query:", membershipQuery);
              const memberCheckStartTime = performance.now();
              const membership = yield forcedDatabases.listDocuments(
                DATABASE_ID,
                COLLECTIONS.ROOM_MEMBERS,
                membershipQuery
              );
              const memberCheckEndTime = performance.now();
              console.log("🔧 [ROOM-SERVICE-DEBUG] Membership check completed:", {
                queryTime: (memberCheckEndTime - memberCheckStartTime).toFixed(2) + "ms",
                membershipCount: membership.documents.length,
                isMember: membership.documents.length > 0
              });
              if (membership.documents.length === 0) {
                console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ User not in room - cannot send message!");
                throw new Error("You must join the room to send messages");
              }
            } else {
              console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Skipping membership check for AI message");
            }
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ User is member - proceeding with message creation...");
            const messageData = {
              room_id: roomId,
              user_id: customUserInfo ? "ai-remi" : user.$id,
              username: customUserInfo ? customUserInfo.user_name : user.name,
              content,
              type,
              created_at: (/* @__PURE__ */ new Date()).toISOString(),
              edited: false
            };
            console.log("🔧 [ROOM-SERVICE-DEBUG] Message document to create:", {
              roomId: messageData.room_id,
              userId: messageData.user_id,
              username: messageData.username,
              contentLength: messageData.content.length,
              type: messageData.type,
              createdAt: messageData.created_at,
              edited: messageData.edited
            });
            const createStartTime = performance.now();
            const message = yield forcedDatabases.createDocument(
              DATABASE_ID,
              COLLECTIONS.MESSAGES,
              ID.unique(),
              messageData
            );
            const createEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Message sent successfully!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Message creation took:", (createEndTime - createStartTime).toFixed(2), "ms");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Created message:", {
              messageId: message.$id,
              roomId: message.room_id,
              userId: message.user_id,
              username: message.username,
              contentLength: message.content.length,
              type: message.type,
              createdAt: message.created_at,
              fullMessage: message
            });
            return message;
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR sending message!");
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              errorStack: error.stack,
              fullError: error
            });
            throw error;
          }
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== SEND MESSAGE COMPLETED ==========");
        });
      }
      // Subscribe to room updates
      subscribeToRoom(roomId, onUpdate) {
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== SUBSCRIBE TO ROOM ==========");
        console.log("🔧 [ROOM-SERVICE-DEBUG] Room subscription request:", {
          roomId,
          hasCallback: !!onUpdate,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        try {
          const channels = [
            "databases.".concat(DATABASE_ID, ".collections.messages.documents"),
            "databases.".concat(DATABASE_ID, ".collections.room_members.documents")
          ];
          console.log("🔧 [ROOM-SERVICE-DEBUG] Subscription channels:", channels);
          const subscribeStartTime = performance.now();
          const subscription = forcedClient.subscribe(channels, (response) => {
            console.log("🔧 [ROOM-SERVICE-DEBUG] ========== SUBSCRIPTION EVENT RECEIVED ==========");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Event details:", {
              eventType: response.events,
              payload: response.payload,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            const payload = response.payload;
            if (payload.room_id === roomId) {
              console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Event matches room ID - calling callback");
              console.log("🔧 [ROOM-SERVICE-DEBUG] Filtered event payload:", payload);
              onUpdate(response);
            } else {
              console.log("🔧 [ROOM-SERVICE-DEBUG] ⚠️ Event for different room - ignoring:", {
                eventRoomId: payload.room_id,
                subscribedRoomId: roomId
              });
            }
          });
          const subscribeEndTime = performance.now();
          this.subscriptions.set(roomId, subscription);
          console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Subscribed to room updates successfully!");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Subscription setup took:", (subscribeEndTime - subscribeStartTime).toFixed(2), "ms");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Active subscriptions:", {
            roomId,
            totalSubscriptions: this.subscriptions.size,
            allSubscribedRooms: Array.from(this.subscriptions.keys())
          });
          return subscription;
        } catch (error) {
          console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR subscribing to room!");
          console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
            errorMessage: error.message,
            errorCode: error.code,
            errorType: error.type,
            errorStack: error.stack,
            fullError: error
          });
          throw error;
        }
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== SUBSCRIBE TO ROOM COMPLETED ==========");
      }
      // Unsubscribe from room updates
      unsubscribeFromRoom(roomId) {
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== UNSUBSCRIBE FROM ROOM ==========");
        console.log("🔧 [ROOM-SERVICE-DEBUG] Room unsubscribe request:", {
          roomId,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        const subscription = this.subscriptions.get(roomId);
        if (subscription) {
          console.log("🔧 [ROOM-SERVICE-DEBUG] Found subscription for room - unsubscribing...");
          const unsubscribeStartTime = performance.now();
          subscription();
          const unsubscribeEndTime = performance.now();
          this.subscriptions.delete(roomId);
          console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Unsubscribed from room successfully!");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Unsubscribe took:", (unsubscribeEndTime - unsubscribeStartTime).toFixed(2), "ms");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Remaining subscriptions:", {
            count: this.subscriptions.size,
            roomIds: Array.from(this.subscriptions.keys())
          });
        } else {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ⚠️ No subscription found for room:", roomId);
          console.log("🔧 [ROOM-SERVICE-DEBUG] Available subscriptions:", {
            count: this.subscriptions.size,
            roomIds: Array.from(this.subscriptions.keys())
          });
        }
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== UNSUBSCRIBE FROM ROOM COMPLETED ==========");
      }
      // Get user's rooms
      getUserRooms() {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== GET USER ROOMS ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Fetching rooms for current user...");
          try {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Getting current user...");
            const user = yield this.getCurrentUser();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Current user:", {
              userId: user.$id,
              userEmail: user.email,
              userName: user.name
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Fetching user memberships...");
            const membershipQuery = [
              Query.equal("user_id", [user.$id]),
              Query.orderDesc("joined_at")
            ];
            console.log("🔧 [ROOM-SERVICE-DEBUG] Membership query:", membershipQuery);
            const membershipStartTime = performance.now();
            const memberships = yield forcedDatabases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ROOM_MEMBERS,
              membershipQuery
            );
            const membershipEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Memberships fetched:", {
              queryTime: (membershipEndTime - membershipStartTime).toFixed(2) + "ms",
              membershipCount: memberships.documents.length,
              memberships: memberships.documents.map((m) => ({
                id: m.$id,
                roomId: m.room_id,
                role: m.role,
                joinedAt: m.joined_at
              }))
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Fetching room details for each membership...");
            const roomFetchStartTime = performance.now();
            const roomPromises = memberships.documents.map((membership, index) => __async(this, null, function* () {
              console.log("🔧 [ROOM-SERVICE-DEBUG] Fetching room ".concat(index + 1, "/").concat(memberships.documents.length, ":"), membership.room_id);
              const roomStartTime = performance.now();
              try {
                const room = yield forcedDatabases.getDocument(
                  DATABASE_ID,
                  COLLECTIONS.ROOMS,
                  membership.room_id
                );
                const roomEndTime = performance.now();
                console.log("🔧 [ROOM-SERVICE-DEBUG] Room ".concat(index + 1, " fetched:"), {
                  queryTime: (roomEndTime - roomStartTime).toFixed(2) + "ms",
                  roomId: room.$id,
                  roomName: room.name,
                  ownerId: room.owner_id
                });
                return __spreadProps(__spreadValues({}, room), {
                  membershipId: membership.$id,
                  joinedAt: membership.joined_at,
                  role: membership.role
                });
              } catch (roomError) {
                console.warn("🔧 [ROOM-SERVICE-DEBUG] ⚠️ Room ".concat(membership.room_id, " not found, skipping:"), roomError.message);
                try {
                  console.log("🔧 [ROOM-SERVICE-DEBUG] Cleaning up invalid membership for room ".concat(membership.room_id, "..."));
                  yield forcedDatabases.deleteDocument(DATABASE_ID, COLLECTIONS.ROOM_MEMBERS, membership.$id);
                  console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Invalid membership cleaned up");
                } catch (cleanupError) {
                  console.warn("🔧 [ROOM-SERVICE-DEBUG] Failed to cleanup invalid membership:", cleanupError);
                }
                return null;
              }
            }));
            const rooms = yield Promise.all(roomPromises);
            const roomFetchEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ All user rooms fetched successfully!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Total room fetch took:", (roomFetchEndTime - roomFetchStartTime).toFixed(2), "ms");
            console.log("🔧 [ROOM-SERVICE-DEBUG] User rooms summary:", {
              totalRooms: rooms.length,
              rooms: rooms.map((r) => ({
                id: r.$id,
                name: r.name,
                role: r.role,
                joinedAt: r.joinedAt,
                isOwner: r.owner_id === user.$id
              }))
            });
            return rooms;
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR fetching user rooms!");
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              errorStack: error.stack,
              fullError: error
            });
            throw error;
          }
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== GET USER ROOMS COMPLETED ==========");
        });
      }
      // Update user presence
      updatePresence(status = "online") {
        return __async(this, null, function* () {
          try {
            const user = yield this.getCurrentUser();
            const existingPresence = yield forcedDatabases.listDocuments(
              DATABASE_ID,
              "user_presence",
              [Query.equal("user_id", [user.$id])]
            );
            const presenceData = {
              user_id: user.$id,
              username: user.name,
              status,
              last_seen: (/* @__PURE__ */ new Date()).toISOString()
            };
            if (existingPresence.documents.length > 0) {
              yield forcedDatabases.updateDocument(
                DATABASE_ID,
                "user_presence",
                existingPresence.documents[0].$id,
                presenceData
              );
            } else {
              yield forcedDatabases.createDocument(
                DATABASE_ID,
                "user_presence",
                ID.unique(),
                presenceData
              );
            }
          } catch (error) {
            console.error("❌ Error updating presence:", error);
          }
        });
      }
      // Delete a room
      deleteRoom(roomId) {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== DELETE ROOM ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] 🚀 DELETE PERMISSION FIX ACTIVE - v2.0");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Room delete request:", {
            roomId,
            timestamp: (/* @__PURE__ */ new Date()).toISOString(),
            fixVersion: "v2.0-no-permission-check"
          });
          try {
            console.log("🔧 [ROOM-SERVICE-DEBUG] Getting current user for room deletion...");
            const user = yield this.getCurrentUser();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Current user for delete:", {
              userId: user.$id,
              userEmail: user.email,
              userName: user.name
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Fetching room (permission check DISABLED)...");
            const roomFetchStartTime = performance.now();
            const room = yield forcedDatabases.getDocument(
              DATABASE_ID,
              COLLECTIONS.ROOMS,
              roomId
            );
            const roomFetchEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] Room fetched (NO permission check applied):", {
              queryTime: (roomFetchEndTime - roomFetchStartTime).toFixed(2) + "ms",
              roomName: room.name,
              ownerId: room.owner_id,
              currentUserId: user.$id,
              isOwner: room.owner_id === user.$id,
              fullRoom: room
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ PERMISSION CHECK BYPASSED - v2.0");
            console.log("🔧 [ROOM-SERVICE-DEBUG] ⚠️ ANY USER CAN DELETE ANY ROOM (TEMPORARY)");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Room ownership info (ignored):", {
              roomOwner: room.owner_id,
              currentUser: user.$id,
              roomName: room.name,
              wouldNormallyAllow: room.owner_id === user.$id,
              permissionCheckActive: false
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Deleting room from database...");
            const deleteStartTime = performance.now();
            yield forcedDatabases.deleteDocument(
              DATABASE_ID,
              COLLECTIONS.ROOMS,
              roomId
            );
            const deleteEndTime = performance.now();
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Room deleted successfully!");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Deletion took:", (deleteEndTime - deleteStartTime).toFixed(2), "ms");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Deleted room details:", {
              roomId,
              roomName: room.name,
              ownerId: room.owner_id
            });
            return { success: true };
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR deleting room!");
            console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
              errorMessage: error.message,
              errorCode: error.code,
              errorType: error.type,
              errorStack: error.stack,
              fullError: error
            });
            return { success: false, error: error.message };
          }
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== DELETE ROOM COMPLETED ==========");
        });
      }
      // Subscribe to room updates (global subscription)
      subscribeToRoomUpdates(callback) {
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== SUBSCRIBE TO ROOM UPDATES (GLOBAL) ==========");
        console.log("🔧 [ROOM-SERVICE-DEBUG] Global room updates subscription request:", {
          hasCallback: !!callback,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        try {
          const channels = ["databases.".concat(DATABASE_ID, ".collections.rooms.documents")];
          console.log("🔧 [ROOM-SERVICE-DEBUG] Global subscription channels:", channels);
          const subscribeStartTime = performance.now();
          const subscription = forcedClient.subscribe(channels, (response) => {
            console.log("🔧 [ROOM-SERVICE-DEBUG] ========== GLOBAL ROOM EVENT RECEIVED ==========");
            console.log("🔧 [ROOM-SERVICE-DEBUG] Global event details:", {
              eventType: response.events,
              payload: response.payload,
              timestamp: (/* @__PURE__ */ new Date()).toISOString()
            });
            console.log("🔧 [ROOM-SERVICE-DEBUG] Calling global callback with event...");
            callback(response);
          });
          const subscribeEndTime = performance.now();
          console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Subscribed to global room updates successfully!");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Global subscription setup took:", (subscribeEndTime - subscribeStartTime).toFixed(2), "ms");
          return subscription;
        } catch (error) {
          console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR subscribing to global room updates!");
          console.error("🔧 [ROOM-SERVICE-DEBUG] Error details:", {
            errorMessage: error.message,
            errorCode: error.code,
            errorType: error.type,
            errorStack: error.stack,
            fullError: error
          });
          return null;
        }
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== SUBSCRIBE TO ROOM UPDATES (GLOBAL) COMPLETED ==========");
      }
      // Unsubscribe from all subscriptions
      unsubscribeAll() {
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== UNSUBSCRIBE ALL ==========");
        console.log("🔧 [ROOM-SERVICE-DEBUG] Unsubscribing from all room subscriptions:", {
          totalSubscriptions: this.subscriptions.size,
          roomIds: Array.from(this.subscriptions.keys()),
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        const unsubscribeStartTime = performance.now();
        let unsubscribedCount = 0;
        this.subscriptions.forEach((unsubscribe, roomId) => {
          console.log("🔧 [ROOM-SERVICE-DEBUG] Unsubscribing from room ".concat(unsubscribedCount + 1, ":"), roomId);
          try {
            unsubscribe();
            unsubscribedCount++;
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Successfully unsubscribed from:", roomId);
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ Error unsubscribing from:", roomId, error);
          }
        });
        this.subscriptions.clear();
        const unsubscribeEndTime = performance.now();
        console.log("🔧 [ROOM-SERVICE-DEBUG] 🧹 Unsubscribed from all rooms!");
        console.log("🔧 [ROOM-SERVICE-DEBUG] Unsubscribe all took:", (unsubscribeEndTime - unsubscribeStartTime).toFixed(2), "ms");
        console.log("🔧 [ROOM-SERVICE-DEBUG] Final stats:", {
          totalUnsubscribed: unsubscribedCount,
          remainingSubscriptions: this.subscriptions.size,
          success: this.subscriptions.size === 0
        });
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== UNSUBSCRIBE ALL COMPLETED ==========");
      }
      // Update room details
      updateRoom(roomId, updates) {
        return __async(this, null, function* () {
          console.log("🔧 [ROOM-SERVICE-DEBUG] ========== UPDATE ROOM ==========");
          console.log("🔧 [ROOM-SERVICE-DEBUG] Updating room:", roomId, updates);
          try {
            const user = yield this.getCurrentUser();
            const memberships = yield forcedDatabases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.ROOM_MEMBERS,
              [
                Query.equal("room_id", [roomId]),
                Query.equal("user_id", [user.$id])
              ]
            );
            if (memberships.documents.length === 0) {
              throw new Error("Only room members can update the room");
            }
            const updatedRoom = yield forcedDatabases.updateDocument(
              DATABASE_ID,
              COLLECTIONS.ROOMS,
              roomId,
              updates
            );
            console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Room updated successfully");
            return updatedRoom;
          } catch (error) {
            console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR updating room:", error);
            throw error;
          }
        });
      }
      // Send typing indicator
      sendTypingIndicator(roomId) {
        return __async(this, null, function* () {
          try {
            const user = yield this.getCurrentUser();
            if (!roomId) {
              console.warn("Cannot send typing indicator without roomId");
              return;
            }
            console.log("🔧 [TYPING-DEBUG] Sending typing indicator:", {
              roomId,
              userId: user.$id,
              collection: COLLECTIONS.TYPING_INDICATORS
            });
            yield forcedDatabases.createDocument(
              DATABASE_ID,
              COLLECTIONS.TYPING_INDICATORS,
              ID.unique(),
              {
                room_id: roomId,
                // Use underscore format as database expects
                user_id: user.$id,
                // Use underscore format as database expects
                username: user.name || user.email,
                // Fixed: use 'username' not 'user_name'
                is_typing: true
                // Required field for typing indicators - removed timestamp as schema doesn't support it
              }
            );
          } catch (error) {
            console.warn("Failed to send typing indicator:", error);
          }
        });
      }
      // Stop typing indicator
      stopTypingIndicator(roomId) {
        return __async(this, null, function* () {
          try {
            const user = yield this.getCurrentUser();
            console.log("🔧 [TYPING-DEBUG] Stopping typing indicator:", {
              roomId,
              userId: user.$id
            });
            const indicators = yield forcedDatabases.listDocuments(
              DATABASE_ID,
              COLLECTIONS.TYPING_INDICATORS,
              [
                Query.equal("room_id", [roomId]),
                Query.equal("user_id", [user.$id])
              ]
            );
            for (const indicator of indicators.documents) {
              yield forcedDatabases.deleteDocument(
                DATABASE_ID,
                COLLECTIONS.TYPING_INDICATORS,
                indicator.$id
              );
            }
          } catch (error) {
            console.warn("Failed to stop typing indicator:", error);
          }
        });
      }
      // Subscribe to presence updates
      subscribeToPresence(roomId, callback) {
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== SUBSCRIBE TO PRESENCE ==========");
        try {
          const typingChannel = "databases.".concat(DATABASE_ID, ".collections.").concat(COLLECTIONS.TYPING_INDICATORS, ".documents");
          const typingUnsubscribe = forcedClient.subscribe(typingChannel, (event) => {
            const eventRoomId = event.payload.roomId || event.payload.room_id;
            const eventUserId = event.payload.userId || event.payload.user_id;
            const eventUserName = event.payload.userName || event.payload.user_name;
            if (eventRoomId === roomId) {
              callback({
                type: "user-typing",
                userId: eventUserId,
                userName: eventUserName
              });
            }
          });
          const presenceChannel = "databases.".concat(DATABASE_ID, ".collections.").concat(COLLECTIONS.USER_PRESENCE, ".documents");
          const presenceUnsubscribe = forcedClient.subscribe(presenceChannel, (event) => {
            if (event.payload.room_id === roomId) {
              callback({
                type: event.payload.status === "online" ? "user-online" : "user-offline",
                userId: event.payload.user_id,
                userName: event.payload.user_name
              });
            }
          });
          return () => {
            if (typeof typingUnsubscribe === "function") {
              typingUnsubscribe();
            }
            if (typeof presenceUnsubscribe === "function") {
              presenceUnsubscribe();
            }
          };
        } catch (error) {
          console.error("🔧 [ROOM-SERVICE-DEBUG] ❌ ERROR subscribing to presence:", error);
          return () => {
          };
        }
      }
      // Cleanup - unsubscribe from all rooms
      cleanup() {
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== CLEANUP ==========");
        console.log("🔧 [ROOM-SERVICE-DEBUG] Starting room service cleanup...");
        const cleanupStartTime = performance.now();
        this.unsubscribeAll();
        const cleanupEndTime = performance.now();
        console.log("🔧 [ROOM-SERVICE-DEBUG] ✅ Room service cleanup completed!");
        console.log("🔧 [ROOM-SERVICE-DEBUG] Cleanup took:", (cleanupEndTime - cleanupStartTime).toFixed(2), "ms");
        console.log("🔧 [ROOM-SERVICE-DEBUG] ========== CLEANUP COMPLETED ==========");
      }
    }
    const roomService = new AppwriteRoomService();
    function RoomSelectionAppwrite({ user, onSelectRoom, onClose }) {
      console.log("🏠 [ROOMS-DEBUG] ========== ROOM SELECTION COMPONENT INITIALIZED ==========");
      console.log("🏠 [ROOMS-DEBUG] Component mounting at:", (/* @__PURE__ */ new Date()).toISOString());
      console.log("🏠 [ROOMS-DEBUG] Current URL:", window.location.href);
      console.log("🏠 [ROOMS-DEBUG] Component Props:", {
        hasUser: !!user,
        userEmail: (user == null ? void 0 : user.email) || "none",
        hasOnSelectRoom: !!onSelectRoom,
        hasOnClose: !!onClose,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      console.log("🏠 [ROOMS-DEBUG] roomService reference:", !!roomService);
      console.log("🏠 [ROOMS-DEBUG] appwriteAuth reference:", !!appwriteAuth$1);
      const [rooms, setRooms] = reactExports.useState([]);
      const [loading, setLoading] = reactExports.useState(true);
      const [error, setError] = reactExports.useState("");
      const [showCreateRoom, setShowCreateRoom] = reactExports.useState(false);
      const [newRoom, setNewRoom] = reactExports.useState({
        name: "",
        description: "",
        topics: "",
        isPrivate: false
      });
      const [deletingRoom, setDeletingRoom] = reactExports.useState(null);
      const [showDeleteConfirm, setShowDeleteConfirm] = reactExports.useState(null);
      const [currentUser2, setCurrentUser] = reactExports.useState(null);
      reactExports.useEffect(() => {
        console.log("🏠 [ROOMS-DEBUG] State Update - Rooms:", {
          roomCount: rooms.length,
          rooms: rooms.map((r) => ({ id: r.id, name: r.name, memberCount: r.member_count })),
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }, [rooms]);
      reactExports.useEffect(() => {
        console.log("🏠 [ROOMS-DEBUG] State Update - Loading:", {
          isLoading: loading,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }, [loading]);
      reactExports.useEffect(() => {
        console.log("🏠 [ROOMS-DEBUG] State Update - Error:", {
          hasError: !!error,
          errorMessage: error,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }, [error]);
      reactExports.useEffect(() => {
        console.log("🏠 [ROOMS-DEBUG] State Update - Current User:", {
          hasCurrentUser: !!currentUser2,
          userEmail: (currentUser2 == null ? void 0 : currentUser2.email) || "none",
          userId: (currentUser2 == null ? void 0 : currentUser2.$id) || "none",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }, [currentUser2]);
      reactExports.useEffect(() => {
        console.log("🏠 [ROOMS-DEBUG] ========== INITIALIZATION USEEFFECT TRIGGERED ==========");
        console.log("🏠 [ROOMS-DEBUG] Starting room service initialization and fetch...");
        console.log("🏠 [ROOMS-DEBUG] Component state at initialization:", {
          roomCount: rooms.length,
          isLoading: loading,
          hasError: !!error,
          hasCurrentUser: !!currentUser2,
          hasUser: !!user,
          userProp: user,
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          location: window.location.pathname
        });
        console.log("🏠 [ROOMS-DEBUG] About to call initializeAndFetchRooms()...");
        initializeAndFetchRooms();
        console.log("🏠 [ROOMS-DEBUG] Setting up room updates subscription...");
        const unsubscribe = roomService.subscribeToRoomUpdates((response) => {
          console.log("🏠 [ROOMS-DEBUG] ========== ROOM UPDATE RECEIVED ==========");
          console.log("🏠 [ROOMS-DEBUG] Room update response:", response);
          console.log("🏠 [ROOMS-DEBUG] Triggering rooms refresh due to update...");
          fetchRooms();
        });
        return () => {
          console.log("🏠 [ROOMS-DEBUG] ========== CLEANUP TRIGGERED ==========");
          console.log("🏠 [ROOMS-DEBUG] Unsubscribing from room updates...");
          if (unsubscribe) {
            roomService.unsubscribeAll();
            console.log("🏠 [ROOMS-DEBUG] Successfully unsubscribed from room updates");
          } else {
            console.log("🏠 [ROOMS-DEBUG] No unsubscribe function available");
          }
        };
      }, []);
      const initializeAndFetchRooms = () => __async(null, null, function* () {
        console.log("🏠 [ROOMS-DEBUG] ========== INITIALIZE AND FETCH ROOMS ==========");
        console.log("🏠 [ROOMS-DEBUG] Starting initialization process...");
        console.log("🏠 [ROOMS-DEBUG] Function called at:", (/* @__PURE__ */ new Date()).toISOString());
        console.log("🏠 [ROOMS-DEBUG] Current state when function called:", {
          roomCount: rooms.length,
          isLoading: loading,
          hasError: !!error,
          errorMessage: error,
          hasCurrentUser: !!currentUser2,
          currentUserEmail: (currentUser2 == null ? void 0 : currentUser2.email) || "none",
          hasUser: !!user,
          userEmail: (user == null ? void 0 : user.email) || "none",
          hasOnSelectRoom: !!onSelectRoom,
          hasOnClose: !!onClose
        });
        try {
          console.log("🏠 [ROOMS-DEBUG] Step 1: Initializing room service...");
          const initStartTime = performance.now();
          yield roomService.initialize();
          const initEndTime = performance.now();
          console.log("🏠 [ROOMS-DEBUG] ✅ Room service initialized successfully!");
          console.log("🏠 [ROOMS-DEBUG] Initialization took:", (initEndTime - initStartTime).toFixed(2), "ms");
          console.log("🏠 [ROOMS-DEBUG] Step 2: Getting current AppWrite user...");
          const userStartTime = performance.now();
          const appwriteUser = yield appwriteAuth$1.getCurrentUser();
          const userEndTime = performance.now();
          console.log("🏠 [ROOMS-DEBUG] ✅ AppWrite user retrieved!");
          console.log("🏠 [ROOMS-DEBUG] User retrieval took:", (userEndTime - userStartTime).toFixed(2), "ms");
          console.log("🏠 [ROOMS-DEBUG] User details:", {
            hasUser: !!appwriteUser,
            userId: (appwriteUser == null ? void 0 : appwriteUser.$id) || "none",
            userEmail: (appwriteUser == null ? void 0 : appwriteUser.email) || "none",
            userName: (appwriteUser == null ? void 0 : appwriteUser.name) || "none",
            emailVerified: (appwriteUser == null ? void 0 : appwriteUser.emailVerification) || false,
            fullUserObject: appwriteUser
          });
          setCurrentUser(appwriteUser);
          console.log("🏠 [ROOMS-DEBUG] Step 3: Fetching rooms from database...");
          yield fetchRooms();
          console.log("🏠 [ROOMS-DEBUG] ✅ Initialization completed successfully!");
        } catch (error2) {
          console.error("🏠 [ROOMS-DEBUG] ❌ INITIALIZATION FAILED!");
          console.error("🏠 [ROOMS-DEBUG] Error details:", {
            errorMessage: error2.message,
            errorName: error2.name,
            errorCode: error2.code,
            errorType: error2.type,
            errorStack: error2.stack,
            fullError: error2
          });
          setError("Failed to initialize. Please refresh the page.");
          setLoading(false);
        }
      });
      const fetchRooms = () => __async(null, null, function* () {
        var _a2;
        console.log("🏠 [ROOMS-DEBUG] ========== FETCH ROOMS ==========");
        console.log("🏠 [ROOMS-DEBUG] Starting room fetch process...");
        try {
          console.log("🏠 [ROOMS-DEBUG] Setting loading state to true...");
          setLoading(true);
          setError("");
          console.log("🏠 [ROOMS-DEBUG] Calling roomService.getRooms()...");
          const fetchStartTime = performance.now();
          const result = yield roomService.getRooms();
          const fetchEndTime = performance.now();
          console.log("🏠 [ROOMS-DEBUG] Room fetch completed in:", (fetchEndTime - fetchStartTime).toFixed(2), "ms");
          console.log("🏠 [ROOMS-DEBUG] Room service result:", {
            success: result.success,
            roomCount: ((_a2 = result.rooms) == null ? void 0 : _a2.length) || 0,
            hasError: !!result.error,
            errorMessage: result.error || "none",
            fullResult: result
          });
          if (result.success) {
            console.log("🏠 [ROOMS-DEBUG] ✅ Rooms fetched successfully!");
            console.log("🏠 [ROOMS-DEBUG] Room details:");
            result.rooms.forEach((room, index) => {
              console.log("🏠 [ROOMS-DEBUG]   Room ".concat(index + 1, ":"), {
                id: room.id,
                name: room.name,
                description: room.description,
                memberCount: room.member_count,
                isMember: room.is_member,
                topics: room.topics,
                isPrivate: room.is_private,
                ownerId: room.owner_id,
                creatorName: room.creator_name,
                fullRoom: room
              });
            });
            setRooms(result.rooms);
            console.log("🏠 [ROOMS-DEBUG] Room state updated with", result.rooms.length, "rooms");
            if (result.rooms.length === 0 && currentUser2) {
              console.log("🏠 [ROOMS-DEBUG] 🚀 Database is empty and user is authenticated - auto-creating sample rooms...");
              setTimeout(() => {
                createSampleRooms();
              }, 100);
            }
          } else {
            console.error("🏠 [ROOMS-DEBUG] ❌ Room fetch failed!");
            console.error("🏠 [ROOMS-DEBUG] Error details:", result.error);
            setError(result.error || "Failed to load rooms");
          }
        } catch (error2) {
          console.error("🏠 [ROOMS-DEBUG] ❌ UNEXPECTED ERROR during room fetch!");
          console.error("🏠 [ROOMS-DEBUG] Error details:", {
            errorMessage: error2.message,
            errorName: error2.name,
            errorCode: error2.code,
            errorType: error2.type,
            errorStack: error2.stack,
            fullError: error2
          });
          setError("An unexpected error occurred. Please try again.");
        } finally {
          console.log("🏠 [ROOMS-DEBUG] Setting loading state to false...");
          setLoading(false);
          console.log("🏠 [ROOMS-DEBUG] ========== FETCH ROOMS COMPLETED ==========");
        }
      });
      const handleCreateRoom = (e) => __async(null, null, function* () {
        e.preventDefault();
        setError("");
        if (!currentUser2) {
          setError("You must be logged in to create rooms");
          return;
        }
        try {
          console.log("[RoomSelection] Creating room:", newRoom);
          const roomData = {
            name: newRoom.name,
            description: newRoom.description,
            topics: newRoom.topics.split(",").map((t) => t.trim()).filter((t) => t),
            isPrivate: newRoom.isPrivate
          };
          const result = yield roomService.createRoom(roomData);
          if (result.success) {
            console.log("[RoomSelection] Room created successfully:", result.room);
            setNewRoom({
              name: "",
              description: "",
              topics: "",
              isPrivate: false
            });
            setShowCreateRoom(false);
            yield fetchRooms();
            if (result.room && result.room.id) {
              handleJoinRoom(result.room.id);
            }
          } else {
            setError(result.error || "Failed to create room");
          }
        } catch (error2) {
          console.error("[RoomSelection] Error creating room:", error2);
          setError("Failed to create room. Please try again.");
        }
      });
      const handleJoinRoom = (roomId) => __async(null, null, function* () {
        console.log("🏠 [ROOMS-DEBUG] ========== JOIN ROOM ==========");
        console.log("🏠 [ROOMS-DEBUG] Room join attempt:", {
          roomId,
          hasOnSelectRoom: !!onSelectRoom,
          currentUser: (currentUser2 == null ? void 0 : currentUser2.email) || "none",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        try {
          setError("");
          console.log("🏠 [ROOMS-DEBUG] Calling roomService.joinRoom()...");
          const joinStartTime = performance.now();
          const result = yield roomService.joinRoom(roomId);
          const joinEndTime = performance.now();
          console.log("🏠 [ROOMS-DEBUG] Room join completed in:", (joinEndTime - joinStartTime).toFixed(2), "ms");
          console.log("🏠 [ROOMS-DEBUG] Join result:", {
            success: result.success,
            hasError: !!result.error,
            errorMessage: result.error || "none",
            fullResult: result
          });
          if (result.success) {
            console.log("🏠 [ROOMS-DEBUG] ✅ Successfully joined room!");
            if (onSelectRoom) {
              console.log("🏠 [ROOMS-DEBUG] Calling onSelectRoom callback...");
              const roomObject = { id: roomId, $id: roomId };
              console.log("🏠 [ROOMS-DEBUG] Room object for callback:", roomObject);
              onSelectRoom(roomObject);
              console.log("🏠 [ROOMS-DEBUG] ✅ onSelectRoom callback completed");
            } else {
              console.log("🏠 [ROOMS-DEBUG] ⚠️ No onSelectRoom callback provided");
            }
            console.log("🏠 [ROOMS-DEBUG] Refreshing rooms to update membership status...");
            yield fetchRooms();
          } else {
            console.error("🏠 [ROOMS-DEBUG] ❌ Failed to join room!");
            console.error("🏠 [ROOMS-DEBUG] Join error:", result.error);
            setError(result.error || "Failed to join room");
          }
        } catch (error2) {
          console.error("🏠 [ROOMS-DEBUG] ❌ UNEXPECTED ERROR during room join!");
          console.error("🏠 [ROOMS-DEBUG] Error details:", {
            errorMessage: error2.message,
            errorName: error2.name,
            errorCode: error2.code,
            errorType: error2.type,
            errorStack: error2.stack,
            fullError: error2
          });
          setError("Failed to join room. Please try again.");
        }
        console.log("🏠 [ROOMS-DEBUG] ========== JOIN ROOM COMPLETED ==========");
      });
      const handleDeleteRoom = (roomId) => __async(null, null, function* () {
        try {
          setDeletingRoom(roomId);
          setError("");
          const result = yield roomService.deleteRoom(roomId);
          if (result.success) {
            console.log("[RoomSelection] Room deleted successfully");
            yield fetchRooms();
            setShowDeleteConfirm(null);
          } else {
            setError(result.error || "Failed to delete room");
          }
        } catch (error2) {
          console.error("[RoomSelection] Error deleting room:", error2);
          setError("Failed to delete room. You may not have permission.");
        } finally {
          setDeletingRoom(null);
        }
      });
      const confirmDeleteRoom = (room) => {
        setShowDeleteConfirm(room);
      };
      const cancelDelete = () => {
        setShowDeleteConfirm(null);
      };
      const createSampleRooms = () => __async(null, null, function* () {
        var _a2, _b2, _c2;
        console.log("🏠 [ROOMS-DEBUG] ========== CREATE SAMPLE ROOMS ==========");
        const sampleRooms = [
          {
            name: "General Discussion",
            description: "General chat for all topics and casual conversation",
            topics: "general,chat,welcome",
            isPrivate: false
          },
          {
            name: "JavaScript & Web Dev",
            description: "Discuss JavaScript, React, Node.js, and web development",
            topics: "javascript,react,nodejs,webdev",
            isPrivate: false
          },
          {
            name: "AI & Machine Learning",
            description: "Chat about AI, ML, neural networks, and emerging tech",
            topics: "ai,ml,neural-networks,tech",
            isPrivate: false
          },
          {
            name: "Project Collaboration",
            description: "Coordinate on projects, share code, and collaborate",
            topics: "projects,collaboration,code-sharing",
            isPrivate: false
          }
        ];
        console.log("🏠 [ROOMS-DEBUG] Sample rooms to create:", sampleRooms);
        try {
          console.log("🏠 [ROOMS-DEBUG] Starting sample room creation process...");
          setError("Creating sample rooms...");
          const creationResults = [];
          for (let i = 0; i < sampleRooms.length; i++) {
            const roomData = sampleRooms[i];
            console.log("🏠 [ROOMS-DEBUG] Creating room ".concat(i + 1, "/").concat(sampleRooms.length, ":"), roomData.name);
            const createStartTime = performance.now();
            const result = yield roomService.createRoom(roomData);
            const createEndTime = performance.now();
            console.log("🏠 [ROOMS-DEBUG] Room creation completed in:", (createEndTime - createStartTime).toFixed(2), "ms");
            console.log("🏠 [ROOMS-DEBUG] Creation result:", {
              success: result.success,
              hasError: !!result.error,
              errorMessage: result.error || "none",
              roomId: ((_a2 = result.room) == null ? void 0 : _a2.id) || "none",
              roomName: ((_b2 = result.room) == null ? void 0 : _b2.name) || "none"
            });
            if (result.success) {
              console.log("🏠 [ROOMS-DEBUG] ✅ Successfully created room:", (_c2 = result.room) == null ? void 0 : _c2.name);
              creationResults.push({ success: true, room: result.room });
            } else {
              console.error("🏠 [ROOMS-DEBUG] ❌ Failed to create room:", result.error);
              creationResults.push({ success: false, error: result.error, roomName: roomData.name });
            }
            console.log("🏠 [ROOMS-DEBUG] Waiting 300ms before next room creation...");
            yield new Promise((resolve) => setTimeout(resolve, 300));
          }
          console.log("🏠 [ROOMS-DEBUG] All room creation attempts completed. Results:");
          creationResults.forEach((result, index) => {
            console.log("🏠 [ROOMS-DEBUG]   Room ".concat(index + 1, ":"), result);
          });
          console.log("🏠 [ROOMS-DEBUG] Refreshing rooms list after sample creation...");
          yield fetchRooms();
          const successCount = creationResults.filter((r) => r.success).length;
          const failedCount = creationResults.filter((r) => !r.success).length;
          console.log("🏠 [ROOMS-DEBUG] Sample room creation summary:", {
            totalAttempted: sampleRooms.length,
            successful: successCount,
            failed: failedCount
          });
          setError("");
          console.log("🏠 [ROOMS-DEBUG] ✅ Sample rooms process completed!");
        } catch (error2) {
          console.error("🏠 [ROOMS-DEBUG] ❌ UNEXPECTED ERROR during sample room creation!");
          console.error("🏠 [ROOMS-DEBUG] Error details:", {
            errorMessage: error2.message,
            errorName: error2.name,
            errorCode: error2.code,
            errorType: error2.type,
            errorStack: error2.stack,
            fullError: error2
          });
          setError("Failed to create sample rooms. Try creating rooms manually.");
        }
        console.log("🏠 [ROOMS-DEBUG] ========== CREATE SAMPLE ROOMS COMPLETED ==========");
      });
      if (loading) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "room-selection", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "loading", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "loading-text", children: "Loading rooms from Appwrite..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "loading-dots", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", {})
          ] })
        ] }) });
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-scaffold room-selection", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "appwrite-status", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "status-indicator" }),
          "Connected to Appwrite Cloud",
          currentUser2 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "user-info", children: [
            " | ",
            currentUser2.email
          ] })
        ] }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "error-message", children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-app-bar rooms-header", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "flutter-app-bar-title", children: "Available Rooms" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-app-bar-actions header-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                className: "flutter-button flutter-button-filled create-room-btn",
                onClick: () => setShowCreateRoom(!showCreateRoom),
                disabled: !currentUser2,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-icon", children: "✨" }),
                  showCreateRoom ? "Cancel" : "Create New Room",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-glow" })
                ]
              }
            ),
            onClose && /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "flutter-icon-button close-btn",
                onClick: onClose,
                title: "Close",
                children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-icon", children: "✕" })
              }
            )
          ] })
        ] }),
        !currentUser2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "info-message", children: "Sign in with Appwrite to create and manage rooms" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flutter-container", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flutter-grid flutter-grid-auto rooms-grid", children: rooms.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "no-rooms enhanced-empty-state", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state-icon", children: "💬" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "empty-state-title", children: "Welcome to Recursion Chat!" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "empty-state-description", children: "Looks like this is a fresh start - no chat rooms exist yet." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "empty-state-subtitle", children: "Let's get the conversation going by creating some sample rooms!" }),
          currentUser2 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "empty-state-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "flutter-button flutter-button-filled create-sample-rooms-btn enhanced-create-btn",
                onClick: createSampleRooms,
                style: {
                  marginTop: "24px",
                  padding: "16px 32px",
                  fontSize: "16px",
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  border: "none",
                  borderRadius: "12px",
                  boxShadow: "0 8px 25px rgba(102, 126, 234, 0.3)",
                  transition: "all 0.3s ease",
                  cursor: "pointer"
                },
                children: "🚀 Create Sample Chat Rooms"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "empty-state-help", children: "This will create 5 starter rooms including General Discussion, JavaScript & Web Dev, AI & Machine Learning, and more!" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "empty-state-auth-required", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Please sign in to create chat rooms" }) })
        ] }) : rooms.map((room, index) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: "flutter-card room-card",
            style: { "--card-index": index },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "room-card-glow" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-card-content room-card-content", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "room-icon", style: { "--card-index": index }, children: "🌐" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "room-name", children: room.name }),
                  room.topics && room.topics.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "room-topics-inline", children: room.topics.map((topic, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "span",
                    {
                      className: "topic-tag-inline",
                      style: { "--tag-index": idx },
                      children: [
                        "#",
                        topic
                      ]
                    },
                    idx
                  )) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "room-description", children: room.description || "No description available" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "room-info", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "member-count", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "info-icon", children: "👥" }),
                    room.member_count || 0,
                    " ",
                    room.member_count === 1 ? "member" : "members"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "creator-info", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "info-icon", children: "👤" }),
                    room.creator_name || "Unknown"
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "room-actions", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    "button",
                    {
                      className: "flutter-button flutter-button-filled join-room-btn ".concat(room.is_member ? "member-btn" : "join-btn"),
                      onClick: () => handleJoinRoom(room.id),
                      style: { "--card-index": index },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-icon", children: room.is_member ? "🚪" : "➕" }),
                        room.is_member ? "Enter Room" : "Join Room"
                      ]
                    }
                  ),
                  currentUser2 && room.owner_id === currentUser2.$id && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      className: "flutter-icon-button delete-room-btn",
                      onClick: (e) => {
                        e.stopPropagation();
                        confirmDeleteRoom(room);
                      },
                      title: "Delete Room (Creator only)",
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "btn-icon", children: "🗑️" })
                    }
                  )
                ] })
              ] })
            ]
          },
          room.id
        )) }) }),
        showCreateRoom && currentUser2 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flutter-container", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flutter-card create-room-form", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-card-content", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Create a New Room" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleCreateRoom, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-text-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "flutter-text-field-label", children: "Room Name" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  className: "flutter-text-field-input",
                  value: newRoom.name,
                  onChange: (e) => setNewRoom(__spreadProps(__spreadValues({}, newRoom), { name: e.target.value })),
                  placeholder: "e.g., JavaScript Discussions",
                  required: true,
                  maxLength: 50
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-text-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "flutter-text-field-label", children: "Description" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "textarea",
                {
                  className: "flutter-text-field-input",
                  value: newRoom.description,
                  onChange: (e) => setNewRoom(__spreadProps(__spreadValues({}, newRoom), { description: e.target.value })),
                  placeholder: "What is this room about?",
                  rows: "3",
                  maxLength: 200
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-text-field", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "flutter-text-field-label", children: "Topics (comma-separated)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  className: "flutter-text-field-input",
                  value: newRoom.topics,
                  onChange: (e) => setNewRoom(__spreadProps(__spreadValues({}, newRoom), { topics: e.target.value })),
                  placeholder: "e.g., javascript, react, nodejs",
                  maxLength: 100
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "These topics help categorize your room" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "form-group", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "checkbox-label", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    type: "checkbox",
                    checked: newRoom.isPrivate,
                    onChange: (e) => setNewRoom(__spreadProps(__spreadValues({}, newRoom), { isPrivate: e.target.checked }))
                  }
                ),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Make this a private room (invite-only)" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("small", { children: "Private rooms are only visible to invited members" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "form-actions p-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: "flutter-button flutter-button-filled submit-btn", children: "Create Room" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "flutter-button flutter-button-outlined cancel-btn",
                  onClick: () => setShowCreateRoom(false),
                  children: "Cancel"
                }
              )
            ] })
          ] })
        ] }) }) }),
        showDeleteConfirm && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "delete-confirm-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flutter-card delete-confirm-dialog", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flutter-card-content", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { children: "⚠️ Delete Room" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
            "Are you sure you want to delete ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              '"',
              showDeleteConfirm.name,
              '"'
            ] }),
            "?"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "warning-text", children: "This action cannot be undone. All messages and room data will be permanently deleted." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "delete-confirm-actions", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "flutter-button flutter-button-filled confirm-delete-btn",
                onClick: () => handleDeleteRoom(showDeleteConfirm.id),
                disabled: deletingRoom === showDeleteConfirm.id,
                children: deletingRoom === showDeleteConfirm.id ? "Deleting..." : "🗑️ Delete Room"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                className: "flutter-button flutter-button-outlined cancel-delete-btn",
                onClick: cancelDelete,
                disabled: deletingRoom === showDeleteConfirm.id,
                children: "Cancel"
              }
            )
          ] })
        ] }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("style", { jsx: true, children: "\n        .appwrite-status {\n          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n          color: white;\n          padding: 8px 16px;\n          border-radius: 8px;\n          margin-bottom: 20px;\n          display: flex;\n          align-items: center;\n          font-size: 14px;\n        }\n\n        .status-indicator {\n          width: 8px;\n          height: 8px;\n          background: #4ade80;\n          border-radius: 50%;\n          margin-right: 8px;\n          animation: pulse 2s infinite;\n        }\n\n        @keyframes pulse {\n          0%, 100% { opacity: 1; }\n          50% { opacity: 0.5; }\n        }\n\n        .rooms-header {\n          display: flex;\n          justify-content: space-between;\n          align-items: center;\n          margin-bottom: 20px;\n        }\n\n        .info-message {\n          background: #f3f4f6;\n          border: 1px solid #e5e7eb;\n          padding: 12px;\n          border-radius: 8px;\n          margin-bottom: 20px;\n          text-align: center;\n          color: #6b7280;\n        }\n\n        .no-rooms {\n          grid-column: 1 / -1;\n          text-align: center;\n          padding: 60px 20px;\n          color: #9ca3af;\n        }\n\n        .no-rooms p {\n          margin: 10px 0;\n        }\n      " })
      ] });
    }
    function RoomSelectionWrapper() {
      const navigate = useNavigate();
      const handleRoomSelect = (room) => {
        navigate("/chat");
      };
      const handleClose = () => {
        navigate("/");
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "room-selection-page", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "room-selection-container", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px"
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { children: "Select a Chat Room" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          RoomSelectionAppwrite,
          {
            onSelectRoom: handleRoomSelect,
            onClose: handleClose
          }
        )
      ] }) });
    }
    function SimpleChatInterface() {
      var _a2;
      const navigate = useNavigate();
      const simpleAuth = useSimpleMobileAuth();
      const enhancedAuth2 = useAuth$1();
      const auth = (simpleAuth == null ? void 0 : simpleAuth.user) ? simpleAuth : enhancedAuth2;
      const { user, logout, isAuthenticated } = auth;
      const [message, setMessage] = reactExports.useState("");
      const [messages, setMessages] = reactExports.useState([
        {
          id: 1,
          username: "System",
          content: "Welcome to Recursion Chat! Mobile Safari authentication has been optimized.",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          isSystem: true
        }
      ]);
      const handleSendMessage = (e) => {
        var _a3;
        e.preventDefault();
        if (!message.trim()) return;
        const newMessage = {
          id: messages.length + 1,
          username: ((_a3 = user == null ? void 0 : user.email) == null ? void 0 : _a3.split("@")[0]) || (user == null ? void 0 : user.username) || "User",
          content: message.trim(),
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          isSystem: false
        };
        setMessages((prev) => [...prev, newMessage]);
        setMessage("");
      };
      const handleLogout = () => __async(null, null, function* () {
        try {
          yield logout();
        } catch (error) {
          console.error("Logout error:", error);
          window.location.replace("/auth/signin");
        }
      });
      if (!isAuthenticated || !user) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white"
        }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { textAlign: "center" }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { children: "Authentication Required" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => navigate("/auth/signin"),
              style: {
                padding: "12px 24px",
                background: "white",
                color: "#667eea",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                marginTop: "16px"
              },
              children: "Sign In"
            }
          )
        ] }) });
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#f5f5f5",
        fontFamily: "system-ui, sans-serif"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: { margin: 0, fontSize: "24px" }, children: "Recursion Chat" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { style: { margin: "4px 0 0", fontSize: "14px", opacity: 0.9 }, children: [
              "Welcome, ",
              ((_a2 = user.email) == null ? void 0 : _a2.split("@")[0]) || user.username || "User",
              "!"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: () => navigate("/rooms"),
                style: {
                  padding: "8px 16px",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginRight: "12px"
                },
                children: "Rooms"
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "button",
              {
                onClick: handleLogout,
                style: {
                  padding: "8px 16px",
                  background: "rgba(255,255,255,0.2)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.3)",
                  borderRadius: "6px",
                  cursor: "pointer"
                },
                children: "Sign Out"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          flex: 1,
          overflow: "auto",
          padding: "20px",
          background: "white"
        }, children: messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            style: {
              marginBottom: "16px",
              padding: "12px",
              background: msg.isSystem ? "#e3f2fd" : "#f5f5f5",
              borderRadius: "8px",
              border: msg.isSystem ? "1px solid #bbdefb" : "1px solid #e0e0e0"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "4px"
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { style: {
                  color: msg.isSystem ? "#1565c0" : "#333",
                  fontSize: "14px"
                }, children: msg.username }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: {
                  fontSize: "12px",
                  color: "#666"
                }, children: new Date(msg.timestamp).toLocaleTimeString() })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { fontSize: "16px", lineHeight: "1.4" }, children: msg.content })
            ]
          },
          msg.id
        )) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "form",
          {
            onSubmit: handleSendMessage,
            style: {
              padding: "20px",
              background: "white",
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              gap: "12px"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "input",
                {
                  type: "text",
                  value: message,
                  onChange: (e) => setMessage(e.target.value),
                  placeholder: "Type a message...",
                  style: {
                    flex: 1,
                    padding: "12px",
                    border: "2px solid #e0e0e0",
                    borderRadius: "6px",
                    fontSize: "16px"
                  }
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "submit",
                  disabled: !message.trim(),
                  style: {
                    padding: "12px 24px",
                    background: message.trim() ? "#667eea" : "#ccc",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: message.trim() ? "pointer" : "not-allowed",
                    fontSize: "16px"
                  },
                  children: "Send"
                }
              )
            ]
          }
        ),
        /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent) && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          position: "fixed",
          top: "10px",
          right: "10px",
          background: "#4caf50",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          fontSize: "12px",
          zIndex: 1e3
        }, children: "📱 Mobile Safari Optimized" })
      ] });
    }
    const detectMobileSafari = () => {
      const userAgent = navigator.userAgent;
      const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
      const isSafari = /Safari/i.test(userAgent);
      const isNotChrome = !/CriOS/i.test(userAgent);
      const isNotFirefox = !/FxiOS/i.test(userAgent);
      const isNotEdge = !/EdgiOS/i.test(userAgent);
      const result = isIOS && isSafari && isNotChrome && isNotFirefox && isNotEdge;
      return result;
    };
    function MobileSafariRoutes() {
      return /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileAuthProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DesignModeProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/auth/signin", replace: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth/signin", element: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileAuthPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth/callback", element: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileAuthPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth/error", element: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileAuthPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/verify", element: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileAuthPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/login", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/auth/signin", replace: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/confirm-email", element: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileAuthPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/rooms", replace: true }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/rooms", element: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(RoomSelectionWrapper, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/chat", element: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleMobileProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleChatInterface, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "*", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/rooms" }) })
      ] }) }) });
    }
    function DesktopRoutes() {
      const isNativeApp = Capacitor.isNativePlatform();
      return /* @__PURE__ */ jsxRuntimeExports.jsx(EnhancedAuthProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(NativeAuthProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DesignModeProvider, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/auth/signin", replace: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth/signin", element: isNativeApp ? /* @__PURE__ */ jsxRuntimeExports.jsx(NativeAuth, {}) : /* @__PURE__ */ jsxRuntimeExports.jsx(SignInPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth/callback", element: /* @__PURE__ */ jsxRuntimeExports.jsx(OAuthCallback, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth/error", element: /* @__PURE__ */ jsxRuntimeExports.jsx(SignInPage, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/verify", element: /* @__PURE__ */ jsxRuntimeExports.jsx(EmailVerification, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/login", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/auth/signin", replace: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/confirm-email", element: /* @__PURE__ */ jsxRuntimeExports.jsx(EmailConfirmation, {}) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/", element: /* @__PURE__ */ jsxRuntimeExports.jsx(EnhancedNoPopupProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/rooms", replace: true }) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/rooms", element: /* @__PURE__ */ jsxRuntimeExports.jsx(EnhancedNoPopupProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(RoomSelectionWrapper, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/chat", element: /* @__PURE__ */ jsxRuntimeExports.jsx(EnhancedNoPopupProtectedRoute, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleChatInterface, {}) }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "*", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/rooms" }) })
      ] }) }) }) });
    }
    function MobileSafariApp() {
      const isMobileSafari = detectMobileSafari();
      const forceMobileOptimization = localStorage.getItem("force_mobile_auth") === "true";
      const useMobileOptimization = isMobileSafari || forceMobileOptimization;
      if (useMobileOptimization) {
        if (typeof document !== "undefined") {
          document.body.setAttribute("data-mobile-safari", "true");
          document.body.style.setProperty("--mobile-safari-optimized", "1");
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsx(MobileSafariRoutes, {});
      } else {
        if (typeof document !== "undefined") {
          document.body.removeAttribute("data-mobile-safari");
          document.body.style.removeProperty("--mobile-safari-optimized");
        }
        return /* @__PURE__ */ jsxRuntimeExports.jsx(DesktopRoutes, {});
      }
    }
    const storage = {
      get: (key) => {
        try {
          return localStorage.getItem(key) || sessionStorage.getItem(key);
        } catch (e) {
          return null;
        }
      },
      set: (key, value) => {
        try {
          localStorage.setItem(key, value);
          sessionStorage.setItem(key, value);
        } catch (e) {
        }
      },
      remove: (key) => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
        }
      }
    };
    const checkAuthSync = () => {
      const userData = storage.get("user_data");
      const token = storage.get("auth_token") || storage.get("backend_token");
      if (userData && token) {
        try {
          const user = JSON.parse(userData);
          return {
            isAuthenticated: true,
            user,
            token,
            source: "cache"
          };
        } catch (e) {
        }
      }
      return {
        isAuthenticated: false,
        user: null,
        token: null,
        source: "none"
      };
    };
    const quickLogin = (email, password) => __async(null, null, function* () {
      if (!email || !password) {
        throw new Error("Email and password required");
      }
      const mockUser = {
        $id: "temp_" + Date.now(),
        email,
        name: email.split("@")[0],
        temp: true
      };
      const mockToken = "temp_token_" + Date.now();
      storage.set("user_data", JSON.stringify(mockUser));
      storage.set("auth_token", mockToken);
      setTimeout(() => __async(null, null, function* () {
        var _a2, _b2, _c2;
        try {
          const { enhancedAuth: enhancedAuth2 } = yield __vitePreload(() => __async(null, null, function* () {
            const { enhancedAuth: enhancedAuth3 } = yield Promise.resolve().then(() => appwriteEnhancedAuth);
            return { enhancedAuth: enhancedAuth3 };
          }), true ? void 0 : void 0);
          const result = yield enhancedAuth2.loginWithEmail(email, password);
          if (result == null ? void 0 : result.user) {
            storage.set("user_data", JSON.stringify(result.user));
            storage.set("auth_token", ((_a2 = result.session) == null ? void 0 : _a2.access_token) || mockToken);
            storage.set("backend_token", ((_b2 = result.session) == null ? void 0 : _b2.access_token) || mockToken);
            window.dispatchEvent(new CustomEvent("auth-updated", {
              detail: { user: result.user, token: (_c2 = result.session) == null ? void 0 : _c2.access_token }
            }));
          }
        } catch (error) {
          console.log("[InstantAuth] Background login failed, keeping mock auth");
        }
      }), 100);
      return {
        user: mockUser,
        token: mockToken,
        instant: true
      };
    });
    const quickOAuth = (provider) => {
      const baseUrl = window.location.origin;
      const successUrl = "".concat(baseUrl, "/#/auth/callback");
      const failureUrl = "".concat(baseUrl, "/#/auth/error");
      const projectId = "689bdaf500072795b0f6";
      const endpoint = "https://nyc.cloud.appwrite.io/v1";
      const oauthUrl = "".concat(endpoint, "/account/sessions/oauth2/").concat(provider, "?") + "project=".concat(projectId, "&") + "success=".concat(encodeURIComponent(successUrl), "&") + "failure=".concat(encodeURIComponent(failureUrl));
      window.location.href = oauthUrl;
    };
    const handleOAuthCallback = () => __async(null, null, function* () {
      const urlParams = new URLSearchParams(window.location.search);
      const userId = urlParams.get("userId");
      const secret = urlParams.get("secret");
      if (userId && secret) {
        const mockUser = {
          $id: userId,
          email: "oauth@user.com",
          name: "OAuth User",
          oauth: true
        };
        const token = secret;
        storage.set("user_data", JSON.stringify(mockUser));
        storage.set("auth_token", token);
        storage.set("backend_token", token);
        setTimeout(() => __async(null, null, function* () {
          try {
            const { enhancedAuth: enhancedAuth2 } = yield __vitePreload(() => __async(null, null, function* () {
              const { enhancedAuth: enhancedAuth3 } = yield Promise.resolve().then(() => appwriteEnhancedAuth);
              return { enhancedAuth: enhancedAuth3 };
            }), true ? void 0 : void 0);
            const session = yield enhancedAuth2.getSession();
            if (session == null ? void 0 : session.user) {
              storage.set("user_data", JSON.stringify(session.user));
            }
          } catch (e) {
          }
        }), 100);
        return { user: mockUser, token, oauth: true };
      }
      throw new Error("No OAuth credentials found");
    });
    const quickLogout = () => {
      const authKeys = [
        "user_data",
        "auth_token",
        "backend_token",
        "token",
        "appwrite_session",
        "appwrite_user",
        "mobile_auth_success"
      ];
      authKeys.forEach((key) => {
        storage.remove(key);
      });
      setTimeout(() => __async(null, null, function* () {
        try {
          const { enhancedAuth: enhancedAuth2 } = yield __vitePreload(() => __async(null, null, function* () {
            const { enhancedAuth: enhancedAuth3 } = yield Promise.resolve().then(() => appwriteEnhancedAuth);
            return { enhancedAuth: enhancedAuth3 };
          }), true ? void 0 : void 0);
          yield enhancedAuth2.logout();
        } catch (e) {
        }
      }), 100);
    };
    const validateInBackground = () => {
      setTimeout(() => __async(null, null, function* () {
        try {
          const { enhancedAuth: enhancedAuth2 } = yield __vitePreload(() => __async(null, null, function* () {
            const { enhancedAuth: enhancedAuth3 } = yield Promise.resolve().then(() => appwriteEnhancedAuth);
            return { enhancedAuth: enhancedAuth3 };
          }), true ? void 0 : void 0);
          const isValid = yield enhancedAuth2.validateSession();
          if (!isValid) {
            window.dispatchEvent(new CustomEvent("session-invalid"));
          }
        } catch (e) {
        }
      }), 2e3);
    };
    const instantAuth = {
      checkAuthSync,
      quickLogin,
      quickOAuth,
      handleOAuthCallback,
      quickLogout,
      validateInBackground
    };
    const DebugOverlay = ({ show, info }) => {
      var _a2;
      if (!show) return null;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "rgba(0,0,0,0.9)",
        color: "#00ff00",
        padding: "10px",
        fontSize: "10px",
        fontFamily: "monospace",
        zIndex: 99999,
        maxHeight: "30vh",
        overflow: "auto"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "Mobile Safari Debug" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "Auth: ",
          info.isAuth ? "YES" : "NO"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "User: ",
          ((_a2 = info.user) == null ? void 0 : _a2.email) || "none"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "Route: ",
          info.route
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "Time: ",
          info.loadTime,
          "ms"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "Stage: ",
          info.stage
        ] }),
        info.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: { color: "#ff0000" }, children: [
          "Error: ",
          info.error
        ] })
      ] });
    };
    const InstantLoginForm = ({ onLogin }) => {
      const [email, setEmail] = reactExports.useState("");
      const [password, setPassword] = reactExports.useState("");
      const [error, setError] = reactExports.useState("");
      const [loading, setLoading] = reactExports.useState(false);
      const handleSubmit = (e) => __async(null, null, function* () {
        e.preventDefault();
        if (loading) return;
        setError("");
        setLoading(true);
        try {
          if (!email || !password) {
            throw new Error("Email and password required");
          }
          const loginPromise = onLogin(email, password);
          const timeoutPromise = new Promise(
            (_, reject) => setTimeout(() => reject(new Error("Login timeout")), 5e3)
          );
          yield Promise.race([loginPromise, timeoutPromise]);
        } catch (err) {
          setError(err.message || "Login failed");
          setLoading(false);
        }
      });
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1a1a1a",
        padding: "20px"
      }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleSubmit, style: {
        width: "100%",
        maxWidth: "400px",
        background: "#2a2a2a",
        padding: "30px",
        borderRadius: "12px"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: {
          color: "#fff",
          marginBottom: "20px",
          fontSize: "24px",
          textAlign: "center"
        }, children: "Recursion Chat" }),
        error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#ef4444",
          padding: "10px",
          borderRadius: "6px",
          marginBottom: "15px",
          fontSize: "14px"
        }, children: error }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "email",
            placeholder: "Email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            disabled: loading,
            style: {
              width: "100%",
              padding: "12px",
              marginBottom: "15px",
              background: "#1a1a1a",
              border: "1px solid #3a3a3a",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "16px"
            },
            autoComplete: "email",
            autoCapitalize: "none"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "password",
            placeholder: "Password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            disabled: loading,
            style: {
              width: "100%",
              padding: "12px",
              marginBottom: "20px",
              background: "#1a1a1a",
              border: "1px solid #3a3a3a",
              borderRadius: "6px",
              color: "#fff",
              fontSize: "16px"
            },
            autoComplete: "current-password"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            type: "submit",
            disabled: loading,
            style: {
              width: "100%",
              padding: "12px",
              background: loading ? "#666" : "#4ade80",
              color: "#000",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer"
            },
            children: loading ? "Signing in..." : "Sign In"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          marginTop: "20px",
          textAlign: "center",
          color: "#888",
          fontSize: "14px"
        }, children: "Mobile Safari Optimized" })
      ] }) });
    };
    const SimpleRoomList = ({ onSelectRoom }) => {
      const [rooms] = reactExports.useState([
        { id: "general", name: "General Chat", icon: "💬" },
        { id: "tech", name: "Tech Discussion", icon: "🚀" },
        { id: "random", name: "Random", icon: "🎲" }
      ]);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        minHeight: "100vh",
        background: "#1a1a1a",
        padding: "20px"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { style: {
          color: "#fff",
          marginBottom: "20px",
          fontSize: "24px"
        }, children: "Select a Room" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { display: "flex", flexDirection: "column", gap: "10px" }, children: rooms.map((room) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => onSelectRoom(room),
            style: {
              padding: "15px",
              background: "#2a2a2a",
              border: "1px solid #3a3a3a",
              borderRadius: "8px",
              color: "#fff",
              textAlign: "left",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "24px" }, children: room.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: room.name })
            ]
          },
          room.id
        )) })
      ] });
    };
    const SimpleChatUI = ({ room, user, onBack }) => {
      const [message, setMessage] = reactExports.useState("");
      const [messages, setMessages] = reactExports.useState([
        { id: 1, text: "Welcome to " + ((room == null ? void 0 : room.name) || "Chat"), user: "System", time: /* @__PURE__ */ new Date() }
      ]);
      const handleSend = () => {
        if (!message.trim()) return;
        setMessages((prev) => [...prev, {
          id: Date.now(),
          text: message,
          user: (user == null ? void 0 : user.email) || "You",
          time: /* @__PURE__ */ new Date()
        }]);
        setMessage("");
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "#1a1a1a"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          padding: "15px",
          background: "#2a2a2a",
          borderBottom: "1px solid #3a3a3a",
          display: "flex",
          alignItems: "center",
          gap: "10px"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: onBack,
              style: {
                background: "none",
                border: "none",
                color: "#4ade80",
                fontSize: "20px",
                cursor: "pointer"
              },
              children: "←"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { style: { color: "#fff", fontSize: "18px", margin: 0 }, children: (room == null ? void 0 : room.name) || "Chat" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: {
          flex: 1,
          overflow: "auto",
          padding: "15px"
        }, children: messages.map((msg) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          marginBottom: "10px",
          padding: "10px",
          background: "#2a2a2a",
          borderRadius: "8px"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#4ade80", fontSize: "12px", marginBottom: "5px" }, children: msg.user }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { style: { color: "#fff" }, children: msg.text })
        ] }, msg.id)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { style: {
          padding: "15px",
          background: "#2a2a2a",
          borderTop: "1px solid #3a3a3a",
          display: "flex",
          gap: "10px"
        }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "input",
            {
              type: "text",
              value: message,
              onChange: (e) => setMessage(e.target.value),
              onKeyPress: (e) => e.key === "Enter" && handleSend(),
              placeholder: "Type a message...",
              style: {
                flex: 1,
                padding: "10px",
                background: "#1a1a1a",
                border: "1px solid #3a3a3a",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "16px"
              }
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: handleSend,
              style: {
                padding: "10px 20px",
                background: "#4ade80",
                color: "#000",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600"
              },
              children: "Send"
            }
          )
        ] })
      ] });
    };
    function MobileSafariInstantApp() {
      const startTime = reactExports.useRef(performance.now());
      const navigate = useNavigate();
      const location = useLocation();
      const initialAuth = instantAuth.checkAuthSync();
      const [isAuth, setIsAuth] = reactExports.useState(initialAuth.isAuthenticated);
      const [user, setUser] = reactExports.useState(initialAuth.user);
      const [token, setToken] = reactExports.useState(initialAuth.token);
      const [selectedRoom, setSelectedRoom] = reactExports.useState(null);
      const [debugInfo, setDebugInfo] = reactExports.useState({
        isAuth: initialAuth.isAuthenticated,
        user: initialAuth.user,
        route: location.pathname,
        loadTime: 0,
        stage: "initial",
        error: null
      });
      const showDebug = window.location.search.includes("debug") || false || localStorage.getItem("mobile_debug") === "true";
      reactExports.useEffect(() => {
        const loadTime = Math.round(performance.now() - startTime.current);
        setDebugInfo((prev) => __spreadProps(__spreadValues({}, prev), {
          isAuth,
          user,
          route: location.pathname,
          loadTime,
          stage: "rendered"
        }));
      }, [isAuth, user, location]);
      const handleLogin = reactExports.useCallback((email, password) => __async(null, null, function* () {
        try {
          const result = yield instantAuth.quickLogin(email, password);
          setUser(result.user);
          setToken(result.token);
          setIsAuth(true);
          navigate("/rooms");
          const handleAuthUpdate = (e) => {
            var _a2;
            if ((_a2 = e.detail) == null ? void 0 : _a2.user) {
              setUser(e.detail.user);
              setToken(e.detail.token);
            }
          };
          window.addEventListener("auth-updated", handleAuthUpdate);
          return result;
        } catch (error) {
          setDebugInfo((prev) => __spreadProps(__spreadValues({}, prev), { error: error.message }));
          throw error;
        }
      }), [navigate]);
      reactExports.useCallback(() => {
        instantAuth.quickLogout();
        setUser(null);
        setToken(null);
        setIsAuth(false);
        setSelectedRoom(null);
        navigate("/login");
      }, [navigate]);
      const handleSelectRoom = reactExports.useCallback((room) => {
        setSelectedRoom(room);
        navigate("/chat");
      }, [navigate]);
      const handleBackToRooms = reactExports.useCallback(() => {
        setSelectedRoom(null);
        navigate("/rooms");
      }, [navigate]);
      reactExports.useEffect(() => {
        if (isAuth && user && !user.temp) {
          instantAuth.validateInBackground();
          const handleInvalidSession = () => {
            console.log("[InstantApp] Session invalid, but keeping UI active");
          };
          window.addEventListener("session-invalid", handleInvalidSession);
          return () => window.removeEventListener("session-invalid", handleInvalidSession);
        }
      }, [isAuth, user]);
      reactExports.useEffect(() => {
        const mountTime = Math.round(performance.now() - startTime.current);
        console.log("[MobileSafariInstant] App mounted in ".concat(mountTime, "ms"));
        window.dispatchEvent(new CustomEvent("instant-app-mounted", { detail: { mountTime } }));
      }, []);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(DebugOverlay, { show: showDebug, info: debugInfo }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Routes, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/login", element: isAuth ? /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/rooms", replace: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx(InstantLoginForm, { onLogin: handleLogin }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/auth/signin", element: isAuth ? /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/rooms", replace: true }) : /* @__PURE__ */ jsxRuntimeExports.jsx(InstantLoginForm, { onLogin: handleLogin }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/rooms", element: isAuth ? /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleRoomList, { onSelectRoom: handleSelectRoom }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/login", replace: true }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "/chat", element: isAuth && selectedRoom ? /* @__PURE__ */ jsxRuntimeExports.jsx(SimpleChatUI, { room: selectedRoom, user, onBack: handleBackToRooms }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: "/rooms", replace: true }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Route, { path: "*", element: /* @__PURE__ */ jsxRuntimeExports.jsx(Navigate, { to: isAuth ? "/rooms" : "/login", replace: true }) })
        ] })
      ] });
    }
    const PROVIDER_CONFIG = {
      google: {
        name: "Google",
        icon: "🔍",
        svg: "https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg",
        colors: {
          bg: "#ffffff",
          text: "#3c4043",
          border: "#dadce0",
          hover: "#f8f9fa"
        }
      },
      github: {
        name: "GitHub",
        icon: "🐙",
        colors: {
          bg: "#24292e",
          text: "#ffffff",
          border: "#24292e",
          hover: "#1a1e22"
        }
      },
      facebook: {
        name: "Facebook",
        icon: "📘",
        colors: {
          bg: "#1877f2",
          text: "#ffffff",
          border: "#1877f2",
          hover: "#166fe5"
        }
      },
      apple: {
        name: "Apple",
        icon: "🍎",
        colors: {
          bg: "#000000",
          text: "#ffffff",
          border: "#000000",
          hover: "#1a1a1a"
        }
      },
      microsoft: {
        name: "Microsoft",
        icon: "🪟",
        colors: {
          bg: "#2f2f2f",
          text: "#ffffff",
          border: "#2f2f2f",
          hover: "#1f1f1f"
        }
      },
      discord: {
        name: "Discord",
        icon: "💬",
        colors: {
          bg: "#5865f2",
          text: "#ffffff",
          border: "#5865f2",
          hover: "#4752c4"
        }
      }
    };
    const UnifiedSSOButton = ({
      provider = "google",
      onSuccess,
      onError,
      text,
      style = "default",
      size = "medium",
      fullWidth = false,
      disabled = false,
      className = "",
      appwriteConfig = {}
    }) => {
      const [loading, setLoading] = reactExports.useState(false);
      const [mounted, setMounted] = reactExports.useState(false);
      reactExports.useEffect(() => {
        setMounted(true);
      }, []);
      const config = PROVIDER_CONFIG[provider] || PROVIDER_CONFIG.google;
      const handleClick = () => __async(null, null, function* () {
        if (loading || disabled) return;
        setLoading(true);
        try {
          if (appwriteConfig.authService) {
            const user = yield appwriteConfig.authService.signInWithProvider(provider);
            setLoading(false);
            if (onSuccess) onSuccess(user);
          } else {
            throw new Error("Authentication service not configured");
          }
        } catch (error) {
          setLoading(false);
          console.error("[UnifiedSSO] ".concat(provider, " auth error:"), error);
          if (onError) onError(error);
        }
      });
      const sizeClasses = {
        small: "px-3 py-1.5 text-sm",
        medium: "px-4 py-2.5 text-base",
        large: "px-6 py-3 text-lg"
      };
      const styleClasses = {
        default: "bg-white border-2",
        filled: "",
        outline: "bg-transparent border-2",
        minimal: "bg-transparent border-0"
      };
      const baseStyles = {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        borderRadius: "8px",
        fontWeight: "500",
        cursor: disabled || loading ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transition: "all 0.2s ease",
        width: fullWidth ? "100%" : "auto",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        minHeight: "48px"
        // Touch-friendly mobile target
      };
      const buttonStyles = __spreadProps(__spreadValues({}, baseStyles), {
        backgroundColor: style === "filled" ? config.colors.bg : style === "default" ? "#ffffff" : "transparent",
        color: style === "filled" ? config.colors.text : style === "default" || style === "outline" ? config.colors.bg : config.colors.bg,
        borderColor: style === "minimal" ? "transparent" : config.colors.border
      });
      const buttonText = text || "Continue with ".concat(config.name);
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: handleClick,
          disabled: disabled || loading || !mounted,
          className: "unified-sso-button ".concat(sizeClasses[size], " ").concat(styleClasses[style], " ").concat(className),
          style: buttonStyles,
          onMouseEnter: (e) => {
            if (!disabled && !loading) {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
              if (style === "filled") {
                e.currentTarget.style.backgroundColor = config.colors.hover;
              } else if (style === "default") {
                e.currentTarget.style.backgroundColor = config.colors.hover;
                e.currentTarget.style.color = "#ffffff";
              }
            }
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "none";
            if (style === "filled") {
              e.currentTarget.style.backgroundColor = config.colors.bg;
            } else if (style === "default") {
              e.currentTarget.style.backgroundColor = "#ffffff";
              e.currentTarget.style.color = config.colors.bg;
            }
          },
          children: [
            loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { style: { display: "flex", alignItems: "center", gap: "8px" }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  style: {
                    width: "16px",
                    height: "16px",
                    border: "2px solid transparent",
                    borderTopColor: "currentColor",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite"
                  }
                }
              ),
              "Connecting..."
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              config.svg ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                "img",
                {
                  src: config.svg,
                  alt: config.name,
                  style: { width: "20px", height: "20px" }
                }
              ) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { style: { fontSize: "20px" }, children: config.icon }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: buttonText })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("style", { jsx: true, children: "\n        @keyframes spin {\n          to { transform: rotate(360deg); }\n        }\n      " })
          ]
        }
      );
    };
    const UnifiedAuth = ({
      appwriteConfig,
      onSuccess,
      onError,
      showEmailAuth = true,
      showSSOAuth = true,
      enabledProviders = ["google", "github"],
      title = "Welcome",
      subtitle = "Sign in to your account",
      className = ""
    }) => {
      const [loading, setLoading] = reactExports.useState(false);
      const [email, setEmail] = reactExports.useState("");
      const [password, setPassword] = reactExports.useState("");
      const [isSignUp, setIsSignUp] = reactExports.useState(false);
      const [message, setMessage] = reactExports.useState({ type: "", text: "" });
      const [showPassword, setShowPassword] = reactExports.useState(false);
      const handleEmailAuth = (e) => __async(null, null, function* () {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });
        try {
          if (isSignUp) {
            const result = yield appwriteConfig.authService.signup(email, password, email.split("@")[0]);
            setMessage({
              type: "success",
              text: result.message || "Account created! Please check your email for verification."
            });
          } else {
            const result = yield appwriteConfig.authService.signin(email, password);
            setMessage({
              type: "success",
              text: "Successfully signed in! Redirecting..."
            });
            setTimeout(() => {
              if (onSuccess) onSuccess(result.user);
            }, 1e3);
          }
        } catch (error) {
          setMessage({
            type: "error",
            text: error.message || "Authentication failed"
          });
        } finally {
          setLoading(false);
        }
      });
      const handleSSOSuccess = (user) => __async(null, null, function* () {
        setMessage({
          type: "success",
          text: "Welcome, ".concat(user.name || user.email, "!")
        });
        setTimeout(() => {
          if (onSuccess) onSuccess(user);
        }, 1e3);
      });
      const handleSSOError = (error) => {
        setMessage({
          type: "error",
          text: error.message || "Authentication failed. Please try again."
        });
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "unified-auth-wrapper ".concat(className), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "unified-auth-background", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-gradient" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-pattern" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "unified-auth-container", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "unified-auth-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "unified-auth-header", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "unified-auth-title", children: title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "unified-auth-subtitle", children: subtitle })
          ] }),
          message.text && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "unified-auth-message ".concat(message.type), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "message-icon", children: message.type === "success" ? "✓" : message.type === "error" ? "!" : message.type === "info" ? "ℹ" : "" }),
            message.text
          ] }),
          showEmailAuth && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleEmailAuth, className: "unified-auth-form", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "email", className: "form-label", children: "Email Address" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "input",
                  {
                    id: "email",
                    type: "email",
                    className: "form-input",
                    placeholder: "you@example.com",
                    value: email,
                    onChange: (e) => setEmail(e.target.value),
                    required: true,
                    disabled: loading,
                    autoComplete: "email"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "form-group", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "password", className: "form-label", children: "Password" }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "password-input-wrapper", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      id: "password",
                      type: showPassword ? "text" : "password",
                      className: "form-input with-toggle",
                      placeholder: isSignUp ? "Create a strong password" : "Enter your password",
                      value: password,
                      onChange: (e) => setPassword(e.target.value),
                      required: true,
                      disabled: loading,
                      minLength: "8",
                      autoComplete: isSignUp ? "new-password" : "current-password"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "button",
                    {
                      type: "button",
                      className: "password-toggle-btn",
                      onClick: () => setShowPassword(!showPassword),
                      tabIndex: "-1",
                      "aria-label": showPassword ? "Hide password" : "Show password",
                      children: showPassword ? "👁️" : "👁️‍🗨️"
                    }
                  )
                ] }),
                isSignUp && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "form-hint", children: "Must be at least 8 characters" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "submit",
                  className: "btn btn-primary",
                  disabled: loading,
                  children: loading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "btn-loading", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "spinner" }),
                    isSignUp ? "Creating Account..." : "Signing In..."
                  ] }) : isSignUp ? "Create Account" : "Sign In"
                }
              )
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "unified-auth-footer", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "auth-switch-text", children: [
              isSignUp ? "Already have an account?" : "Don't have an account?",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  className: "auth-switch-btn",
                  onClick: () => {
                    setIsSignUp(!isSignUp);
                    setMessage({ type: "", text: "" });
                  },
                  disabled: loading,
                  children: isSignUp ? "Sign In" : "Sign Up"
                }
              )
            ] }) })
          ] }),
          showEmailAuth && showSSOAuth && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "unified-auth-divider", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "divider-line" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "divider-text", children: "OR" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "divider-line" })
          ] }),
          showSSOAuth && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "unified-social-auth", children: enabledProviders.map((provider) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            UnifiedSSOButton,
            {
              provider,
              onSuccess: handleSSOSuccess,
              onError: handleSSOError,
              size: "large",
              fullWidth: true,
              style: "default",
              className: "sso-button-spacing",
              appwriteConfig
            },
            provider
          )) })
        ] }) }),
        loading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "unified-auth-overlay", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "unified-auth-loading-modal", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "spinner-large" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Processing authentication..." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "loading-hint", children: "Please wait while we sign you in" })
        ] }) })
      ] });
    };
    const createUnifiedSSOConfig = (projectName, overrides = {}) => {
      const baseConfig = {
        appwriteEndpoint: "https://nyc.cloud.appwrite.io/v1",
        databaseId: "main_db",
        enabledProviders: ["google", "github"],
        features: {
          emailAuth: true,
          ssoAuth: true,
          biometricAuth: false
        },
        oauth: {
          successUrl: window.location.origin + "/auth/success",
          errorUrl: window.location.origin + "/auth/error"
        }
      };
      const projectConfigs = {
        "recursion-chat": {
          appwriteProjectId: "689bdaf500072795b0f6",
          databaseId: "recursion_chat_db",
          enabledProviders: ["google", "github"]
        },
        "gx-multi-agent": {
          appwriteProjectId: "68a4e3da0022f3e129d0",
          databaseId: "gx_agents_db",
          enabledProviders: ["google", "github", "microsoft"]
        },
        "trading-post": {
          appwriteProjectId: "689bdee000098bd9d55c",
          databaseId: "trading_db",
          enabledProviders: ["google", "github", "microsoft"]
        },
        "slumlord": {
          appwriteProjectId: "68a0db634634a6d0392f",
          databaseId: "slumlord_db",
          enabledProviders: ["google", "github"]
        }
      };
      const projectConfig = projectConfigs[projectName] || {};
      return __spreadValues(__spreadValues(__spreadValues({}, baseConfig), projectConfig), overrides);
    };
    const RecursionChatUnifiedAuth = () => {
      const navigate = useNavigate();
      const { setUser } = useAuth$1();
      const ssoConfig = createUnifiedSSOConfig("recursion-chat", {
        appwriteEndpoint: "https://nyc.cloud.appwrite.io/v1",
        appwriteProjectId: "689bdaf500072795b0f6",
        databaseId: "recursion_chat_db",
        enabledProviders: ["google", "github"],
        features: {
          emailAuth: true,
          ssoAuth: true,
          biometricAuth: false
        },
        oauth: {
          successUrl: window.location.origin + "/auth/success",
          errorUrl: window.location.origin + "/auth/error"
        }
      });
      const handleAuthSuccess = (user) => {
        console.log("🎉 Recursion Chat authentication successful:", user);
        setUser(user);
        navigate("/modern");
      };
      const handleAuthError = (error) => {
        console.error("❌ Recursion Chat authentication failed:", error);
      };
      return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mobile-viewport mobile-safe-area recursion-auth-container", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "recursion-auth-wrapper", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "recursion-branding", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "recursion-logo", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-text", children: "Recursion" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "logo-accent", children: "Chat" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "recursion-tagline", children: "Real-time messaging with advanced features" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          UnifiedAuth,
          {
            appwriteConfig: ssoConfig,
            onSuccess: handleAuthSuccess,
            onError: handleAuthError,
            title: "Welcome to Recursion",
            subtitle: "Connect and communicate in real-time",
            enabledProviders: ["google", "github"],
            showEmailAuth: true,
            showSSOAuth: true,
            className: "recursion-auth"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "recursion-features", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feature-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "feature-icon", children: "💬" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "feature-text", children: "Real-time messaging" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feature-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "feature-icon", children: "🎨" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "feature-text", children: "Custom themes" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "feature-item", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "feature-icon", children: "🔒" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "feature-text", children: "Secure & private" })
          ] })
        ] })
      ] }) });
    };
    window.logError = (errorInfo) => {
      console.error("Application Error:", errorInfo);
    };
    const cleanupInvalidRoomCache = () => {
      const keysToCheck = [
        "selectedRoom",
        "lastSelectedRoom",
        "currentRoom",
        "cachedRoom",
        "recursion_selectedItems",
        "appwrite_room_cache",
        "activeRoom",
        "room_selection",
        "saved_room",
        "last_room",
        "default_room"
      ];
      const allKeys = Object.keys(localStorage);
      allKeys.forEach((key) => {
        try {
          const value = localStorage.getItem(key);
          if (value && (value.includes('"tech"') || value.includes("'tech'") || value.includes('id":"tech"') || value.includes("id':'tech'") || value.includes('room_id":"tech"') || value.includes("/tech") || value.includes("documents/tech"))) {
            localStorage.removeItem(key);
          }
        } catch (e) {
        }
      });
      keysToCheck.forEach((key) => {
        var _a2;
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed = JSON.parse(cached);
            if ((parsed == null ? void 0 : parsed.id) === "tech" || (parsed == null ? void 0 : parsed.id) === "random" || (parsed == null ? void 0 : parsed.id) === "ai" || (parsed == null ? void 0 : parsed.room_id) === "tech" || (parsed == null ? void 0 : parsed.roomId) === "tech" || ((_a2 = parsed == null ? void 0 : parsed.some) == null ? void 0 : _a2.call(parsed, (item) => ["tech", "random", "ai"].includes(item == null ? void 0 : item.id)))) {
              localStorage.removeItem(key);
            }
          }
        } catch (e) {
          localStorage.removeItem(key);
        }
      });
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach((key) => {
        try {
          const value = sessionStorage.getItem(key);
          if (value && (value.includes('"tech"') || value.includes("documents/tech"))) {
            sessionStorage.removeItem(key);
          }
        } catch (e) {
        }
      });
    };
    cleanupInvalidRoomCache();
    if (!window.location.hash.includes("/auth/success") && !window.location.hash.includes("/auth/callback")) {
      sessionStorage.removeItem("oauth-redirected");
    }
    window.addEventListener("error", (event) => {
      var _a2, _b2, _c2, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      if (((_a2 = event.message) == null ? void 0 : _a2.includes("Cannot access")) && ((_b2 = event.message) == null ? void 0 : _b2.includes("before initialization"))) {
        console.error("Initialization Error:", {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: (_c2 = event.error) == null ? void 0 : _c2.stack
        });
        window.logError({
          type: "initialization-error",
          message: event.message,
          stack: (_d = event.error) == null ? void 0 : _d.stack,
          url: window.location.href
        });
      }
      if (((_e = event.message) == null ? void 0 : _e.includes("MutationObserver")) || ((_f = event.filename) == null ? void 0 : _f.includes("web-client-content-script")) || ((_g = event.message) == null ? void 0 : _g.includes("parameter 1 is not of type 'Node'")) || ((_h = event.message) == null ? void 0 : _h.includes("runtime.lastError")) || ((_i = event.message) == null ? void 0 : _i.includes("extension port")) || ((_j = event.message) == null ? void 0 : _j.includes("back/forward cache")) || ((_k = event.message) == null ? void 0 : _k.includes("message channel is closed")) || ((_l = event.message) == null ? void 0 : _l.includes("Extension context invalidated"))) {
        event.preventDefault();
        return false;
      }
    });
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(" ");
      if (message.includes("ReferenceError") || message.includes("TypeError")) {
        console.warn("JavaScript Error detected:", message);
        window.logError({
          type: "javascript-error",
          message,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      if (message.includes("MutationObserver") || message.includes("web-client-content-script") || message.includes("parameter 1 is not of type") || message.includes("runtime.lastError") || message.includes("extension port") || message.includes("back/forward cache") || message.includes("message channel is closed") || message.includes("Extension context invalidated") || message.includes("Rl is not a constructor") || message.includes("qh is not a constructor") || message.includes("is not a constructor") && message.includes("appwrite")) {
        return;
      }
      originalError.apply(console, args);
    };
    window.addEventListener("unhandledrejection", (event) => {
      console.error("Unhandled Promise Rejection:", event.reason);
      window.logError({
        type: "unhandled-promise-rejection",
        reason: event.reason,
        promise: event.promise
      });
    });
    function AppWrapper() {
      const isMobileSafari = /iPhone|iPad|iPod/i.test(navigator.userAgent) && /Safari/i.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);
      const forceInstant = window.location.search.includes("instant") || localStorage.getItem("force_instant_app") === "true";
      const forceUnifiedSSO = window.location.search.includes("unified") || localStorage.getItem("force_unified_sso") === "true";
      const useInstantApp = isMobileSafari || forceInstant;
      const useUnifiedSSO = forceUnifiedSSO;
      if (useUnifiedSSO) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx(HashRouter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(RecursionChatUnifiedAuth, {}) });
      }
      if (useInstantApp) {
        return /* @__PURE__ */ jsxRuntimeExports.jsx(HashRouter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(MobileSafariInstantApp, {}) });
      }
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animated-background", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animated-gradient" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animated-pattern" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "floating-orbs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "orb orb-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "orb orb-2" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "orb orb-3" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(HashRouter, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(MobileSafariApp, {}) })
      ] });
    }
    try {
      const root = ReactDOM.createRoot(document.getElementById("root"));
      root.render(
        /* @__PURE__ */ jsxRuntimeExports.jsx(React.StrictMode, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppWrapper, {}) })
      );
      window.dispatchEvent(new CustomEvent("app-mounted"));
    } catch (error) {
      console.error("❌ React mount failed:", error);
      document.getElementById("root").innerHTML = '\n    <div style="padding: 20px; background: red; color: white; font-family: system-ui, sans-serif;">\n      <h1>React Mount Error</h1>\n      <p>Error: '.concat(error.message, '</p>\n      <p>Please refresh the page or contact support if the issue persists.</p>\n      <button onclick="window.location.reload()" style="\n        padding: 10px 20px; \n        background: white; \n        color: red; \n        border: none; \n        border-radius: 4px; \n        cursor: pointer; \n        margin-top: 10px;\n      ">\n        Refresh Page\n      </button>\n    </div>\n  ');
    }
    console.log("✅ RECURSION CHAT v3.0 - ALL FIXES APPLIED");
    console.log("🔧 - trackAuthState method added to mobile safari debugger");
    console.log("🎨 - UI components should render properly");
    console.log("🔐 - OAuth authentication should be working");
    console.log("🌍 - Deployed:", (/* @__PURE__ */ new Date()).toISOString());
  }
});
export default require_index_001();
