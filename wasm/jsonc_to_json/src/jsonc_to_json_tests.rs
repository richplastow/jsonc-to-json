use pretty_assertions::assert_eq;

use super::jsonc_to_json_native;

#[test]
fn simple_literals_round_trip() {
    assert_eq!(jsonc_to_json_native(""), "");
    assert_eq!(jsonc_to_json_native("123"), "123");
    assert_eq!(jsonc_to_json_native("null"), "null");
    assert_eq!(jsonc_to_json_native("true"), "true");
    assert_eq!(jsonc_to_json_native("\"string\""), "\"string\"");
    assert_eq!(jsonc_to_json_native("{\"a\":1,\"b\":2}"), "{\"a\":1,\"b\":2}");
    assert_eq!(jsonc_to_json_native("[1, null, true]"), "[1, null, true]");
}

#[test]
fn removes_full_line_comments() {
    let source = "// comment\n{\n  // comment\n  \"a\": 1,\n  \"b\": 2\n}\n// tail\n";
    let expected = "{\n  \"a\": 1,\n  \"b\": 2\n}\n";
    assert_eq!(jsonc_to_json_native(source), expected);

    let block_source = "/* comment */\n{\n  /* inner */\n  \"a\": 1,\n  \"b\": 2\n}\n/* tail */\n";
    assert_eq!(jsonc_to_json_native(block_source), expected);
}

#[test]
fn removes_inline_comments_and_trailing_commas() {
    let inline = "{\n  \"a\": 1, // a\n  \"b\": 2 /* b */\n}\n";
    let expected_inline = "{\n  \"a\": 1,\n  \"b\": 2\n}\n";
    assert_eq!(jsonc_to_json_native(inline), expected_inline);

    let trailing = "{\n  \"a\": 1,\n  \"b\": 2,\n}\n";
    assert_eq!(jsonc_to_json_native(trailing), expected_inline);

    let trailing_array = "[\n  1,\n  2,\n]\n";
    let expected_array = "[\n  1,\n  2\n]\n";
    assert_eq!(jsonc_to_json_native(trailing_array), expected_array);
}

#[test]
fn strings_survive_comment_sequences() {
    let source = "{\n  \"a\": \"This is not a // comment\",\n  \"b\": \"This is not a /* comment */ either\",\n}";
    let expected = "{\n  \"a\": \"This is not a // comment\",\n  \"b\": \"This is not a /* comment */ either\"\n}";
    assert_eq!(jsonc_to_json_native(source), expected);
}

#[test]
fn escaped_strings_are_preserved() {
    let source = String::from(r#"{
  "path": "C\tmp\file",
  "quote": "He said: \"/* not a comment */\""
}
"#);
    assert_eq!(jsonc_to_json_native(&source), source);
}
