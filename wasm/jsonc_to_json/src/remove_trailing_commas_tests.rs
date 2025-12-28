use pretty_assertions::assert_eq;

use crate::remove_trailing_commas::remove_trailing_commas_native;

#[test]
fn removes_object_trailing_commas() {
    let source = "{\n  \"a\": 1,\n}";
    let expected = "{\n  \"a\": 1\n}";
    assert_eq!(remove_trailing_commas_native(source), expected);
}

#[test]
fn removes_array_trailing_commas() {
    let source = "[\n  1,\n  2,\n]";
    let expected = "[\n  1,\n  2\n]";
    assert_eq!(remove_trailing_commas_native(source), expected);
}

#[test]
fn keeps_inner_commas_followed_by_values() {
    let source = "{\n  \"a\": [1, 2],\n  \"b\": 3\n}";
    let expected = "{\n  \"a\": [1, 2],\n  \"b\": 3\n}";
    assert_eq!(remove_trailing_commas_native(source), expected);
}

#[test]
fn ignores_commas_inside_strings() {
    let source = "{\"text\":\",\",\"other\":\"]\"}";
    assert_eq!(remove_trailing_commas_native(source), source);
}
