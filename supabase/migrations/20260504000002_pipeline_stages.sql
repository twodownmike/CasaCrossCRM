-- Add reviewing and invited stages to the application pipeline.
alter type submission_status add value if not exists 'reviewing';
alter type submission_status add value if not exists 'invited';
