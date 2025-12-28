use pretty_assertions::assert_eq;

use crate::remove_blank_lines::remove_blank_lines_native;

#[test]
fn drops_empty_lines() {
    let source = "{\n\n  \"a\": 1\n}\n\n";
    let expected = "{\n  \"a\": 1\n}\n";
    assert_eq!(remove_blank_lines_native(source), expected);
}

#[test]
fn removes_whitespace_only_lines() {
    let source = "line1\n    \nline2";
    assert_eq!(remove_blank_lines_native(source), "line1\nline2");
}

#[test]
fn preserves_indentation_on_contentful_lines() {
    let source = "  indented\n\nnext";
    assert_eq!(remove_blank_lines_native(source), "  indented\nnext");
}
