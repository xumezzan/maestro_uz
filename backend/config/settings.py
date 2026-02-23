from pathlib import Path
import os
import environ
from datetime import timedelta
from django.core.exceptions import ImproperlyConfigured

# Initialize environ
env = environ.Env()

BASE_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BASE_DIR.parent

# Read .env from repository root (local dev) or backend root (containerized runs).
for candidate in (PROJECT_ROOT / '.env', BASE_DIR / '.env'):
    if candidate.exists():
        environ.Env.read_env(str(candidate))
        break

SECRET_KEY = env('DJANGO_SECRET_KEY', default='django-insecure-change-me-in-production')

DEBUG = env.bool('DEBUG', default=True)

if DEBUG:
    ALLOWED_HOSTS = env.list(
        'ALLOWED_HOSTS',
        default=['localhost', '127.0.0.1', '[::1]', 'testserver', '89.167.75.82'],
    )
else:
    # Always include localhost and 127.0.0.1 for internal health checks (Docker containers)
    ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])


# ---------------------------------------------------------------------------
# Production Security (only when DEBUG=False)
# ---------------------------------------------------------------------------
if not DEBUG:
    if SECRET_KEY in ['django-insecure-change-me-in-production', 'change-me-in-production-use-long-random-string']:
        raise ImproperlyConfigured("DJANGO_SECRET_KEY must be set in production.")
    if not ALLOWED_HOSTS:
        raise ImproperlyConfigured("ALLOWED_HOSTS must be set in production.")
    if '*' in ALLOWED_HOSTS:
        raise ImproperlyConfigured("ALLOWED_HOSTS cannot contain '*' in production.")

    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_SSL_REDIRECT = env.bool('SECURE_SSL_REDIRECT', default=True)
    SECURE_REDIRECT_EXEMPT = [r'^api/health/']
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'
    REFERRER_POLICY = 'strict-origin-when-cross-origin'
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
else:
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    CSRF_COOKIE_SAMESITE = 'Lax'

INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Third party
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'channels',
    # Local
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be at the top
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = env.bool('CORS_ALLOW_ALL_ORIGINS', default=DEBUG)
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[])
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[])

if not DEBUG and CORS_ALLOW_ALL_ORIGINS:
    raise ImproperlyConfigured("CORS_ALLOW_ALL_ORIGINS must be False in production.")

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# ---------------------------------------------------------------------------
# Channels (WebSockets)
# ---------------------------------------------------------------------------
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [env('REDIS_URL', default='redis://127.0.0.1:6379/0')],
        },
    },
}

# ---------------------------------------------------------------------------
# Celery Configuration
# ---------------------------------------------------------------------------
CELERY_BROKER_URL = env('REDIS_URL', default='redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = env('REDIS_URL', default='redis://127.0.0.1:6379/1')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Asia/Tashkent'

# ---------------------------------------------------------------------------
# Database
# ---------------------------------------------------------------------------
DATABASES = {
    'default': env.db('DATABASE_URL', default=f'sqlite:///{BASE_DIR / "db.sqlite3"}')
}
DATABASES['default']['CONN_MAX_AGE'] = env.int('DB_CONN_MAX_AGE', default=60)

# ---------------------------------------------------------------------------
# Cache (used by throttling + websocket anti-flood)
# ---------------------------------------------------------------------------
USE_REDIS_CACHE = env.bool('USE_REDIS_CACHE', default=not DEBUG)
CACHE_URL = env('CACHE_URL', default=env('REDIS_URL', default='redis://127.0.0.1:6379/2'))
if USE_REDIS_CACHE:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.redis.RedisCache',
            'LOCATION': CACHE_URL,
            'KEY_PREFIX': env('CACHE_KEY_PREFIX', default='maestro'),
        }
    }
else:
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'maestro-local-dev-cache',
        }
    }

if not DEBUG and not USE_REDIS_CACHE:
    raise ImproperlyConfigured("USE_REDIS_CACHE must be enabled in production.")

# ---------------------------------------------------------------------------
# Password Validation
# ---------------------------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8},
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# ---------------------------------------------------------------------------
# Internationalization
# ---------------------------------------------------------------------------
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Asia/Tashkent'
USE_I18N = True
USE_TZ = True

