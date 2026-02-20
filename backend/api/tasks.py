from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger('api')

@shared_task
def send_notification_email(subject, message, recipient_list):
    """
    Sends an email asynchronously via Celery.
    """
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
        logger.info(f"Successfully sent email to {recipient_list}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {recipient_list}: {e}")
        return False
