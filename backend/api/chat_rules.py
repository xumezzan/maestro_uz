from .models import TaskResponse


def is_task_chat_pair_allowed(task, sender_id: int, receiver_id: int) -> bool:
    """
    Allow task chat only between:
    - the task client, and
    - a specialist user who has already responded to this task.
    """
    if sender_id == receiver_id:
        return False

    specialist_user_ids = set(
        TaskResponse.objects.filter(task_id=task.id).values_list('specialist__user_id', flat=True)
    )
    if not specialist_user_ids:
        return False

    client_id = task.client_id
    return (
        (sender_id == client_id and receiver_id in specialist_user_ids)
        or (receiver_id == client_id and sender_id in specialist_user_ids)
    )
