use pretty_assertions::assert_eq;

use crate::strip_comments::strip_comments_native;

#[test]
fn removes_line_comments_and_whitespace() {
    let source = "{\"a\":1, // comment\n\"b\":2}\n";
    let expected = "{\"a\":1,\n\"b\":2}\n";
    assert_eq!(strip_comments_native(source), expected);
}

#[test]
fn removes_block_comments_preserving_newlines() {
    let source = "before/* comment */\nafter";
    assert_eq!(strip_comments_native(source), "before\nafter");
}

#[test]
fn keeps_comment_like_strings() {
    let source = "{\"a\":\"This is not // a comment\",\"b\":\"/* nor this */\"}";
    assert_eq!(strip_comments_native(source), source);
}

#[test]
fn handles_escaped_characters_inside_strings() {
    let source = r#"{"path":"C\tmp\file","text":"Quote: \"//\""}"#;
    assert_eq!(strip_comments_native(source), source);
}
