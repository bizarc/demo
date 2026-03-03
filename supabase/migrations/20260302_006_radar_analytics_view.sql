-- Phase 4.2: RADAR — Campaign Analytics View

CREATE OR REPLACE VIEW campaign_analytics AS
SELECT
    c.id AS campaign_id,
    c.name AS campaign_name,
    c.status AS campaign_status,
    c.channel,
    c.mission_profile,
    COUNT(DISTINCT e.id) AS total_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.id END) AS active_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.id END) AS completed_enrollments,
    COUNT(DISTINCT CASE WHEN e.status = 'replied' THEN e.id END) AS replied_enrollments,
    COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) AS total_sent,
    COUNT(CASE WHEN oe.event_type = 'delivered' THEN 1 END) AS total_delivered,
    COUNT(DISTINCT CASE WHEN oe.event_type = 'opened' THEN oe.prospect_id END) AS unique_opens,
    COUNT(CASE WHEN oe.event_type = 'opened' THEN 1 END) AS total_opens,
    COUNT(DISTINCT CASE WHEN oe.event_type = 'clicked' THEN oe.prospect_id END) AS unique_clicks,
    COUNT(CASE WHEN oe.event_type = 'clicked' THEN 1 END) AS total_clicks,
    COUNT(DISTINCT CASE WHEN oe.event_type = 'replied' THEN oe.prospect_id END) AS unique_replies,
    COUNT(CASE WHEN oe.event_type = 'bounced' THEN 1 END) AS total_bounced,
    COUNT(CASE WHEN oe.event_type = 'unsubscribed' THEN 1 END) AS total_unsubscribed,
    COUNT(CASE WHEN oe.event_type = 'converted' THEN 1 END) AS total_converted,
    CASE
        WHEN COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) > 0
        THEN ROUND(
            COUNT(DISTINCT CASE WHEN oe.event_type = 'opened' THEN oe.prospect_id END)::NUMERIC
            / COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) * 100,
            2
        )
        ELSE 0
    END AS open_rate,
    CASE
        WHEN COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) > 0
        THEN ROUND(
            COUNT(DISTINCT CASE WHEN oe.event_type = 'replied' THEN oe.prospect_id END)::NUMERIC
            / COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) * 100,
            2
        )
        ELSE 0
    END AS reply_rate,
    CASE
        WHEN COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) > 0
        THEN ROUND(
            COUNT(DISTINCT CASE WHEN oe.event_type = 'clicked' THEN oe.prospect_id END)::NUMERIC
            / COUNT(CASE WHEN oe.event_type = 'sent' THEN 1 END) * 100,
            2
        )
        ELSE 0
    END AS click_rate,
    c.created_at,
    c.updated_at
FROM campaigns c
LEFT JOIN campaign_enrollments e ON e.campaign_id = c.id
LEFT JOIN outreach_events oe ON oe.campaign_id = c.id
GROUP BY c.id, c.name, c.status, c.channel, c.mission_profile, c.created_at, c.updated_at;
