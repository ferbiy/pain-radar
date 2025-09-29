/**
 * Reddit API Response Types
 * Based on actual Reddit API responses from logs
 */

// Reddit API Authentication Response
export interface RedditAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

// Reddit API Listing Response
export interface RedditListingResponse {
  kind: "Listing";
  data: {
    after: string | null;
    dist: number;
    modhash: string | null;
    geo_filter: string | null;
    children: RedditPostWrapper[];
    before: string | null;
  };
}

// Reddit Post Wrapper
export interface RedditPostWrapper {
  kind: "t3";
  data: RedditPostData;
}

// Complete Reddit Post Data (based on actual API response)
export interface RedditPostData {
  // Basic post info
  id: string;
  title: string;
  selftext: string;
  selftext_html: string | null;
  author: string;
  author_fullname: string;
  subreddit: string;
  subreddit_name_prefixed: string;
  subreddit_id: string;
  subreddit_subscribers: number;

  // URLs and links
  url: string;
  permalink: string;
  domain: string;

  // Engagement metrics
  score: number;
  ups: number;
  downs: number;
  upvote_ratio: number;
  num_comments: number;
  num_crossposts: number;

  // Timestamps
  created: number;
  created_utc: number;

  // Post status
  archived: boolean;
  locked: boolean;
  pinned: boolean;
  stickied: boolean;
  over_18: boolean;
  spoiler: boolean;
  hidden: boolean;
  saved: boolean;
  clicked: boolean;
  visited: boolean;

  // Content classification
  is_self: boolean;
  is_video: boolean;
  is_original_content: boolean;
  is_reddit_media_domain: boolean;
  is_crosspostable: boolean;
  is_meta: boolean;

  // Moderation
  distinguished: string | null;
  mod_note: string | null;
  removal_reason: string | null;
  banned_by: string | null;
  approved_by: string | null;
  banned_at_utc: number | null;
  approved_at_utc: number | null;

  // Awards and premium
  gilded: number;
  total_awards_received: number;
  all_awardings: unknown[];
  awarders: unknown[];
  gildings: Record<string, unknown>;

  // Flair
  link_flair_text: string | null;
  link_flair_type: string;
  link_flair_css_class: string | null;
  link_flair_richtext: unknown[];
  link_flair_text_color: string;
  link_flair_background_color: string;
  link_flair_template_id: string | null;
  author_flair_text: string | null;
  author_flair_type: string;
  author_flair_css_class: string | null;
  author_flair_richtext: unknown[];
  author_flair_text_color: string | null;
  author_flair_background_color: string | null;
  author_flair_template_id: string | null;

  // Media
  thumbnail: string;
  thumbnail_width: number | null;
  thumbnail_height: number | null;
  preview?: {
    images: unknown[];
    enabled: boolean;
  };
  media: unknown | null;
  media_embed: Record<string, unknown>;
  secure_media: unknown | null;
  secure_media_embed: Record<string, unknown>;

  // Reddit internal
  name: string;
  quarantine: boolean;
  hide_score: boolean;
  subreddit_type: string;
  suggested_sort: string | null;
  likes: boolean | null;
  user_reports: unknown[];
  mod_reports: unknown[];
  report_reasons: unknown[] | null;

  // Misc
  category: string | null;
  content_categories: string[] | null;
  discussion_type: string | null;
  treatment_tags: unknown[];
  view_count: number | null;
  wls: number;
  pwls: number;
  contest_mode: boolean;
  can_mod_post: boolean;
  can_gild: boolean;
  allow_live_comments: boolean;
  send_replies: boolean;
  no_follow: boolean;
  is_robot_indexable: boolean;
  author_premium: boolean;
  author_patreon_flair: boolean;
  author_is_blocked: boolean;
  mod_reason_title: string | null;
  mod_reason_by: string | null;
  num_reports: number | null;
  top_awarded_type: string | null;
  is_created_from_ads_ui: boolean;
  url_overridden_by_dest?: string;
  post_hint?: string;
  media_only: boolean;
  edited: boolean | number;
}

// Reddit Comments Response
export type RedditCommentsResponse = [
  RedditListingResponse,
  RedditCommentsListing,
];

export interface RedditCommentsListing {
  kind: "Listing";
  data: {
    after: string | null;
    dist: number | null;
    modhash: string | null;
    geo_filter: string | null;
    children: RedditCommentWrapper[];
    before: string | null;
  };
}

export interface RedditCommentWrapper {
  kind: "t1";
  data: RedditCommentData;
}

export interface RedditCommentData {
  id: string;
  body: string;
  body_html: string;
  author: string;
  author_fullname: string;
  score: number;
  ups: number;
  downs: number;
  created: number;
  created_utc: number;
  edited: boolean | number;
  archived: boolean;
  locked: boolean;
  stickied: boolean;
  distinguished: string | null;
  is_submitter: boolean;
  score_hidden: boolean;
  permalink: string;
  parent_id: string;
  link_id: string;
  subreddit: string;
  subreddit_id: string;
  subreddit_name_prefixed: string;
  depth: number;
  collapsed: boolean;
  collapsed_reason: string | null;
  associated_award: unknown | null;
  author_flair_background_color: string | null;
  author_flair_css_class: string | null;
  author_flair_richtext: unknown[];
  author_flair_template_id: string | null;
  author_flair_text: string | null;
  author_flair_text_color: string | null;
  author_flair_type: string;
  author_patreon_flair: boolean;
  author_premium: boolean;
  can_gild: boolean;
  can_mod_post: boolean;
  collapsed_because_crowd_control: string | null;
  comment_type: string | null;
  controversiality: number;
  gilded: number;
  gildings: Record<string, unknown>;
  is_root: boolean;
  likes: boolean | null;
  mod_note: string | null;
  mod_reason_by: string | null;
  mod_reason_title: string | null;
  mod_reports: unknown[];
  name: string;
  no_follow: boolean;
  num_reports: number | null;
  removal_reason: string | null;
  replies: string | RedditCommentsListing;
  report_reasons: unknown[] | null;
  saved: boolean;
  send_replies: boolean;
  steward_reports: unknown[];
  subreddit_type: string;
  top_awarded_type: string | null;
  total_awards_received: number;
  treatment_tags: unknown[];
  unrepliable_reason: string | null;
  user_reports: unknown[];
}
