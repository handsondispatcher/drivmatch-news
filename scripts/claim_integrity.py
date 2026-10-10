"""Fail-closed provenance gate for future social-origin DrivMatch editorial items.

This is *not* an AI-text detector or a live X/Facebook connector.
It prevents an approved article whose origin_type is 'social-post' from being
published unless its event, origin, rights and review evidence are present.
"""
from datetime import datetime
from urllib.parse import urlparse

CONFIRMATION_STATES = frozenset({"PRIMARY_FACT_CONFIRMED", "CORROBORATED"})
SOCIAL_HOSTS = frozenset({
    "x.com", "twitter.com", "facebook.com", "m.facebook.com", "instagram.com",
    "youtube.com", "youtu.be", "threads.net", "bsky.app",
})


def _https(value):
    if not isinstance(value, str):
        return False
    parsed = urlparse(value.strip())
    return (parsed.scheme == "https" and bool(parsed.hostname)
            and not parsed.username and not parsed.password)


def _dated(value):
    if not isinstance(value, str):
        return False
    try:
        dt = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return dt.tzinfo is not None
    except ValueError:
        return False


def social_origin_ready_for_publication(article):
    """Do not infer truth from a verified account, a detector, or a blue check.

    Required attestations are made by a human reviewer (or a future separately
    validated structured fact-checking workflow). Boolean fields must be True,
    not arbitrary truthy strings.
    """
    if not isinstance(article, dict):
        return False
    if article.get("origin_type") != "social-post":
        return False
    if article.get("verification_state") not in CONFIRMATION_STATES:
        return False
    if article.get("status") != "approved":
        return False
    if article.get("usage_rights") not in ("owned", "licensed"):
        return False
    if not _https(article.get("source_url")):
        return False
    social = article.get("social_evidence")
    if not isinstance(social, dict):
        return False
    permalink = social.get("permalink")
    if not _https(permalink):
        return False
    if urlparse(permalink).hostname.lower().removeprefix("www.") not in SOCIAL_HOSTS:
        return False
    for key in ("source_identity_verified", "original_post_verified",
                "event_time_verified", "location_verified", "facts_confirmed",
                "rights_verified", "human_editor_approved"):
        if social.get(key) is not True:
            return False
    if not _dated(social.get("original_post_at")):
        return False
    if not _dated(social.get("event_at")):
        return False
    if not _dated(social.get("reviewed_at")):
        return False
    for flag in ("identity_impersonation_suspected", "manipulated_media_unresolved",
                 "recycled_media_unresolved", "material_contradiction_unresolved",
                 "source_retracted", "fabricated_event_suspected"):
        if social.get(flag) is True:
            return False
    if social.get("high_risk") is True:
        if social.get("specialist_review_approved") is not True:
            return False
        proof = social.get("independent_confirmation_urls")
        if not isinstance(proof, list) or not proof or not all(_https(x) for x in proof):
            return False
        if article.get("verification_state") != "CORROBORATED":
            return False
    return True