# ---------------------------------------------------------------------------
# Static & Media
# ---------------------------------------------------------------------------
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'static')
MEDIA_URL = 'media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

if not DEBUG:
    # Use django-storages for media in production
    if env('AWS_STORAGE_BUCKET_NAME', default=None):
        DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
        AWS_ACCESS_KEY_ID = env('AWS_ACCESS_KEY_ID')
        AWS_SECRET_ACCESS_KEY = env('AWS_SECRET_ACCESS_KEY')
        AWS_STORAGE_BUCKET_NAME = env('AWS_STORAGE_BUCKET_NAME')
        AWS_S3_REGION_NAME = env('AWS_S3_REGION_NAME', default='us-east-1')
        AWS_S3_ENDPOINT_URL = env('AWS_S3_ENDPOINT_URL', default=None)
        AWS_S3_SIGNATURE_VERSION = env('AWS_S3_SIGNATURE_VERSION', default='s3v4')
        AWS_DEFAULT_ACL = 'public-read'
        AWS_QUERYSTRING_AUTH = False
        
        # Optional: custom domain for S3
        if env('AWS_S3_CUSTOM_DOMAIN', default=None):
            AWS_S3_CUSTOM_DOMAIN = env('AWS_S3_CUSTOM_DOMAIN')

# ---------------------------------------------------------------------------
# Custom User Model
# ---------------------------------------------------------------------------
AUTH_USER_MODEL = 'api.User'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_THROTTLE_RATES': {
        # Auth endpoints
        'auth_register': env('THROTTLE_AUTH_REGISTER', default='5/hour'),
        'auth_verify_email': env('THROTTLE_AUTH_VERIFY_EMAIL', default='20/hour'),
        'auth_resend_verification': env('THROTTLE_AUTH_RESEND_VERIFICATION', default='5/hour'),
        'auth_login': env('THROTTLE_AUTH_LOGIN', default='10/minute'),
        'auth_refresh': env('THROTTLE_AUTH_REFRESH', default='30/minute'),
        'auth_forgot_password': env('THROTTLE_AUTH_FORGOT_PASSWORD', default='5/hour'),
        'auth_reset_password': env('THROTTLE_AUTH_RESET_PASSWORD', default='10/hour'),
        # Chat HTTP endpoint
        'chat_http_send': env('THROTTLE_CHAT_HTTP_SEND', default='120/minute'),
    },
}

# ---------------------------------------------------------------------------
# WebSocket Chat Limits
# ---------------------------------------------------------------------------
CHAT_WS_RATE_LIMIT = env.int('CHAT_WS_RATE_LIMIT', default=30)
CHAT_WS_RATE_WINDOW_SECONDS = env.int('CHAT_WS_RATE_WINDOW_SECONDS', default=10)
CHAT_WS_MAX_TEXT_LENGTH = env.int('CHAT_WS_MAX_TEXT_LENGTH', default=2000)

# ---------------------------------------------------------------------------
# Simple JWT — production-ready settings
# ---------------------------------------------------------------------------
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# ---------------------------------------------------------------------------
# Email
# ---------------------------------------------------------------------------
if DEBUG:
    EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
else:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
    EMAIL_PORT = env.int('EMAIL_PORT', default=587)
    EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
    EMAIL_USE_SSL = env.bool('EMAIL_USE_SSL', default=False)
    EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
    EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

DEFAULT_FROM_EMAIL = env('DEFAULT_FROM_EMAIL', default='noreply@maestro.uz')

# ---------------------------------------------------------------------------
# Frontend URL (for email links)
# ---------------------------------------------------------------------------
FRONTEND_URL = env('FRONTEND_URL', default='http://localhost:5173')

# ---------------------------------------------------------------------------
# Payment Gateways (Payme / Click)
# ---------------------------------------------------------------------------
PAYME_MERCHANT_ID = env('PAYME_MERCHANT_ID', default='')
PAYME_SECRET_KEY = env('PAYME_SECRET_KEY', default='')
CLICK_MERCHANT_ID = env('CLICK_MERCHANT_ID', default='')
CLICK_SERVICE_ID = env('CLICK_SERVICE_ID', default='')
CLICK_SECRET_KEY = env('CLICK_SECRET_KEY', default='')

# ---------------------------------------------------------------------------
# Logging (no secrets)
# ---------------------------------------------------------------------------
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'api': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
