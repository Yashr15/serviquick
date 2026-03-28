// Shared service categories used across the app.
// The "others" entry is intentionally excluded from the provider sign-up
// list (providers select specific skills) but included everywhere a job
// category can be browsed or posted.
export const PROVIDER_CATEGORIES = ["plumber", "electrician", "gardener", "carpenter"];
export const JOB_CATEGORIES = [...PROVIDER_CATEGORIES, "others"];
