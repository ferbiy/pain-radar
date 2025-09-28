export interface RedditPost {
  id: string;
  subreddit: string;
  title: string;
  content: string;
  url: string;
  score: number;
  numComments: number;
  created: Date;
}

export interface RedditComment {
  id: string;
  body: string;
  score: number;
  author: string;
}
